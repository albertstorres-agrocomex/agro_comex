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
| `dados` | Cache de serie historica de precos de mercado |
| `analises` | Solicitacoes e resultados de analise de risco |
| `usuario` | Extensao do Usuario Django |

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
| preco_fechamento | IntegerField | |
| fonte | CharField(50) | nullable |
| obtido_em | DateTimeField | auto_now_add |

Unique: `(commodity, data_preco, fonte)`. Possivel exclusao futura.

#### `analises.SolicitacaoAnalise`
| Campo | Tipo | Obs |
|---|---|---|
| usuario | ForeignKey (Usuario) | PROTECT |
| commodity | ForeignKey (Comomodity) | PROTECT |
| tipo_derivativo | ForeignKey (TipoDerivativo) | PROTECT |
| mes_contrato | ForeignKey (MesContratoFurturo) | PROTECT, nullable |
| preco_mercado_atual | IntegerField | |
| posicao | CharField(12) | nullable — obrigatorio se requer_posicao |
| nivel_barreira | IntegerField | nullable — obrigatorio se requer_barreira |
| status | CharField | choices: aguardanto / processando / concluido / erro |
| id_tarefa_worker | CharField(100) | nullable — ID Celery |
| criado_em | DateTimeField | auto_now_add |

Regra de validacao: `posicao` e `nivel_barreira` sao obrigatorios se o `TipoDerivativo` correspondente tiver `requer_posicao=True` / `requer_barreira=True`.

#### `analises.ResultadoAnalise`
| Campo | Tipo | Obs |
|---|---|---|
| solicitacao | ForeignKey (SolicitacaoAnalise) | CASCADE |
| nivel_acumulacao | IntegerField | nullable |
| volatilidade_utilizada | DecimalField(8, 6) | nullable |
| taxa_juros_utilizada | DecimalField(8, 6) | nullable |
| dados_brutos | JSONField | nullable |
| calculado_em | DateTimeField | auto_now_add |

### Endpoints REST

Base URL: `/api/v1/`

Todos os recursos seguem o padrao ModelViewSet (CRUD completo):

| Recurso | Rota | Metodos |
|---|---|---|
| Usuarios | `usuario/` | GET, POST, PUT, PATCH, DELETE |
| Commodities | `commodities/` | GET, POST, PUT, PATCH, DELETE |
| Tipos de Derivativo | `tipos_derivativo/` | GET, POST, PUT, PATCH, DELETE |
| Meses de Contrato | `meses_contrato_futuro/` | GET, POST, PUT, PATCH, DELETE |
| Cache de Dados | `cache_dados_mercado/` | GET, POST, PUT, PATCH, DELETE |
| Solicitacoes de Analise | `solicitacao_analise/` | GET, POST, PUT, PATCH, DELETE |
| Resultados de Analise | `resultado_analise/` | GET, POST, PUT, PATCH, DELETE |

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
  -> SolicitacaoAnalise criada (status: aguardanto)
  -> Celery worker processa
  -> ResultadoAnalise salvo no banco
  -> status atualizado para concluido (ou erro)
```

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
