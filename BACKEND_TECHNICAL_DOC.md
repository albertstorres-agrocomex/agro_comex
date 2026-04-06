# Backend Technical Doc — AgroComex

## Visão Geral

- **Diretório:** `backend/`
- **Deploy:** Render
- **URL produção:** —

## Stack

- Python + Django Rest Framework
- Celery (worker assíncrono)
- Redis (broker Celery + cache de resultados)
- PostgreSQL (banco de dados principal)
- Deploy: Render

## Modelo de Dados — Apps e Responsabilidades

### `commodities`
Catálogo de ativos negociáveis (Soja, Milho, Café, Açúcar). Cada commodity define a bolsa de referência, unidade e moeda. MVP usa CBOT como bolsa principal para Soja e Milho; ICE para Café e Açúcar.

### `meses_contrato_futuro`
Catálogo de contratos futuros disponíveis por commodity. Governa quais vencimentos o usuário pode selecionar na UI — cada commodity tem meses válidos específicos (ex: Soja negocia em Jan/Mar/Mai/Jul/Ago/Set/Nov na CBOT). O campo `ticket_completo` é o identificador usado para consulta de preço em API externa.

### `tipos_derivativo`
Catálogo de estruturas financeiras que o sistema consegue precificar. Não é calculado pelo worker — **instrui** o worker sobre qual modelo matemático aplicar e quais parâmetros esperar na solicitação.

| Campo | Papel |
|-------|-------|
| `nome` | Identificador técnico usado pelo worker para selecionar a fórmula (ex: `call`, `put`, `knock_out`) |
| `rotulo` | Label de exibição na UI |
| `requer_barreira` | Indica que o tipo usa cláusula de barreira (ex: knock-out, knock-in) |
| `requer_posicao` | Indica que o tipo deve especificar lado do contrato (comprador ou vendedor da commodity) |

### `usuario`
Perfil de usuário da aplicação, estendendo `auth.User` do Django via `OneToOneField`. `primeiro_nome` e `sobrenome` são lidos diretamente de `auth_user`.

Relacionamento M2M com `commodities.Comomodity` via campo `commodities` (tabela `usuario_commodity`). Usado para persistir as commodities de interesse do usuário, exibidas no dashboard.

### `dados`
Cache local de preços de fechamento para cálculo de volatilidade histórica. Possível remoção futura, substituída por consulta direta à API de mercado.

Submodulos internos do app `dados`:

| Modulo | Caminho | Descricao |
|--------|---------|-----------|
| Servico de persistencia | `dados/servicos.py` | `persistir_cache_dados_mercado()` — upsert de registros normalizados em `CacheDadosMercado` |
| Tarefas de integracao | `dados/tasks/agrobr.py` | Busca futuros B3 e precos CEPEA via biblioteca `agrobr` |
| Tarefas de integracao | `dados/tasks/bcb.py` | Busca cambio (USD/BRL, EUR/BRL) e indices (SELIC, IPCA) via `python-bcb` |
| Pipeline de normalizacao | `dados/limpeza/agrobr.py` | Converte DataFrames B3/CEPEA para lista de dicts padronizados |
| Pipeline de normalizacao | `dados/limpeza/bcb.py` | Converte series BCB para lista de dicts padronizados |

### `dados` — Model Analise

O model `Analise` (app `dados`, migration `0006_add_analise` e `0007_analise_add_fields`) representa uma solicitacao de analise iniciada pelo usuario. Campos relevantes alem dos basicos:

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `commodity` | ForeignKey | Commodity associada |
| `usuario` | ForeignKey | Usuario que criou (isolamento por usuario nas views) |
| `status` | CharField | `pendente` / `em_analise` / `aprovado` / `rejeitado` |
| `resultado` | TextField | Texto de resultado preenchido pelo worker (default `""`) |
| `quantidade_toneladas` | DecimalField(12,4) | Volume opcional informado pelo usuario; nullable |

---

### `analises`
Nucleo do sistema. Gerencia o ciclo completo de precificacao e analise de cenarios:
- `SolicitacaoAnalise`: recebe os parametros do usuario e enfileira a tarefa no Celery via `perform_create()` no ViewSet
- `ResultadoAnalise`: armazena os dados calculados pelo worker (volatilidade, taxa de juros, campos Black-Scholes, cenario escolhido)
- `CenarioAnalise`: representa um cenario de strike alternativo gerado automaticamente; armazena premio, curva e flags `recomendado`/`escolhido`
- `PontoCurvaResultado`: pontos da curva de resultado (preco_ativo x resultado_financeiro) para um cenario

