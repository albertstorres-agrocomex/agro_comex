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

- [x] Modelo de dados normalizado (3FN) com 6 apps Django
- [x] API REST completa (CRUD) para todos os modelos:
  - Commodities
  - Tipos de Derivativo
  - Meses de Contrato Futuro
  - Cache de Dados de Mercado
  - Solicitacoes de Analise
  - Resultados de Analise
- [x] Validacao condicional de campos em SolicitacaoAnalise (baseada em TipoDerivativo)
- [x] Celery + Redis configurados para processamento assincrono de analises
- [x] Tarefa Celery `processar_analise` com retry automatico (max 3x) e transicao de estados
- [x] Pipeline de integracao de dados externos: BCB (cambio, SELIC, IPCA), B3 (futuros), CEPEA (precos)
- [x] Servico de persistencia com upsert (`persistir_cache_dados_mercado`)
- [x] Pipeline de normalizacao de dados (`dados/limpeza/`) com precos em centavos (int)
- [x] 7 tarefas periodicas configuradas via django-celery-beat (cron, timezone America/Sao_Paulo)
- [x] Serializacao JSON via Django REST Framework

### Frontend

- [x] Design system com tokens OKLCH (cores, tipografia, radii, dark mode)
- [x] Styleguide interativo documentando todos os tokens e componentes
- [x] Componente BarChartComex (multiplas series, barra ativa, metricas)
- [x] Componente LineChartComex (linha de tendencia, ponto ativo, metricas)
- [x] Componente PieChartComex (donut, legenda lateral, valor central)
- [x] Componente WorldMapComex (mapa coropletico interativo, tooltip, top parceiros)

### Infraestrutura

- [x] Repositorio GitHub criado
- [x] Landing page deployada no Vercel

---

## Proximos Passos

- [ ] Frontend configurado e deployado no Vercel
- [ ] Backend configurado e deployado no Render
- [ ] Integracao frontend <-> backend (consumo da API REST)
- [ ] Implementacao dos modulos MVP: ComexMap, PriceStory, AgroChat
- [ ] Configuracao de autenticacao e permissoes na API
- [ ] Implementacao do modulo FedPredict (ML federado)
- [ ] Corracao de typos nos nomes de modelos Django (Comomodity, MesContratoFurturo)
