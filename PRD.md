# PRD — AgroComex

## Visao Geral

Plataforma de inteligencia para o agronegocio com foco em comercio exterior, integrando dados de mercado, ML federado e analise de risco de derivativos agricolas.

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
| Frontend (producao) | — |
| Backend (API) | — |

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

### Infraestrutura

- [x] Repositorio GitHub criado
- [x] Landing page deployada no Vercel

---

## Proximos Passos

- [ ] Frontend configurado e deployado no Vercel
- [ ] Backend configurado e deployado no Render
- [ ] Configuracao de permissoes nos ViewSets restantes (`permission_classes` globais)
- [ ] Adicionar origin de producao em `CORS_ALLOWED_ORIGINS`
- [ ] Implementacao dos modulos MVP: ComexMap, PriceStory, AgroChat
- [ ] Implementacao do modulo FedPredict (ML federado)
- [ ] Corracao de typos nos nomes de modelos Django (Comomodity, MesContratoFurturo)
- [ ] Expandir cobertura de testes (atualmente apenas validacao de campos em SolicitacaoAnalise)

### Fora de escopo — melhorias futuras

- **Forward e Swap:** removidos da selecao de nova analise em 2026-06-19. Dependem
  de uma camada de curva de futuros por vencimento ainda inexistente (ver
  BACKEND_TECHNICAL_DOC.md, secao Forward/Swap). Forward seguiria o modelo de carrego
  calibrado do futuro B3; Swap, VPL multi-periodo sobre a curva de forwards. CALL,
  PUT e opcoes com barreira permanecem em producao.