Tarefas Celery (`analises/tasks.py`):

| Tarefa | Descricao |
|--------|-----------|
| `processar_analise(solicitacao_id)` | Tarefa `@shared_task` com retry automatico (max 3, intervalo 30s). Transiciona `SolicitacaoAnalise` entre os estados `processando`, `concluido` e `erro`. Chama `executar_analise_cenarios`, persiste `ResultadoAnalise`, `CenarioAnalise[]` e `PontoCurvaResultado[]`. |

Funcoes em `analises/calculators.py`:

| Funcao | Descricao |
|--------|-----------|
| `calcular_black_scholes(S, K, T, r, sigma, tipo)` | Precificacao Black-Scholes para call ou put. Retorna premio, percentual, valor total, lucro_maximo. |
| `executar_analise_cenarios(solicitacao)` | Gera 3 strikes automaticos (K-10%, K, K+10%), calcula Black-Scholes para cada um. |
| `calcular_curva_resultado(cenario)` | Gera serie de pontos (preco_ativo, resultado_financeiro) para exibicao da curva de payoff. |
| `recomendar_cenario(cenarios)` | Seleciona o cenario de maior valor esperado; considera ponto de equilibrio como criterio desempate. |
| `toneladas_para_sacas(toneladas, commodity)` | Converte toneladas para sacas conforme peso por saca da commodity. |

Fluxo de estados de `SolicitacaoAnalise`:
```
aguardando -> processando -> concluido
                          -> erro (com retry automatico ate 3x)
aguardando -> processando -> concluido -> aprovado
                                       -> rejeitado
```

---

## Regras de Negócio e Validação

### Validação de campos condicionais em `SolicitacaoAnalise`

Os campos `nivel_barreira` e `posicao` são opcionais no banco mas **obrigatórios em nível de aplicação** dependendo do tipo de derivativo selecionado:

| Condição | Campo obrigatório |
|----------|------------------|
| `tipo_derivativo.requer_barreira = true` | `nivel_barreira` deve ser preenchido |
| `tipo_derivativo.requer_posicao = true` | `posicao` deve ser preenchida (`comprado` ou `vendido`) |

**Esta validação não é garantida pelo banco de dados.** Deve ser implementada:
1. No serializer DRF de `SolicitacaoAnalise` (validação na entrada da API)
2. No worker Celery antes de iniciar o cálculo (validação defensiva)

Falhar em validar esses campos resulta em erro de precificação silencioso ou resultado incorreto.

---

## Endpoints

Todos os endpoints seguem o padrao REST gerado pelo `DefaultRouter` do DRF. O prefixo base e `/api/v1/`.

| Metodo | URL | Descricao |
|--------|-----|-----------|
| GET | `/api/v1/commodities/` | Lista commodities ativas (paginado 10/pag, busca por `?search=`, requer auth) |
| POST | `/api/v1/commodities/` | Cria uma commodity |
| GET | `/api/v1/commodities/{id}/` | Detalhe de uma commodity |
| PUT/PATCH | `/api/v1/commodities/{id}/` | Atualiza uma commodity |
| DELETE | `/api/v1/commodities/{id}/` | Remove uma commodity |
| GET | `/api/v1/usuario/commodities/` | Retorna IDs das commodities selecionadas pelo usuario autenticado |
| PUT | `/api/v1/usuario/commodities/` | Substitui a selecao completa do usuario (lista de IDs inteiros) |
| GET/POST | `/api/v1/meses_contrato_futuro/` | Lista / cria meses de contrato futuro |
| GET/PUT/PATCH/DELETE | `/api/v1/meses_contrato_futuro/{id}/` | Detalhe / atualiza / remove |
| GET/POST | `/api/v1/tipos_derivativo/` | Lista / cria tipos de derivativo |
| GET/PUT/PATCH/DELETE | `/api/v1/tipos_derivativo/{id}/` | Detalhe / atualiza / remove |
| GET/POST | `/api/v1/usuario/` | Lista / cria perfis de usuario |
| GET/PUT/PATCH/DELETE | `/api/v1/usuario/{id}/` | Detalhe / atualiza / remove |
| GET/POST | `/api/v1/cache_dados_mercado/` | Lista / cria registros de cache de preco |
| GET/PUT/PATCH/DELETE | `/api/v1/cache_dados_mercado/{id}/` | Detalhe / atualiza / remove |
| GET/POST | `/api/v1/solicitacao_analise/` | Lista / cria solicitacoes de analise |
| GET/PUT/PATCH/DELETE | `/api/v1/solicitacao_analise/{id}/` | Detalhe / atualiza / remove |
| GET/POST | `/api/v1/resultado_analise/` | Lista / cria resultados de analise |
| GET/PUT/PATCH/DELETE | `/api/v1/resultado_analise/{id}/` | Detalhe / atualiza / remove |
| PATCH | `/api/v1/cenarios/{id}/escolher/` | Marca cenario como escolhido (exclusividade — desmarca outros do mesmo resultado) |

