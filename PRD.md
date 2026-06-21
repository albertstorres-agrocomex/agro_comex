# PRD — AgroComex

## Visao Geral

Plataforma de inteligencia para o agronegocio com foco em comercio exterior, integrando dados de mercado e analise de risco de derivativos agricolas.

## Repositorio

- **GitHub:** https://github.com/albertstorres-agrocomex/agro_comex
- **Branches:** `main` (producao) · `hml` (desenvolvimento/staging)

---

## Produtos

| Produto | Descricao | Hospedagem |
|---|---|---|
| Landing Page | Site institucional/marketing | Vercel |
| Frontend | Aplicacao web principal (data viz, analises) | Vercel |
| Backend | API REST + processamento assincrono | Render |

---

## URLs

| Ambiente | URL |
|---|---|
| Landing Page (producao) | https://agro-comex-landing.vercel.app |
| Frontend (producao) | https://agro-comex-git-hml-torres-projects-3f0de638.vercel.app |
| Backend (API) | https://agro-comex.onrender.com |

---

## Funcionalidades Implementadas

### Backend

- [x] Modelo de dados normalizado (3FN) com 8 apps Django (commodities, tipos_derivativo, meses_contrato_futuro, dados, analises, usuario, authentication, core)
- [x] API REST completa (CRUD) para todos os modelos:
  - Commodities
  - Tipos de Derivativo
  - Meses de Contrato Futuro
  - Cache de Dados de Mercado
  - Solicitacoes de Analise
  - Resultados de Analise
  - Cenarios de Analise
- [x] Validacao condicional de campos em SolicitacaoAnalise (baseada em TipoDerivativo)
- [x] Campos obrigatorios validados no serializer: `preco_exercicio`, `quantidade`, `mes_contrato`, `unidade_quantidade`
- [x] Celery + Redis configurados para processamento assincrono de analises
- [x] Tarefa Celery `processar_analise` com retry automatico (max 3x) e transicao de estados
- [x] Precificacao Black-Scholes implementada para call e put (`backend/analises/calculators.py`)
- [x] Opcoes CALL/PUT com barreira (knock-in/knock-out, up/down) via Reiner-Rubinstein em modulo isolado (`backend/analises/calculators_barreira.py`); seletor `selecionar_calculo` roteia vanilla vs barreira; direcao up/down inferida do nivel vs spot; campo `barreira_tipo` (migration `analises/0010`). Forward/swap e Mauro proativo seguem pendentes.
- [x] Motor de cenarios: `executar_analise_cenarios` com 3 strikes automaticos e curva de resultado
- [x] Recomendacao automatica de cenario por criterio de maior valor e ponto de equilibrio
- [x] Calculo de curva de resultado para todas as posicoes de opcao (`calcular_curva_resultado`)
- [x] Persistencia de `CenarioAnalise` e `PontoCurvaResultado` por analise
- [x] Endpoint `PATCH /api/v1/cenarios/{id}/escolher/` com exclusividade de escolha entre cenarios
- [x] Pipeline de integracao de dados externos: BCB (cambio, SELIC, IPCA), B3 (futuros), CEPEA (precos), ComexStat (exportacao)
- [x] Servico de persistencia com upsert (`persistir_cache_dados_mercado`)
- [x] Pipeline de normalizacao de dados (`dados/limpeza/`) com precos em centavos (int)
- [x] 7 tarefas periodicas configuradas via django-celery-beat (cron, timezone America/Sao_Paulo)
- [x] Autenticacao JWT: access token 15 min (body), refresh token 7 dias (cookie HttpOnly), rotacao + blacklist
- [x] App `authentication` com endpoints de login, refresh, logout, perfil (`/api/v1/authentication/`)
- [x] Seed de meses de contrato futuro 2026-2028 por commodity (migration `tipos_derivativo/0003`)
- [x] Seed de tipos de derivativo (migration `tipos_derivativo/0003_seed`)
- [x] Cenario `proposto` gerado automaticamente em `executar_analise_cenarios` usando o `preco_exercicio` informado pelo usuario (migration `analises/0009`)
- [x] Diferenciacacao de erros em `executar_calculo_bs`: forward/swap -> ValueError "nao suportado (futuro)"; outros -> ValueError "nao reconhecido". Opcoes com barreira deixaram de cair nesse erro e passaram a ser precificadas por `executar_calculo_barreira` via `selecionar_calculo`.
- [x] Pipeline de qualidade de dados com `QualidadeDado` enum, `validar_preco`, `validar_macro`, `validar_exportacao` (`dados/validacao/qualidade.py`)
- [x] Modulo de conversao de unidade por fonte (`dados/limpeza/conversao.py`) com fatores fisicos B3/CEPEA

