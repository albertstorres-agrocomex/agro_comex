# SPEC — AgroComex

## Arquitetura Geral

```
agro_comex/
  landing_page/   # Next.js — site institucional (Vercel)
  frontend/       # Next.js — aplicacao principal (Vercel)
  backend/        # Django REST Framework — API e servicos (Render)
```

---

## Deploys

| Projeto | Plataforma | Branch producao | Branch staging |
|---|---|---|---|
| landing_page | Vercel | `main` | `hml` |
| frontend | Vercel | `main` | `hml` |
| backend | Render | `main` | `hml` |

## URLs

- Landing Page: https://agro-comex-landing.vercel.app
- Frontend: —
- Backend API: —

---

## Backend

### Stack

| Tecnologia | Versao | Uso |
|---|---|---|
| Python | — | Linguagem |
| Django | 6.0.3 | Framework web |
| Django REST Framework | 3.17.0 | API REST |
| Celery | 5.6.2 | Processamento assincrono |
| Redis | 6.4.0 | Message broker (Celery) |
| PostgreSQL (psycopg2-binary 2.9.11) | — | Banco de dados |
| django-celery-results | 2.6.0 | Armazenamento de resultados Celery no banco |
| django-celery-beat | 2.7.0 | Agendamento de tarefas periodicas (cron) |
| python-bcb | — | Cliente BCB SGS para series temporais (cambio, SELIC, IPCA) |
| agrobr | — | Cliente B3 (futuros) e CEPEA (precos) |
| pandas | — | Normalizacao de DataFrames na camada de limpeza de dados |
| python-decouple | 3.8 | Gerenciamento de variaveis de ambiente |

### Configuracoes relevantes