### Endpoints de Analise (app `dados`)

Todos requerem autenticacao Bearer. As views operam exclusivamente sobre registros do `request.user` (isolamento por usuario).

| Metodo | URL | Descricao |
|--------|-----|-----------|
| GET | `/api/v1/dados/analises/` | Lista paginada (6/pag). Filtro opcional: `?status=pendente\|em_analise\|aprovado\|rejeitado\|todos` |
| POST | `/api/v1/dados/analises/create/` | Cria analise. Retorna `AnaliseDetailSerializer`. Enfileira `processar_analise` no Celery. |
| GET | `/api/v1/dados/analises/status-count/` | Retorna contagens por status + total (`AnaliseStatusCountSerializer`) |
| GET | `/api/v1/dados/analises/<id>/` | Detalhe de uma analise (somente do usuario autenticado) |
| PATCH | `/api/v1/dados/analises/<id>/aprovar/` | Aprova a analise. Exige `status=em_analise`; retorna HTTP 409 se estado invalido. |
| PATCH | `/api/v1/dados/analises/<id>/reprovar/` | Reprova a analise. Mesmas regras de estado que `/aprovar/`. |

**Serializers:**

| Serializer | Uso |
|------------|-----|
| `AnaliseCreateSerializer` | Entrada de `POST /create/`. Valida `commodity`, `quantidade_toneladas`, `preco_exercicio`, `mes_contrato`. |
| `AnaliseDetailSerializer` | Saida de detalhe e criacao. Inclui `commodity_nome` e campos do resultado Black-Scholes. |
| `AnaliseStatusCountSerializer` | Saida de `/status-count/`. Campos: `pendente`, `em_analise`, `aprovado`, `rejeitado`, `total`. |
| `CenarioAnaliseSerializer` | Saida de cenarios com pontos da curva de resultado. |
| `PontoCurvaResultadoSerializer` | Pontos (preco_ativo, resultado_financeiro) de um cenario. |
| `ResultadoAnaliseSerializer` | Extendido para incluir `cenarios[]` com serializers acima. |
| `_AnaliseComputedFieldsMixin` | Mixin interno que adiciona `commodity_nome` (campo computado read-only). |

**Tarefa Celery:**

| Tarefa | Caminho | Descricao |
|--------|---------|-----------|
| `processar_analise` | `analises.tasks.processar_analise` | Recebe `solicitacao_id`. Guarda contra status diferente de `aguardando` (idempotencia). Transiciona para `processando`, executa Black-Scholes com cenarios, persiste ResultadoAnalise + CenarioAnalise[] + PontoCurvaResultado[]. |

### Estrutura de URLs por app

Cada app registra seu proprio router e expoe `urlpatterns = router.urls`. O `core/urls.py` inclui cada app sob o prefixo `/api/v1/`.

### Observacoes sobre autorizacao

A maioria dos ViewSets usa `ModelViewSet` sem restricao de permissao configurada. Excecoes com autorizacao ja configurada:
- `ComomodityViewSet` — `permission_classes = [IsAuthenticated]`
- `UserCommoditiesView` — `permission_classes = [IsAuthenticated]`, opera exclusivamente sobre `request.user.usuarios` (sem aceitar `user_id` externo)

