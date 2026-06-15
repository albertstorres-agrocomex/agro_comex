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
| banco de dados | Neon (serverless PostgreSQL) | projeto `agro-comex-prod` | — |

### Configuracao do banco de producao (Neon)

- Conexao via `DATABASE_URL` (env var no Render).
- SSL obrigatorio (`sslmode=require` ja incluso na connection string do Neon).
- Extensao `pgvector` habilitada manualmente no SQL Editor do Neon antes do primeiro deploy.
- Migrations aplicadas automaticamente pelo `build.sh` a cada deploy.

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
| langchain + langchain-openai | 0.3.25 / 0.3.18 | Agent LLM com tool calling |
| openai | 1.82.0 | GPT-4o-mini (chat streaming) + text-embedding-3-small (RAG) |
| pgvector | 0.4.2 | Campo VectorField + busca coseno no Django ORM |
| uvicorn | 0.34.3 | Servidor ASGI para endpoints SSE |

### Configuracoes relevantes

- **Banco de dados:** PostgreSQL — credenciais via variaveis de ambiente (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`)
- **Celery broker:** Redis (`REDIS_URL`, default `redis://localhost:6379/0`)
- **Celery result backend:** `django-db`
- **Timezone:** `America/Sao_Paulo`
- **Idioma:** `pt-br`
- **DRF renderers/parsers:** JSONRenderer e JSONParser apenas
- **Autenticacao:** JWT via `djangorestframework-simplejwt` — access token 15 min (body), refresh token 7 dias (cookie HttpOnly), rotacao + blacklist

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
| `chatbot` | Mauro (assistente IA): LangChain Agent + SSE + RAG (pgvector) |
| `core` | Configuracoes globais e URLs raiz do projeto |

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
| percentual_premio | DecimalField(12,4) (null) | Premio como percentual do preco de mercado atual |
| valor_total_contrato | IntegerField (null) | Premio multiplicado pela quantidade de sacas, em centavos |
| lucro_maximo | IntegerField (null) | (strike - premio) * qtd para put; null para call |
| volatilidade_utilizada | DecimalField(8,6) (null) | Volatilidade historica anualizada (ultimos 252 pregoes) |
| taxa_juros_utilizada | DecimalField(8,6) (null) | Taxa SELIC anual em decimal (ex: 0.1075 para 10,75%) |
| d1 | DecimalField(12,6) (null) | Parametro d1 da formula Black-Scholes |
| d2 | DecimalField(12,6) (null) | Parametro d2 da formula Black-Scholes |
| calculado_em | DateTimeField | auto_now_add |

#### `analises.CenarioAnalise`
| Campo | Tipo | Obs |
|---|---|---|
| resultado | ForeignKey (ResultadoAnalise) | CASCADE, related_name="cenarios" |
| nome | CharField(20) | choices: conservador / moderado / agressivo / proposto |
| preco_exercicio_centavos | IntegerField | Strike do cenario em centavos |
| premio_centavos | IntegerField | Premio Black-Scholes para este strike, em centavos |
| e_recomendado | BooleanField | True se for o cenario recomendado pelo sistema; default False |
| escolhido_pelo_usuario | BooleanField | True se o usuario selecionou este cenario; default False |
| escolhido_em | DateTimeField (null) | Momento em que o usuario escolheu o cenario |

Unique: `(resultado, nome)`. O cenario `proposto` usa o `preco_exercicio` informado diretamente pelo usuario; os outros tres sao gerados automaticamente (K-10%, K, K+10% do preco de mercado).

#### `analises.PontoCurvaResultado`
| Campo | Tipo | Obs |
|---|---|---|
| cenario | ForeignKey (CenarioAnalise) | CASCADE, related_name="pontos_curva" |
| preco_centavos | IntegerField | Preco do ativo no ponto da curva, em centavos |
| resultado_centavos | IntegerField | Lucro/prejuizo no ponto, em centavos |

Ordering padrao: `preco_centavos` (ASC).

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
| Criar conversa | `chat/conversations/` | POST — body `{ analise_id?: number, client_hour?: number }`; resposta `{ id, created_at, greeting: string \| null }` |
| Detalhe de conversa | `chat/conversations/{uuid}/` | GET |
| Stream de mensagem (SSE) | `chat/stream/` | POST |

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

PATCH /api/v1/dados/analises/<id>/aprovar/
  -> exige status=concluido; transiciona para aprovado; retorna HTTP 409 se estado invalido

PATCH /api/v1/dados/analises/<id>/reprovar/
  -> exige status=concluido; transiciona para rejeitado; retorna HTTP 409 se estado invalido

PATCH /api/v1/cenarios/{id}/escolher/
  -> desativa escolhido_pelo_usuario=True de todos os cenarios do mesmo ResultadoAnalise
  -> marca escolhido_pelo_usuario=True e registra escolhido_em no cenario alvo
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
| `chatbot` | Views | `chatbot/views.py` | `ConversationCreateView`, `ChatStreamView` (async SSE) |
| `chatbot` | Agent | `chatbot/agent.py` | `create_agent_executor` — LangChain Agent GPT-4o-mini com 2 tools |
| `chatbot` | Tool 1 | `chatbot/tool_db.py` | `consultar_analises` — busca ORM com filtros por keyword |
| `chatbot` | Tool 2 | `chatbot/tool_rag.py` | `busca_semantica` — pgvector CosineDistance top-5 |
| `chatbot` | Embedding | `chatbot/embedding.py` | `build_embedding_content`, `compute_content_hash` |
| `chatbot` | Task | `chatbot/tasks.py` | `reembedar_analise` — Celery, idempotente via SHA-256 |
| `chatbot` | Signal | `chatbot/signals.py` | `post_save` em `SolicitacaoAnalise` -> `reembedar_analise.delay` |

### Modelos do chatbot

#### `chatbot.Conversation`
| Campo | Tipo | Obs |
|---|---|---|
| id | UUIDField | PK, default=uuid4 |
| user | ForeignKey (AUTH_USER_MODEL) | CASCADE |
| analise | ForeignKey (SolicitacaoAnalise) | SET_NULL, null=True, blank=True, related_name="conversations" |
| created_at | DateTimeField | auto_now_add |

#### `chatbot.ConversationMessage`
| Campo | Tipo | Obs |
|---|---|---|
| conversation | ForeignKey (Conversation) | CASCADE, related_name="messages" |
| role | CharField | choices: human / ai |
| content | TextField | |
| created_at | DateTimeField | auto_now_add, ordering=ASC |

#### `chatbot.AnaliseEmbedding`
| Campo | Tipo | Obs |
|---|---|---|
| analise | OneToOneField (SolicitacaoAnalise) | CASCADE, related_name="embedding" |
| content | TextField | Texto estruturado que gerou o embedding |
| content_hash | CharField(64) | SHA-256 do content — idempotencia |
| embedding | VectorField(1536) | pgvector, modelo text-embedding-3-small |
| embedded_at | DateTimeField | auto_now |

Indice HNSW coseno criado via `RunSQL` na migration `0002_analise_embedding`.

### Fluxo do chatbot (SSE)

```
1. Frontend: POST /api/v1/chat/conversations/ {analise_id?, client_hour?} -> {id, created_at, greeting}
   - Com analise_id (ownership check; 404 se nao pertence ao usuario) a conversa e vinculada via Conversation.analise.
   - Com analise_id + client_hour, o backend gera a saudacao via LLM (Bom-dia/Boa tarde/Boa noite + primeiro nome + contexto da analise) e persiste como ConversationMessage(role="ai"); retorna em greeting.
   - Sem analise_id ou sem client_hour, greeting e null.
2. Usuario digita mensagem -> POST /api/v1/chat/stream/ {conversation_id, message}
3. ChatStreamView:
   a. Valida auth (401) e propriedade da conversa (403/404)
   b. Carrega historico como HumanMessage/AIMessage
   c. Carrega Conversation.analise via select_related; cria analise_context quando ha analise
   d. create_agent_executor(request.user, analise_context)
   e. astream_events(version="v2") -> filtra on_chat_model_stream
   f. yield "data: {content}\n\n" a cada chunk
   g. finally: acreate() human + ai messages
   h. yield "data: [DONE]\n\n"
4. Frontend: onChunk() atualiza ultima mensagem AI; onDone() desativa streaming
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

### Componentes do Chatbot

| Componente | Arquivo | Descricao |
|---|---|---|
| ChatMessage | `components/system/chat/ChatMessage.tsx` | Mensagem individual (human/ai) com cursor pulsante |
| ChatInterface | `components/system/chat/ChatInterface.tsx` | Interface completa: SSE, estado, scroll automatico |
| ChatPage | `app/chat/page.tsx` | Wrapper Suspense + leitura de analise_id via useSearchParams |

### Rotas do frontend

| Rota | Descricao |
|---|---|
| `/chat` | Mauro (assistente IA) — aceita `?analise_id={id}` como contexto; saudacao contextual no mount |
| `/analises/[id]` | Detalhe com botao "Discutir no chat" que navega para `/chat?analise_id={id}` |

### Design System

Tokens OKLCH em `frontend/src/app/globals.css`. Dark mode via seletor `.dark`. Styleguide interativo em `/styleguide`.