- **Banco de dados:** PostgreSQL — credenciais via variaveis de ambiente (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`)
- **Celery broker:** Redis (`REDIS_URL`, default `redis://localhost:6379/0`)
- **Celery result backend:** `django-db`
- **Timezone:** `America/Sao_Paulo`
- **Idioma:** `pt-br`
- **DRF renderers/parsers:** JSONRenderer e JSONParser apenas
- **Autenticacao:** nao configurada explicitamente — pendente antes de producao

### Apps Django

| App | Descricao |
|---|---|
| `commodities` | Cadastro de commodities negociadas |
| `tipos_derivativo` | Tipos de derivativos e seus requisitos de campos |
| `meses_contrato_futuro` | Contratos futuros por commodity e mes |
| `dados` | Cache de serie historica de precos de mercado e dados macroeconomicos |
| `analises` | Solicitacoes, resultados, cenarios e curva de resultado de analise de risco |
| `usuario` | Extensao do Usuario Django |
| `authentication` | Autenticacao JWT (login, refresh, logout, perfil) |

### Modelos de Dados

#### `usuario.Usuario`
| Campo | Tipo | Obs |
|---|---|---|
| user | OneToOneField (Django User) | PROTECT, nullable |
| criado_em | DateTimeField | auto_now_add |
| atualizado_em | DateTimeField | auto_now |

#### `commodities.Comomodity` (*)
| Campo | Tipo | Obs |
|---|---|---|
| codigo | CharField(10) | |
| nome | CharField(100) | |
| bolsa | CharField(20) | |
| unidade | CharField(30) | |
| moeda | CharField(5) | |
| ativo | BooleanField | default True |

(*) Typo no nome da classe — pendente correcao futura.

#### `tipos_derivativo.TipoDerivativo`
| Campo | Tipo | Obs |
|---|---|---|
| nome | CharField(50) | |
| rotulo | CharField(50) | |
| descricao | TextField | nullable |
| requer_barreira | BooleanField | default False |
| requer_posicao | BooleanField | default False |

#### `meses_contrato_futuro.MesContratoFurturo` (*)
| Campo | Tipo | Obs |
|---|---|---|
| commodity | ForeignKey (Comomodity) | PROTECT |
| codigo_mes | CharField(1) | |
| ano | SmallIntegerField | |
| data_vencimento | DateField | |
| ticket_completo | CharField(20) | nullable |
| ativo | BooleanField | default True |

Unique: `(commodity, codigo_mes, ano)`. (*) Typo no nome da classe — pendente correcao futura.

#### `dados.CacheDadosMercado`
| Campo | Tipo | Obs |
|---|---|---|
| commodity | ForeignKey (Comomodity) | PROTECT |
| data_preco | DateField | |
| preco_fechamento | IntegerField | centavos de USD na unidade padrao da commodity |
| fonte | CharField(50) | nullable |
| qualidade | CharField(10) | `OK` / `SUSPEITO` / `INVALIDO` — default `OK` |
| motivo_qualidade | TextField | nullable — ex: `VARIACAO_DIARIA:+23.4%\|DESVIO_HISTORICO:z=3.8` |
| justificado | BooleanField | default False — operador confirmou que outlier e evento real |
| justificativa | TextField | nullable — descricao humana da causa do outlier |
| obtido_em | DateTimeField | auto_now_add |

Unique: `(commodity, data_preco, fonte)`. Possivel exclusao futura.

**Contrato de qualidade**: todos os registros persistidos — inclusive `INVALIDO` — participam dos calculos de volatilidade e Black-Scholes. O flag `qualidade` e exclusivamente para catalogacao e auditoria. Um `INVALIDO` no banco nunca e NaN ou valor negativo (esses sao descartados antes da persistencia).

#### `analises.SolicitacaoAnalise`
| Campo | Tipo | Obs |
|---|---|---|
| usuario | ForeignKey (Usuario) | PROTECT |
| commodity | ForeignKey (Comomodity) | PROTECT |
| tipo_derivativo | ForeignKey (TipoDerivativo) | PROTECT |
| mes_contrato | ForeignKey (MesContratoFurturo) | PROTECT — obrigatorio na criacao |
| preco_mercado_atual | IntegerField | |
| posicao | CharField(12) | nullable — obrigatorio se requer_posicao |
| nivel_barreira | IntegerField | nullable — obrigatorio se requer_barreira |
| preco_exercicio | IntegerField | Strike da opcao em centavos — obrigatorio na criacao |
| quantidade_sacas | IntegerField | Volume do contrato em numero de sacas — obrigatorio na criacao |
| unidade_quantidade | CharField | Unidade informada pelo usuario (sacas ou toneladas) — obrigatorio na criacao |
| status | CharField | choices: aguardando / processando / concluido / erro / aprovado / rejeitado |
| id_tarefa_worker | CharField(100) | nullable — ID Celery |
| criado_em | DateTimeField | auto_now_add |

Regra de validacao: `posicao` e `nivel_barreira` sao obrigatorios se o `TipoDerivativo` correspondente tiver `requer_posicao=True` / `requer_barreira=True`. Os campos `preco_exercicio`, `quantidade_sacas`, `unidade_quantidade` e `mes_contrato` sao sempre obrigatorios na criacao (validados no serializer).

#### `analises.ResultadoAnalise`
| Campo | Tipo | Obs |
|---|---|---|
| solicitacao | ForeignKey (SolicitacaoAnalise) | CASCADE |
| premio_calculado | IntegerField (null) | Preco da opcao calculado pelo Black-Scholes, em centavos |
| percentual_premio | DecimalField(8,4) (null) | Premio como percentual do preco de mercado atual |
| valor_total_contrato | IntegerField (null) | Premio multiplicado pela quantidade de sacas, em centavos |
| lucro_maximo | IntegerField (null) | (strike - premio) * qtd para put; null para call |
| volatilidade_utilizada | DecimalField(8,6) (null) | Volatilidade historica anualizada (ultimos 252 pregoes) |
| taxa_juros_utilizada | DecimalField(8,6) (null) | Taxa SELIC anual em decimal (ex: 0.1075 para 10,75%) |
| dados_brutos | JSONField (null) | Parametros intermediarios: d1, d2, S, K, T, r, sigma |
| cenario_escolhido | ForeignKey (CenarioAnalise) (null) | Cenario selecionado pelo usuario como preferido |
| calculado_em | DateTimeField | auto_now_add |

#### `analises.CenarioAnalise`
| Campo | Tipo | Obs |
|---|---|---|
| resultado | ForeignKey (ResultadoAnalise) | CASCADE |
| strike | IntegerField | Preco de exercicio do cenario em centavos |
| premio_calculado | IntegerField | Premio Black-Scholes para este strike, em centavos |
| percentual_premio | DecimalField(8,4) | Premio como % do preco de mercado |
| valor_total_contrato | IntegerField | Premio * quantidade_sacas, em centavos |
| lucro_maximo | IntegerField (null) | Apenas para put; null para call |
| recomendado | BooleanField | True se for o cenario recomendado pelo sistema |
| escolhido | BooleanField | True se o usuario selecionou este cenario (exclusivo por resultado) |
| criado_em | DateTimeField | auto_now_add |

#### `analises.PontoCurvaResultado`
| Campo | Tipo | Obs |
|---|---|---|
| cenario | ForeignKey (CenarioAnalise) | CASCADE |
| preco_ativo | IntegerField | Preco do ativo no ponto da curva, em centavos |
| resultado_financeiro | IntegerField | Lucro/prejuizo no ponto, em centavos |
| ordem | SmallIntegerField | Indice de ordenacao do ponto na curva |

### Endpoints REST

Base URL: `/api/v1/`

Todos os recursos seguem o padrao ModelViewSet (CRUD completo):

| Recurso | Rota | Metodos |
|---|---|---|
| Usuarios | `usuario/` | GET, POST, PUT, PATCH, DELETE |
| Commodities selecionadas | `usuario/commodities/` | GET, PUT |
| Commodities | `commodities/` | GET, POST, PUT, PATCH, DELETE |
| Tipos de Derivativo | `tipos_derivativo/` | GET, POST, PUT, PATCH, DELETE |
| Meses de Contrato | `meses_contrato_futuro/` | GET, POST, PUT, PATCH, DELETE |
| Cache de Dados | `cache_dados_mercado/` | GET, POST, PUT, PATCH, DELETE |
| Solicitacoes de Analise | `solicitacao_analise/` | GET, POST, PUT, PATCH, DELETE |
| Resultados de Analise | `resultado_analise/` | GET, POST, PUT, PATCH, DELETE |
| Escolha de Cenario | `cenarios/{id}/escolher/` | PATCH |
| Autenticacao | `authentication/token/` | POST |
| Refresh Token | `authentication/token/refresh/` | POST |
| Logout | `authentication/logout/` | POST |
| Perfil | `authentication/me/` | GET, PATCH |

Exemplo:
- `GET /api/v1/commodities/` — lista
- `GET /api/v1/commodities/{id}/` — detalhe
- `POST /api/v1/commodities/` — criacao
- `PUT /api/v1/commodities/{id}/` — atualizacao total
- `PATCH /api/v1/commodities/{id}/` — atualizacao parcial
- `DELETE /api/v1/commodities/{id}/` — remocao

### Fluxo de analise (assincrono)

```
POST /api/v1/solicitacao_analise/
  -> SolicitacaoAnalise criada (status: aguardando)
  -> perform_create() enfileira processar_analise.delay(solicitacao_id)
  -> worker: status = processando
  -> worker: calcula volatilidade, taxa_juros via Black-Scholes
  -> worker: executa executar_analise_cenarios() — 3 strikes automaticos
  -> worker: para cada cenario: calcular_curva_resultado()
  -> worker: recomendar_cenario() — criterio maior valor + ponto equilibrio
  -> worker: salva ResultadoAnalise + CenarioAnalise[] + PontoCurvaResultado[]
  -> worker: status = concluido
  -> em caso de excecao: retry ate 3x, depois status = erro

PATCH /api/v1/cenarios/{id}/escolher/
  -> desativa escolhido=True de todos os cenarios do mesmo ResultadoAnalise
  -> marca escolhido=True no cenario alvo
```

### Fluxo de atualizacao de dados de mercado (periodico)

```
Cron (celery-beat)
  -> tarefas: atualizar_cambio / atualizar_selic_ipca / atualizar_futuros_b3 / atualizar_precos_cepea
  -> busca taxa USD/BRL via obter_taxa_usd_brl() (obrigatorio para B3 ZC e todo CEPEA)
  -> busca dados da fonte (BCB SGS / agrobr)
  -> limpeza/normalizacao (dados/limpeza/agrobr.py) -> lista de dicts
  -> conversao de unidade/moeda (dados/limpeza/conversao.py) -> preco em USD/unidade-padrao
  -> [* 100] -> preco_fechamento em centavos de USD
  -> validar_preco() (dados/validacao/qualidade.py):
       Etapa 1: falha estrutural (<=0, NaN) -> descarta, nao persiste
       Etapa 2: outlier (variacao diaria / z-score) -> persiste com flag qualidade
  -> persistir_cache_dados_mercado() -> upsert em CacheDadosMercado com qualidade/motivo
```

### Qualidade de Dados

**Contrato fundamental**: todos os registros persistidos participam dos calculos de volatilidade e Black-Scholes, independente do flag `qualidade`. Outliers causados por eventos reais (guerras, pandemias, crises) fazem parte da historia do mercado e devem influenciar os modelos.

O flag e para catalogacao e auditoria — nao para exclusao de calculos.

| Categoria | Descricao | Comportamento |
|-----------|-----------|---------------|
| Etapa 1 — Estrutural | nulo, negativo, tipo errado, range macro invalido | Descartado — nunca persiste |
| Etapa 2 — `SUSPEITO` | variacao diaria > 15% ou z-score > 3sigma | Persiste com flag |
| Etapa 2 — `INVALIDO` | variacao diaria > 50% ou z-score > 5sigma | Persiste com flag |

O pior resultado prevalece (`INVALIDO > SUSPEITO > OK`). Multiplos motivos sao concatenados com `|` no campo `motivo_qualidade`.

### Apps Django (modulos internos relevantes)

| App | Modulo | Arquivo | Descricao |
|-----|--------|---------|-----------|
| `analises` | Tarefas | `analises/tasks.py` | `processar_analise` — task principal de precificacao com cenarios |
| `analises` | Calculadoras | `analises/calculators.py` | Black-Scholes, `executar_analise_cenarios`, `calcular_curva_resultado`, `recomendar_cenario`, `toneladas_para_sacas` |
| `dados` | Servico | `dados/servicos.py` | `persistir_cache_dados_mercado` — upsert de cache com validacao de qualidade |
| `dados` | Tarefas externas | `dados/tasks/agrobr.py` | Integracao B3 e CEPEA |
| `dados` | Tarefas externas | `dados/tasks/bcb.py` | Integracao BCB (cambio, SELIC, IPCA) |
| `dados` | Normalizacao | `dados/limpeza/agrobr.py` | DataFrame B3/CEPEA -> dicts padronizados |
| `dados` | Normalizacao | `dados/limpeza/bcb.py` | Series BCB -> dicts padronizados |
| `dados` | Conversao | `dados/limpeza/conversao.py` | Converte unidade/moeda por contrato para USD/unidade-padrao |
| `dados` | Validacao | `dados/validacao/qualidade.py` | QualidadeDado enum, validar_preco, validar_macro, validar_exportacao |
| `dados` | Comando | `dados/management/commands/reset_dados_mercado.py` | Reset seletivo de tabelas de mercado |
| `authentication` | Views | `authentication/views.py` | Login, refresh, logout, perfil — JWT com cookie HttpOnly |

---

## Frontend

### Stack

Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui (New York) + Recharts + react-simple-maps.

Ver `FRONTEND_TECHNICAL_DOC.md` para documentacao completa de componentes, tokens e rotas.

### Componentes de Visualizacao

| Componente | Biblioteca | Descricao |
|---|---|---|
| BarChartComex | Recharts | Grafico de barras com multiplas series |
| LineChartComex | Recharts | Grafico de linha com linha de tendencia |
| PieChartComex | Recharts | Donut chart com legenda lateral |
| WorldMapComex | react-simple-maps | Mapa coropletico mundial interativo |

### Design System

Tokens OKLCH em `frontend/src/app/globals.css`. Dark mode via seletor `.dark`. Styleguide interativo em `/styleguide`.