Antes de ir para producao, e obrigatorio configurar `permission_classes` nos demais ViewSets ou globalmente em `settings.py` (via `DEFAULT_PERMISSION_CLASSES`).

---

## Pipeline de Integracao de Dados Externos

### Fontes x Commodities suportadas

| Fonte | Soja (ZS) | Milho (ZC) | Cafe (KC) | Acucar (SB) |
|-------|-----------|------------|-----------|-------------|
| CEPEA via `agrobr` | sim | sim | sim | nao (nao suportado pela lib) |
| B3 via `agrobr` | sim (soja_fob, soja_cross) | sim | sim (cafe_arabica) | nao (sem contrato) |
| ComexStat via `agrobr` | sim | sim | sim | sim |
| BCB SGS | n/a (indicador macro) | n/a (indicador macro) | n/a (indicador macro) | n/a (indicador macro) |
| PROHORT via `agrobr` | nao (hortifruti) | nao (hortifruti) | nao (hortifruti) | nao (hortifruti) |
| Estimativa Safra (CONAB) | sim | sim | nao (nao suportado) | nao (nao suportado) |

### Tarefas Celery configuradas

| Fonte | Dados | Tarefa Celery | Horario (BRT, dias uteis) |
|-------|-------|---------------|---------------------------|
| BCB SGS | Cambio USD/BRL (serie 10813), EUR/BRL (21619) | `atualizar_cambio` | 19:00 |
| BCB SGS | SELIC (serie 1), IPCA (serie 433) | `atualizar_selic_ipca` | 20:00 |
| B3 via `agrobr` | Futuros: milho, soja (ZC, ZS) | `atualizar_futuros_b3` | 19:30 |
| CEPEA via `agrobr` | Precos spot: soja, milho, cafe | `atualizar_precos_cepea` | 18:00 |
| CONAB via `agrobr` | Estimativa de safra: soja, milho | *(task stub)* | 08:00, dia 5 do mes |
| ComexStat via `agrobr` | Exportacao: soja, milho, cafe, acucar | *(task stub)* | 08:00, dia 6 do mes |
| PROHORT via `agrobr` | Precos de hortifruti (nao aplica ao MVP) | *(task stub)* | 08:00 |

### Mapeamento nome fonte -> codigo banco

Definido em `backend/dados/limpeza/agrobr.py` como `COMMODITY_NOME_PARA_CODIGO`:

```python
COMMODITY_NOME_PARA_CODIGO = {
    "soja":         "ZS",  # CEPEA, ComexStat
    "soja_cross":   "ZS",  # B3
    "soja_fob":     "ZS",  # B3
    "milho":        "ZC",  # CEPEA, B3, ComexStat
    "cafe":         "KC",  # CEPEA, ComexStat
    "cafe_arabica": "KC",  # B3
    "acucar":       "SB",  # ComexStat (unica fonte que suporta acucar)
}
```

### Pipeline de normalizacao e qualidade

Fluxo completo para precos de commodity:

```
Fonte externa (agrobr lib)
        |
        v
normalizar_*()           [dados/limpeza/agrobr.py]
  - extrai coluna correta do DataFrame (B3: "ajuste_atual"; CEPEA: "valor")
  - mapeia nome fonte -> codigo_commodity (COMMODITY_NOME_PARA_CODIGO)
        |
        v
converter_*()            [dados/limpeza/conversao.py]
  - converte unidade/moeda para padrao da commodity
  - resultado: USD/unidade-nativa (USD/bu ou USD/lb)
        |
        v
[* 100] -> preco_fechamento em centavos de USD
        |
        v
validar_preco()          [dados/validacao/qualidade.py]
  - Etapa 1 (estrutural): preco <= 0 ou NaN -> descarta, nao persiste
  - Etapa 2 (outlier): variacao diaria + z-score historico -> flag
  - retorna (QualidadeDado, motivo_str)
        |
        v
persistir_*()            [dados/servicos.py]
  - grava com campos qualidade, motivo_qualidade
```

Dados macroeconomicos (BCB):

1. DataFrame com index=data e colunas=indicadores recebido do `python-bcb`
2. Normalizacao em `dados/limpeza/bcb.py` para lista de dicts: `indicador`, `data`, `valor` (float), `fonte`
3. `validar_macro()` — range check estrutural por indicador; falhas descartadas
4. Persistencia via `persistir_dados_macroeconomicos()` em `DadosMacroeconomicos` (upsert por `indicador + data`)