### Frontend

- [x] Design system com tokens OKLCH (cores, tipografia, radii, dark mode)
- [x] Styleguide interativo documentando todos os tokens e componentes
- [x] Componente BarChartComex (multiplas series, barra ativa, metricas)
- [x] Componente LineChartComex (linha de tendencia, ponto ativo, metricas)
- [x] Componente PieChartComex (donut, legenda lateral, valor central)
- [x] Componente WorldMapComex (mapa coropletico interativo, tooltip, top parceiros)
- [x] Componente ExportIndexChart (indice de exportacao)
- [x] Componentes CommodityPriceCard / CommodityPriceCards (precos de mercado)
- [x] Modulo de analises: AnaliseCard, AnaliseStatusPieChart, NovaAnaliseModal
- [x] Autenticacao JWT no frontend: AuthContext, authService, silent refresh, interceptor 401
- [x] Paginas: Login (`/`), Dashboard (`/dashboard`), Commodities (`/dashboard/commodities`), Analises (`/analises`), Detalhe Analise (`/analises/[id]`)
- [x] Sidebar e TopMenu de navegacao
- [x] Servicos: authService, analiseService, commodityService
- [x] Formulario `NovaAnaliseModal` com campos preco_exercicio e quantidade
- [x] Visualizacao de cenario proposto na pagina `/analises/[id]` com posicionamento e cor dinamicos na curva de resultado
- [x] Navbar na landing page com botao "Ver Projeto" linkando para o frontend da aplicacao
- [x] Chatbot Mauro (`/chat`): assistente IA contextual sobre analises de derivativos
  - Saudacao contextual no inicio da conversa: Bom-dia/Boa tarde/Boa noite conforme o horario do cliente + primeiro nome do usuario logado
  - Contexto automatico de analise via `?analise_id={id}`: a conversa e vinculada a analise e o Mauro nunca pergunta qual analise discutir
  - Indicador "Mauro esta digitando" enquanto a saudacao e gerada e em toda resposta do Mauro (ate o primeiro chunk do stream); greeting exibido antes de qualquer interacao (tela nunca em branco)
  - Assistente nomeado "Mauro" em toda a UI (avatar, menu, titulo da pagina)
- [x] Mauro proativo — Fase 1 (`/messages`): sistema de alertas automaticos sobre analises do usuario
  - Backend: modelo `EstadoAlertaAnalise` para anti-spam; pacote `chatbot/proativo/` com regras de deteccao (`cenario_nao_escolhido`, `cotacao_cruzou`), templates de mensagem, task Celery `varrer_alertas_proativos` disparada via signal `task_success` apos tasks de atualizacao de dados
  - Backend: endpoints `GET /api/v1/chat/proativo/`, `GET .../nao-lidas/`, `POST .../marcar-lidas/` (todos IsAuthenticated, scoped por usuario)
  - Backend: management command `seed_agendamento` (idempotente, cria PeriodicTask horarias no django-celery-beat)
  - Frontend: servico proativo em `chatService.ts` (`getProativoNaoLidas`, `getProativoConversa`, `marcarProativoLidas`)
  - Frontend: badge de nao-lidas no TopMenu (hook `useProativoNaoLidas` com polling 45s, token `--accent`)
  - Frontend: rota `/messages` com thread proativa, marcacao de lidas no mount, reply via streamMessage
