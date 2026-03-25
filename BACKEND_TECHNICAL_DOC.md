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
Nucleo do sistema. Gerencia o ciclo completo de precificacao:
- `SolicitacaoAnalise`: recebe os parametros do usuario e enfileira a tarefa no Celery via `perform_create()` no ViewSet
- `ResultadoAnalise`: armazena os dados calculados pelo worker (volatilidade, taxa de juros, grade de precos em `dados_brutos`)

Tarefa Celery (`analises/tasks.py`):

| Tarefa | Descricao |
|--------|-----------|
| `processar_analise(solicitacao_id)` | Tarefa `@shared_task` com retry automatico (max 3, intervalo 30s). Transiciona `SolicitacaoAnalise` entre os estados `processando`, `concluido` e `erro`. Cria `ResultadoAnalise` com os campos calculados. |

Fluxo de estados de `SolicitacaoAnalise`:
```
aguardando -> processando -> concluido
                          -> erro (com retry automatico ate 3x)
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

**Serializers novos:**

| Serializer | Uso |
|------------|-----|
| `AnaliseCreateSerializer` | Entrada de `POST /create/`. Valida `commodity` e `quantidade_toneladas`. |
| `AnaliseDetailSerializer` | Saida de detalhe e criacao. Inclui `commodity_nome` via `_AnaliseComputedFieldsMixin`. |
| `AnaliseStatusCountSerializer` | Saida de `/status-count/`. Campos: `pendente`, `em_analise`, `aprovado`, `rejeitado`, `total`. |
| `_AnaliseComputedFieldsMixin` | Mixin interno que adiciona `commodity_nome` (campo computado read-only). |

**Tarefa Celery:**

| Tarefa | Caminho | Descricao |
|--------|---------|-----------|
| `processar_analise` | `dados.tasks.processar_analise` | Recebe `analise_id`. Guarda contra status diferente de `pendente` (idempotencia). Transiciona para `em_analise` e preenche `resultado` com placeholder. |

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

### Pipeline de normalizacao

Dados de commodity (precos, exportacao):

1. Dados brutos (DataFrame pandas) recebidos da fonte
2. Normalizacao em `dados/limpeza/agrobr.py` para lista de dicts: `codigo_commodity`, `data_preco`, `preco_fechamento` (inteiro em centavos), `fonte`
3. Persistencia via `persistir_cache_dados_mercado()` em `CacheDadosMercado` (upsert por `commodity + data_preco + fonte`)

Dados macroeconomicos (BCB):

1. DataFrame com index=data e colunas=indicadores recebido do `python-bcb`
2. Normalizacao em `dados/limpeza/bcb.py` para lista de dicts: `indicador`, `data`, `valor` (float), `fonte`
3. Persistencia via `persistir_dados_macroeconomicos()` em `DadosMacroeconomicos` (upsert por `indicador + data`)

Precos de commodity sao armazenados como inteiros (centavos) para evitar imprecisao de ponto flutuante. Indicadores macro usam `DecimalField(max_digits=18, decimal_places=6)`.

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

## Typos nos nomes de modelos (pendente correcao futura)

| Local | Nome atual | Nome correto |
|-------|-----------|-------------|
| `commodities/models.py` | `Comomodity` | `Commodity` |
| `meses_contrato_futuro/models.py` | `MesContratoFurturo` | `MesContratoFuturo` |

A correcao requer nova migration e renomeacao coordenada de ViewSets e serializers. Nao foi feita automaticamente para evitar migrations nao solicitadas.