Precos de commodity sao armazenados como inteiros (centavos) para evitar imprecisao de ponto flutuante. Indicadores macro usam `DecimalField(max_digits=18, decimal_places=6)`.

### Conversao de unidade por fonte

Cada contrato B3 e o CEPEA retornam precos em unidades distintas. A conversao para a unidade padrao da commodity ocorre em `dados/limpeza/conversao.py`.

#### Constantes fisicas (fontes: USDA, CBOT, ICE)

```python
SACA_KG              = 60.0
KG_PER_BUSHEL_CORN   = 25.401   # milho USDA
KG_PER_BUSHEL_SOY    = 27.216   # soja USDA
KG_PER_LB            = 0.45359237

SACAS_PER_BUSHEL_ZC  = 60 / 25.401   # ~2.362
SACAS_PER_BUSHEL_ZS  = 60 / 27.216   # ~2.205
LBS_PER_SACA_KC      = 60 / 0.4536   # ~132.277
BU_PER_MT_ZS         = 1000 / 27.216 # ~36.744
```

#### Mapeamento B3

| Codigo | Contrato B3 | Unidade B3 | Conversao para USD/unidade-padrao |
|--------|-------------|-----------|-----------------------------------|
| ZC | CCM | BRL/saca (60 kg) | `preco / SACAS_PER_BUSHEL_ZC / usd_brl` |
| ZS | SFI (soja_fob) | USD/tonelada metrica | `preco / BU_PER_MT_ZS` |
| KC | ICF (cafe_arabica) | USD/saca (60 kg) | `preco / LBS_PER_SACA_KC` |

#### Mapeamento CEPEA

| Codigo | Unidade CEPEA | Moeda | Conversao para USD/unidade-padrao |
|--------|--------------|-------|-----------------------------------|
| ZC | saca (60 kg) | BRL | `preco / SACAS_PER_BUSHEL_ZC / usd_brl` |
| ZS | saca (60 kg) | BRL | `preco / SACAS_PER_BUSHEL_ZS / usd_brl` |
| KC | saca (60 kg) | BRL | `preco / LBS_PER_SACA_KC / usd_brl` |

A taxa `usd_brl` e obtida via `obter_taxa_usd_brl()` que le `DadosMacroeconomicos` (indicador=`USD_BRL`). Se a taxa estiver ausente ou desatualizada (> 7 dias), a ingestao CEPEA e abortada e a ingestao B3 ignora contratos em BRL (ZC/CCM).

### Qualidade de dados

Campos adicionados a `CacheDadosMercado`, `DadosMacroeconomicos` e `ExportacaoMensal`:

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `qualidade` | CharField | `OK` / `SUSPEITO` / `INVALIDO` |
| `motivo_qualidade` | TextField (nullable) | Ex: `VARIACAO_DIARIA:+23.4%\|DESVIO_HISTORICO:z=3.8` |
| `justificado` | BooleanField | Operador confirmou que outlier e evento real |
| `justificativa` | TextField (nullable) | Ex: "Guerra Russia-Ucrania: pico milho fev/2022" |

#### Thresholds de outlier para precos

| Metrica | SUSPEITO | INVALIDO |
|---------|----------|---------|
| Variacao diaria absoluta | > 15% | > 50% |
| Z-score (janela 90 dias) | > 3sigma | > 5sigma |

**Principio fundamental**: todos os registros persistidos — inclusive `INVALIDO` — participam dos calculos de volatilidade e Black-Scholes. Guerras, pandemias e crises geram outliers reais que fazem parte da historia do mercado. O flag e exclusivamente para catalogacao e auditoria.

Um `INVALIDO` no banco **nunca e NaN ou valor negativo** — esses sao descartados na Etapa 1 e nao chegam ao banco.

### Reset e re-ingestao

Para zerar dados de mercado e re-ingerir com a pipeline corrigida:

```bash
python manage.py reset_dados_mercado          # lista tabelas, nao executa
python manage.py reset_dados_mercado --confirm # executa o reset
```