- [x] Mauro proativo — Fase 2 (`/messages`): alerta de saida, selecao de analise por cards e permissao mid-conversa
  - Backend: regra `melhor_momento` (`tipo_alerta="melhor_momento"`) com tres sinais de saida — proximidade de knock-out (tolerancia 2%), intrinseco relevante vs premio (fator 1.5x) e proximidade do vencimento (5 dias uteis); limiares conservadores em `chatbot/proativo/regras.py`
  - Backend: tool `listar_analises` do agente (`chatbot/tool_listagem.py`) que devolve cards filtrados por commodity/tipo/status (limite 12)
  - Backend: frame `cards` no stream (`on_tool_end` de `listar_analises` em `ChatStreamView`) e `analise_id` por turno
  - Backend: endpoint `GET /api/v1/chat/proativo/analises/` (params `busca`/`commodity`/`tipo`/`status`) e campo `solicitacoes` na resposta de `/nao-lidas/`
  - Frontend: `AnaliseCardPicker` (selecao de analise antes da conversa), filtro em linguagem natural via tool de listagem, `analiseId` no `streamMessage`, label "conferindo atualizacao..." no `TypingIndicator` e prompt de permissao mid-conversa em `/messages`
- [x] Mauro proativo — melhorias da pagina `/messages`: abertura proativa, cards inline e correcoes de UX
  - Backend: endpoint `POST /api/v1/chat/proativo/abertura/` (IsAuthenticated) que sempre gera e persiste uma saudacao proativa (`tipo_alerta="abertura"`) com resumo do que ha de novo/pendente; body opcional `client_hour` (0..23); sem dedup no servidor
  - Backend: novo `tipo_alerta` `"abertura"` em `TIPO_ALERTA_CHOICES`
  - Backend: reforco do `SYSTEM_PROMPT` do Mauro — a tool `listar_analises` deve SEMPRE ser usada para ver/trocar de analise e o agente nunca enumera analises em texto; `ANALISE_CONTEXT_TEMPLATE` ganha excecao para chamar `listar_analises` quando o usuario pede outra analise
  - Frontend: `getProativoAbertura(clientHour?)` em `chatService.ts`
  - Frontend: `/messages` reescrita — TopMenu fixo (offset `pt-24`) + auth guard; modelo de mensagem `UiMessage` (uniao `kind: "text" | "cards"`); cards renderizados inline (filtrando a analise em contexto); correcao do "balao fantasma" durante "Digitando..."; polling 45s preservado
  - Frontend: abertura proativa dispara uma vez por sessao via `sessionStorage["mauro_abertura_feita"]`, limpa no logout (`AuthContext`)

### Infraestrutura

- [x] Repositorio GitHub criado
- [x] Landing page deployada no Vercel
- [x] Frontend deployado no Vercel (producao)
- [x] Backend deployado no Render (API REST) (producao)
- [x] Banco de dados de producao no Neon (serverless PostgreSQL, projeto `agro-comex-prod`)
- [x] Redis no Render (broker/result backend do Celery) — service `red-d8pk9vnlk1mc73eff6l0`
- [x] Worker e Beat do Celery no Render — service `srv-d8plgrbtqb8s738a576g` (mesma instancia)

---

## Proximos Passos

- [x] Frontend configurado e deployado no Vercel
- [x] Backend configurado e deployado no Render
- [ ] Configuracao de permissoes nos ViewSets restantes (`permission_classes` globais)
- [ ] Adicionar origin de producao em `CORS_ALLOWED_ORIGINS`
- [ ] Implementacao dos modulos MVP: ComexMap, PriceStory, AgroChat
- [ ] Corracao de typos nos nomes de modelos Django (Comomodity, MesContratoFurturo)
- [ ] Expandir cobertura de testes (atualmente apenas validacao de campos em SolicitacaoAnalise)

### Fora de escopo — melhorias futuras

- **ML para predicao de volatilidade:** modelo de aprendizado de maquina para estimar
  uma volatilidade futura mais proxima da realidade de mercado, substituindo a
  volatilidade historica (252 pregoes) hoje usada na precificacao Black-Scholes. A
  abordagem de ML federado foi avaliada e descartada ao final do SR1; o caminho
  adotado e um modelo supervisionado de predicao de volatilidade (ver
  `project_ml_volatilidade`). Pendente de maior volume de dados historicos.

- **Forward e Swap:** removidos da selecao de nova analise em 2026-06-19. Dependem
  de uma camada de curva de futuros por vencimento ainda inexistente (ver
  BACKEND_TECHNICAL_DOC.md, secao Forward/Swap). Forward seguiria o modelo de carrego
  calibrado do futuro B3; Swap, VPL multi-periodo sobre a curva de forwards. CALL,
  PUT e opcoes com barreira permanecem em producao.