**Tabelas zeradas**: `cache_dados_mercado`, `dados_macroeconomicos`, `exportacao_mensal`, `solicitacoes_analise`, `resultados_analise`, `cenarios_analise`, `pontos_curva_resultado`.

**Tabelas preservadas**: `commodities`, `auth_user`, `usuarios_perfil`, tabelas de configuracao.

Apos o reset, re-acionar as tasks Celery na ordem: BCB cambio -> B3/CEPEA -> exportacao.

### Model DadosMacroeconomicos

Indicadores macroeconomicos do BCB sao persistidos em tabela separada (`dados_macroeconomicos`), pois nao sao precos de commodity. Campos: `indicador`, `data`, `valor`, `fonte`, `obtido_em`.

Indicadores suportados: `USD_BRL`, `EUR_BRL`, `SELIC`, `IPCA`.

Usado em `ResultadoAnalise` para `taxa_juros_utilizada` e correcao monetaria.

### Limitacoes conhecidas

- **CEPEA**: nao suporta `acucar` via agrobr (validos: soja, milho, boi, cafe, trigo, algodao). `COMMODITIES_CEPEA = ["soja", "milho", "cafe"]`.
- **B3**: nao tem contrato de acucar via agrobr. Contratos `cafe_conillon`, `boi`, `etanol` nao mapeados para commodities do banco — sao ignorados silenciosamente.
- **Estimativa Safra (CONAB)**: requer Playwright (pode nao estar instalado no ambiente). Fallback IBGE usa schema incompativel com o contrato CONAB (`ContractViolation` antes de chegar ao normalizador). Cafe e acucar nao suportados. `CULTURAS = ["soja", "milho"]`.
- **PROHORT**: cobre exclusivamente hortifruti (TOMATE, BATATA, LARANJA etc.). Nenhuma das 4 commodities do MVP retorna registros em `CacheDadosMercado` — comportamento esperado para o MVP.
- **BCB**: indicadores macro nao sao commodities. Persistidos em `DadosMacroeconomicos`, nao em `CacheDadosMercado`.

### Tarefas periodicas (django-celery-beat)

Configuradas via migration `dados/0002_periodic_tasks.py`. Todas ativas por padrao, timezone `America/Sao_Paulo`. Os paths das tasks foram corrigidos pela migration `dados/0004_update_task_paths.py` apos reorganizacao em submodulos (`dados/tasks/agrobr.py` e `dados/tasks/bcb.py`).

---

## Autenticacao JWT

### Dependencias adicionadas

| Pacote | Versao | Uso |
|--------|--------|-----|
| `django-cors-headers` | 4.9.0 | CORS para requisicoes do frontend |
| `djangorestframework-simplejwt` | 5.5.1 | JWT com suporte a blacklist |

### App de autenticacao: `backend/authentication/`

| Arquivo | Conteudo |
|---------|----------|
| `views.py` | 4 views: `CustomTokenObtainPairView`, `CustomTokenRefreshView`, `LogoutView`, `MeuPerfilView` |
| `serializers.py` | 3 serializers: `CustomTokenObtainPairSerializer`, `MeuPerfilSerializer`, `LogoutSerializer` |
| `urls.py` | 5 endpoints registrados sob `/api/v1/authentication/` |

### Estrategia de tokens (OWASP A02/A07)

- **Access token**: retornado no body da resposta. Armazenado em memoria no frontend (nunca em localStorage). Expira em 15 minutos.
- **Refresh token**: definido como cookie `HttpOnly + Secure + SameSite="Lax"`, path restrito a `/api/v1/authentication/`. Expira em 7 dias. Rotacao ativada. Blacklist ativada.

### Endpoints de autenticacao

| Metodo | Path | Auth | Descricao |
|--------|------|------|-----------|
| POST | `/api/v1/authentication/token/` | Nao | Login. Body: `{username, password}`. Retorna: `{access, group, primeiro_nome}`. Seta cookie refresh. |
| POST | `/api/v1/authentication/token/refresh/` | Nao (cookie) | Renova access token via cookie HttpOnly. Retorna: `{access, group, primeiro_nome}`. |
| POST | `/api/v1/authentication/token/verify/` | Nao | Verifica validade de um access token. |
| POST | `/api/v1/authentication/logout/` | Bearer | Blacklista o refresh token e apaga o cookie. |
| GET | `/api/v1/authentication/me/` | Bearer | Retorna perfil do usuario autenticado. |
| PATCH | `/api/v1/authentication/me/` | Bearer | Atualiza email e/ou senha. Body: `{email?, senha_atual?, nova_senha?, confirmar_senha?}`. |

### Configuracoes relevantes (settings.py)

- `SIMPLE_JWT`: access=15min, refresh=7 dias, rotacao ativada, blacklist ativado.
- `JWT_REFRESH_COOKIE_*`: name=`refresh_token`, path=`/api/v1/authentication/`, `httponly=True`, `secure=not DEBUG`.
- `CORS_ALLOWED_ORIGINS`: `["http://localhost:3000"]` — adicionar origin de producao antes do deploy.
- `DEFAULT_AUTHENTICATION_CLASSES`: apenas `JWTAuthentication` (sem `BasicAuthentication`).
- `DEFAULT_THROTTLE_RATES`: `auth=10/min`.

### Tipos de usuario

| Tipo | Descricao |
|------|-----------|
| `Usuarios` | Tabela existente (app `usuario`), relacionada por `OneToOneField` ao `auth.User` do Django. E o cliente do sistema. |
| `Administradores` | Nao modelado ainda. Sera adicionado ao final do projeto. Referencias no codigo de autenticacao estao comentadas com `# TODO`. |

---

## Precificacao de Opcoes — Black-Scholes

### Algoritmo utilizado

O sistema utiliza o modelo Black-Scholes para precificacao de opcoes europeias (exercicio apenas no vencimento). A implementacao vive em `backend/analises/calculators.py` e usa exclusivamente a stdlib Python (`math`, `decimal`, `datetime`) — sem dependencias externas.

### Parametros de entrada

| Parametro | Origem | Campo no modelo |
|-----------|--------|-----------------|
| S — preco atual do ativo | Ultimo preco em `CacheDadosMercado` | `SolicitacaoAnalise.preco_mercado_atual` |
| K — strike / preco de exercicio | Informado pelo usuario (obrigatorio) | `SolicitacaoAnalise.preco_exercicio` |
| T — tempo ate vencimento (anos) | Calculado de `MesContratoFurturo.data_vencimento` | — |
| r — taxa livre de risco | SELIC mais recente em `DadosMacroeconomicos` | — |
| sigma — volatilidade anualizada | Desvio padrao dos retornos log dos ultimos 252 pregoes em `CacheDadosMercado` | — |

### Saidas calculadas

| Campo | Formula |
|-------|---------|
| `premio_calculado` | Black-Scholes C (call) ou P (put), convertido para centavos |
| `percentual_premio` | `premio / preco_atual * 100` |
| `valor_total_contrato` | `premio_centavos * quantidade_sacas` |
| `lucro_maximo` | `max(0, K - premio) * quantidade_sacas` — apenas para put; null para call |

### Tipos de derivativo suportados

| Tipo | Rotulo | Suportado | Motivo |
|------|--------|-----------|--------|
| Call | `CALL` | Sim | Black-Scholes europeu |
| Put | `PUT` | Sim | Black-Scholes europeu |
| Call com Barreira | `CALL-B` | Nao — status `erro` | Exige modelo de opcoes exoticas (Reiner-Rubinstein) |
| Put com Barreira | `PUT-B` | Nao — status `erro` | Exige modelo de opcoes exoticas (Reiner-Rubinstein) |
| Forward | `FWD` | Nao — status `erro` | Exige modelo de cost-of-carry, nao Black-Scholes |
| Swap | `SWAP` | Nao — status `erro` | Exige modelo de VPL de fluxos descontados |

A rejeicao e feita em `executar_calculo_bs()` com mensagem descritiva antes de qualquer calculo.

---

### Modelos para implementacao futura

#### Call com Barreira / Put com Barreira — Reiner-Rubinstein (1991)

Opcoes com barreira sao opcoes exoticas cujo payoff depende de o preco do ativo ter tocado ou nao um nivel de barreira `H` durante a vigencia do contrato:

- **Knock-Out**: a opcao e extinta se o preco tocar `H` antes do vencimento
- **Knock-In**: a opcao so passa a existir se o preco tocar `H` antes do vencimento

A formula analitica e uma extensao do Black-Scholes com os seguintes parametros adicionais:

```
H  = nivel da barreira (campo nivel_barreira, em centavos no banco)
mu = (r - sigma^2 / 2) / sigma^2
lambda = sqrt(mu^2 + 2*r / sigma^2)
x1 = ln(S/H) / (sigma * sqrt(T)) + lambda * sigma * sqrt(T)
y1 = ln(H/S) / (sigma * sqrt(T)) + lambda * sigma * sqrt(T)
y  = ln(H^2 / (S*K)) / (sigma * sqrt(T)) + lambda * sigma * sqrt(T)
```

O premio e calculado combinando termos N(x1), N(y), N(y1) ponderados por `(H/S)^(2*lambda)`, variando conforme o tipo (down-in, down-out, up-in, up-out) e a direcao (call ou put).

Referencia: Reiner, E. & Rubinstein, M. (1991). "Breaking Down the Barriers". Risk Magazine, 4(8), 28-35.

Parametro extra necessario no model/serializer: `nivel_barreira` (ja existe como `IntegerField` em centavos) e o subtipo de barreira (knock-in vs knock-out — campo a criar em `TipoDerivativo` ou como escolha do usuario no formulario).

---

#### Forward — Modelo de Cost-of-Carry

O preco justo de um contrato a termo sobre commodity e dado por:

```
F = S * e^((r + u - y) * T)
```

onde:
- `S` = preco spot atual do ativo
- `r` = taxa de juros livre de risco (SELIC)
- `u` = custo de armazenamento (storage cost) como percentual anualizado
- `y` = convenience yield (beneficio de manter o fisico disponivel)
- `T` = tempo ate vencimento em anos

Para commodities agricolas brasileiras, `u` e `y` podem ser aproximados por dados de mercado futuro da B3 (basis entre spot e futuro). Na ausencia de dados granulares, `u - y` pode ser tratado como parametro de calibracao.

O resultado `F` representa o preco de entrega que torna o contrato com valor presente zero no inicio. Para marcar a mercado (MTM), o VPL do forward e:

```
VPL = (F_mercado - K) * Q * e^(-r * T)
```

onde `K` e o preco acordado e `Q` a quantidade.

---

#### Swap de Commodity — VPL de Fluxos Descontados

Um swap de commodity troca um preco fixo `K` por um preco flutuante (spot ou forward) ao longo de N periodos de liquidacao. O valor presente do swap para o pagador do fixo e:

```
VPL = sum_{i=1}^{N} (F_i - K) * Q * delta_t_i * e^(-r_i * t_i)
```

onde:
- `F_i` = preco forward para o periodo `i` (calculado pelo modelo de cost-of-carry acima)
- `K` = preco fixo acordado
- `Q` = quantidade por periodo
- `delta_t_i` = duracao do periodo `i` em anos
- `r_i` = taxa de desconto para o vencimento `t_i`
- `t_i` = tempo em anos ate o final do periodo `i`

Para um swap de liquidacao unica (caso mais simples), reduz-se a:

```
VPL = (F - K) * Q * e^(-r * T)
```

Implementacao requer: curva de forwards para multiplos vencimentos (disponivel via dados B3 futuros ja coletados) e interpolacao de taxa de desconto por prazo.

### Conversao de unidade no input

O usuario pode informar quantidade em sacas ou toneladas. A conversao e feita no serializer via `toneladas_para_sacas()` em `calculators.py`.

| Commodity | Peso por saca |
|-----------|--------------|
| SOJA      | 60 kg        |
| MILHO     | 60 kg        |
| CAFE      | 60 kg        |
| ACUCAR    | 50 kg        |

### Auditoria

Os valores intermediarios (d1, d2, S, K, T, r, sigma, premio_reais) sao armazenados em `ResultadoAnalise.dados_brutos` (JSONField) para cada analise calculada.

---

## Typos nos nomes de modelos (pendente correcao futura)

| Local | Nome atual | Nome correto |
|-------|-----------|-------------|
| `commodities/models.py` | `Comomodity` | `Commodity` |
| `meses_contrato_futuro/models.py` | `MesContratoFurturo` | `MesContratoFuturo` |

A correcao requer nova migration e renomeacao coordenada de ViewSets e serializers. Nao foi feita automaticamente para evitar migrations nao solicitadas.