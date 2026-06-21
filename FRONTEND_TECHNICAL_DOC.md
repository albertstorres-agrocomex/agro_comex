# Frontend Technical Doc — AgroComex

---

## Landing Page

- **Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Diretorio:** `landing_page/`
- **Deploy:** Vercel — projeto `agro-comex-landing`
- **URL producao:** https://agro-comex-landing.vercel.app
- **Vercel inspect:** https://vercel.com/torres-projects-3f0de638/agro-comex-landing

### Navbar

A landing page possui uma barra de navegacao fixa no topo (`landing_page/src/app/page.tsx`) com:
- Logo / nome do produto
- Botao "Ver Projeto" que linka para o frontend da aplicacao principal

### Deploy manual
```bash
cd landing_page
npx vercel --prod
```

---

## Frontend (app principal)

- **Diretorio:** `frontend/`
- **Deploy:** Vercel
- **URL producao:** https://agro-comex-git-hml-torres-projects-3f0de638.vercel.app

---

## Stack

| Tecnologia | Versao | Uso |
|---|---|---|
| Next.js | 16.1.6 | Framework React + SSR + App Router |
| React | 19.2.3 | Biblioteca de UI |
| TypeScript | — | Tipagem estatica |
| Tailwind CSS | v4 | Utility-first CSS |
| shadcn/ui | New York | Componentes base acessiveis (via Radix UI) |
| Recharts | ^3.8.0 | Graficos (Bar, Line, Pie) |
| react-simple-maps | ^3.0.0 | Mapa mundial interativo (coropletico) |
| Radix UI | ^1.4.3 | Primitivos de componentes acessiveis |
| Lucide React | ^0.577.0 | Icones |
| tailwind-merge | ^3.5.0 | Merge de classes Tailwind sem conflito |
| clsx | ^2.1.1 | Construtor condicional de classes |
| class-variance-authority | ^0.7.1 | Variantes tipadas de componentes |

---

## Estrutura de Diretorios

```
frontend/src/
  app/
    globals.css              # Tokens de design (OKLCH, radii, tipografia)
    layout.tsx               # Root layout — fontes + providers (wraps children com <Providers>)
    page.tsx                 # Pagina de login (rota raiz `/`) — "use client", usa useAuth()
    providers.tsx            # "use client" wrapper para AuthProvider (necessario pois layout.tsx e Server Component)
    dashboard/
      page.tsx               # Dashboard — verifica sessao; redireciona para /dashboard/commodities se usuario sem selecao
      commodities/
        page.tsx             # Selecao de commodities — grid de cards com toggle, busca server-side, paginacao, salvar selecao
    analises/
      page.tsx               # Lista paginada de analises — tabs por status, grafico donut, botao Nova Analise
      [id]/
        page.tsx             # Detalhe de analise — exibe campos, resultado Black-Scholes, cenarios (conservador/moderado/agressivo/proposto) com curva de payoff; cenario proposto destacado com posicionamento e cor dinamicos; acoes aprovar/reprovar (so para concluido); botao "Discutir no chat" navega para /chat?analise_id={id}
    chat/
      page.tsx               # Mauro — ChatPage (Suspense wrapper) + ChatPageInner (le analise_id via useSearchParams); exibe contexto da analise quando presente; requer autenticacao
    messages/
      page.tsx               # Mensagens proativas do Mauro — exibe thread proativa, marca lidas no mount, reply via streamMessage
    login/
      page.tsx               # Redirect para `/`
    styleguide/
      layout.tsx             # Layout do styleguide com sidebar de navegacao
      page.tsx               # Pagina interativa de design tokens
      navigation.ts          # Estrutura de navegacao do styleguide
      components/
        bar-chart/page.tsx   # Showcase do BarChartComex
        line-chart/page.tsx  # Showcase do LineChartComex
        pie-chart/page.tsx   # Showcase do PieChartComex
        world-map/page.tsx   # Showcase do WorldMapComex
  components/
    BarChartComex.tsx        # Componente de grafico de barras
    LineChartComex.tsx       # Componente de grafico de linha
    PieChartComex.tsx        # Componente de grafico de pizza/donut
    WorldMapComex.tsx        # Componente de mapa mundial coropletico
    RecentAnalysisCards.tsx  # Cards de analises recentes — link "Veja tudo" aponta para /analises
    RecentAnalysisCard.tsx   # Card individual de analise recente
    CommodityPriceCards.tsx  # Grid de cards de precos de mercado por commodity
    CommodityPriceCard.tsx   # Card individual de preco de commodity
    ExportIndexChart.tsx     # Grafico de indice de exportacao
    system/
      auth/
        LoginCard.tsx        # Card de login — prop error?: string (role="alert", text-destructive)
        LoginCardNew.tsx     # Variante nova do card de login
      analise/
        AnaliseCard.tsx           # Card expansivel com badge de status e link para /analises/[id]
        AnaliseStatusPieChart.tsx # Grafico donut com distribuicao dos 4 status (usa PieChartComex)
        NovaAnaliseModal.tsx      # Modal com formulario para criar nova analise (preco_exercicio, quantidade, mes_contrato obrigatorios)
      chat/
        ChatMessage.tsx           # Mensagem individual (human/ai) com cursor pulsante de streaming
        ChatInterface.tsx         # Interface completa do chat: estado, streaming SSE, scroll automatico
      commodity/
        CommodityImageCard.tsx    # Card de commodity com imagem
      layout/
        Sidebar.tsx          # Navegacao lateral da aplicacao
        TopMenu.tsx          # Menu superior da aplicacao
    ui/                      # Componentes shadcn/ui tematizados
      card.tsx
      button.tsx
      badge.tsx
      alert.tsx
      radio-group.tsx
      label.tsx
      chart.tsx              # ChartContainer + wrappers Recharts
  contexts/
    AuthContext.tsx          # React Context de autenticacao global — expoe useAuth()
  services/
    authService.ts           # Servico HTTP de auth: login(), refreshToken(), logout()
    analiseService.ts        # Servico HTTP de analises: 6 funcoes, 5 tipos TypeScript
    commodityService.ts      # Servico HTTP de commodities: listagem, busca, selecao do usuario
    chatService.ts           # Servico HTTP do chatbot: createConversation(), streamMessage() via SSE
  lib/
    utils.ts                 # cn() — merge de classes Tailwind
  types/
    react-simple-maps.d.ts   # Declaracoes de tipo para react-simple-maps v3
```

---

## Rotas

| Rota | Descricao |
|---|---|
| `/` | Login |
| `/login` | Redirect permanente para `/` |
| `/dashboard` | Dashboard principal — requer autenticacao |
| `/dashboard/commodities` | Selecao de commodities de interesse do usuario |
| `/analises` | Lista paginada de analises — requer autenticacao |
| `/analises/[id]` | Detalhe de analise — acoes de aprovacao/reprovacao; botao "Discutir no chat" |
| `/chat` | Mauro (assistente IA) — aceita `?analise_id={id}` como contexto opcional; saudacao contextual no mount |
| `/messages` | Mensagens proativas do Mauro — thread de alertas; marca lidas no mount; reply via streamMessage |
| `/styleguide` | Design tokens — cores, tipografia, radii |
| `/styleguide/components/bar-chart` | Showcase do BarChartComex |
| `/styleguide/components/line-chart` | Showcase do LineChartComex |
| `/styleguide/components/pie-chart` | Showcase do PieChartComex |
| `/styleguide/components/world-map` | Showcase do WorldMapComex |

---

## Design Tokens

Definidos em `src/app/globals.css` como CSS custom properties (OKLCH). Nunca usar valores de cor hardcoded fora deste arquivo.

### Cores principais

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--primary` | oklch(0.26 0.068 145) | oklch(0.60 0.15 145) | Verde florestal — acao principal |
| `--accent` | oklch(0.87 0.185 125) | oklch(0.87 0.185 125) | Lime — destaque e highlight |
| `--background` | oklch(0.935 0.012 88) | oklch(0.14 0.012 65) | Fundo da pagina |
| `--foreground` | oklch(0.175 0.018 70) | oklch(0.92 0.008 80) | Texto principal |
| `--secondary` | oklch(0.91 0.010 85) | oklch(0.24 0.014 68) | Fundo de paineis secundarios |
| `--muted` | oklch(0.89 0.008 85) | oklch(0.24 0.014 68) | Elementos desativados |
| `--card` | oklch(0.965 0.008 86) | oklch(0.18 0.012 68) | Fundo de cards |
| `--destructive` | oklch(0.577 0.245 27.325) | oklch(0.65 0.22 25) | Erros e alertas criticos |
| `--success` | oklch(0.48 0.140 150) | oklch(0.58 0.15 150) | Confirmacoes positivas |
| `--warning` | oklch(0.74 0.165 85) | oklch(0.78 0.165 85) | Avisos |
| `--info` | oklch(0.57 0.185 232) | oklch(0.62 0.185 232) | Informacoes neutras |

### Series de graficos

| Token | Uso |
|---|---|
| `--chart-1` | Serie primaria (verde brand) |
| `--chart-2` | Serie secundaria (lime) |
| `--chart-3` | Serie terciaria (amber) |
| `--chart-4` | Serie quaternaria (violet) |
| `--chart-5` | Serie quinaria (teal) |

### Radii

| Token | Valor base | Uso sugerido |
|---|---|---|
| `--radius-sm` | base - 4px | Badges, chips |
| `--radius-md` | base - 2px | Inputs, selects |
| `--radius-lg` | 0.75rem | Cards |
| `--radius-xl` | base + 4px | Modais |
| `--radius-2xl` | base + 8px | Paineis |
| `--radius-3xl` | base + 12px | Drawers |
| `--radius-4xl` | base + 16px | Sheets |

### Tipografia

| Fonte | Uso | Pesos |
|---|---|---|
| Plus Jakarta Sans | Fonte principal (sans) | 300, 400, 500, 600, 700 |
| Geist Mono | Dados numericos, codigo | variavel |

---

## Componentes

### BarChartComex

**Arquivo:** `src/components/BarChartComex.tsx`

Grafico de barras verticais com suporte a multiplas series, barra ativa com callout label e rodape de metricas.

```typescript
interface BarChartComexProps {
  data: Array<Record<string, string | number>>
  config: ChartConfig                         // Mapeamento de chave -> { label, color }
  seriesKeys: string[]                        // Chaves das series em ordem de renderizacao
  xAxisKey: string                            // Chave do eixo X nos objetos de data
  title?: string
  description?: string
  activeIndex?: number                        // Indice da barra destacada (callout)
  summary?: {
    label: string
    baselineValue: string
    currentValue: string
  }
  metricItems?: BarChartMetricItem[]
  valueFormatter?: (val: number) => string    // Padrao: formatacao pt-BR
  className?: string
}

interface BarChartMetricItem {
  label: string
  value: string
  variant?: "success" | "warning" | "destructive" | "default"
}
```

Altura fixa: 220px.

---

### LineChartComex

**Arquivo:** `src/components/LineChartComex.tsx`

Grafico de linhas com marcador de ponto ativo, linha de referencia horizontal opcional e rodape de metricas.

```typescript
interface LineChartComexProps {
  data: Array<Record<string, string | number>>
  config: ChartConfig
  seriesKeys: string[]
  xAxisKey: string
  title?: string
  description?: string
  activeIndex?: number                        // Ponto destacado com callout
  trendLine?: { value: number; label?: string } // Linha de referencia horizontal
  summary?: {
    label: string
    baselineValue: string
    currentValue: string
  }
  metricItems?: LineChartMetricItem[]
  valueFormatter?: (val: number) => string
  className?: string
}

interface LineChartMetricItem {
  label: string
  value: string
  variant?: "success" | "warning" | "destructive" | "default"
}
```

Altura: 220px.

---

### PieChartComex

**Arquivo:** `src/components/PieChartComex.tsx`

Grafico donut com legenda lateral e valor central configuravel.

```typescript
interface PieChartComexProps {
  data: PieChartDataItem[]
  config: ChartConfig
  title?: string
  description?: string
  totalValue?: string                         // Valor exibido no centro do donut
  totalLabel?: string                         // Rotulo abaixo do valor central
  valueFormatter?: (val: number) => string
  className?: string
}

interface PieChartDataItem {
  label: string
  value: number
  colorKey: string                            // Chave mapeada no ChartConfig para cor
}
```

Layout: donut (inner radius 52px, outer 72px) + legenda lateral. Adequado para distribuicao de top 5 itens.

---

### WorldMapComex

**Arquivo:** `src/components/WorldMapComex.tsx`

Mapa mundial coropletico interativo baseado em react-simple-maps. Exibe intensidade de volume comercial por pais com tooltip ao hover e ranking de principais parceiros.

```typescript
interface WorldMapComexProps {
  data: TradeCountry[]
  title?: string
  description?: string
  originCountryId?: string                    // ISO 3166-1 numerico (padrao: "076" = Brasil)
  valueFormatter?: (v: number) => string      // Padrao: "US$ X.XB"
  shareFormatter?: (v: number) => string      // Padrao: "X.X%"
  className?: string
}

interface TradeCountry {
  id: string      // ISO 3166-1 numerico (ex: "156" = China, "840" = EUA)
  name: string
  value: number
  share?: number  // Percentual do total comercial
}
```

**Escala de intensidade (6 niveis):**
- 0: sem dados — `--muted`
- 1: muito baixo (< 4% do max)
- 2: baixo (4–10% do max)
- 3: moderado (10–25% do max)
- 4: alto (25–50% do max)
- 5: muito alto (>= 50% do max) — `--accent` lime

Pais de origem exibido com `--primary`. Tooltip flutuante renderizado fora do Card (z-50) para evitar clipping.

---

## Tipos

### `src/types/react-simple-maps.d.ts`

Declaracoes de tipo para react-simple-maps v3 (sem tipos bundled oficiais):

```typescript
ComposableMapProps   // projectionConfig: { scale?, center?, rotate? }
GeographiesProps     // geography: string | object; children: render function
GeographyProps       // fill, stroke, strokeWidth, event handlers
GeoFeature           // { rsmKey, id, type, properties, geometry }
```

---

## Styleguide

Acessivel em `/styleguide`. Serve como fonte de verdade visual e documentacao interativa do design system.

### Navegacao (`navigation.ts`)

| Secao | Item | Rota | Tag |
|---|---|---|---|
| Foundation | Design Tokens | `/styleguide` | — |
| Modulos MVP | ComexMap | `/styleguide/components/comexmap` | MVP |
| Modulos MVP | PriceStory | `/styleguide/components/pricestory` | MVP |
| Modulos MVP | AgroChat | `/styleguide/components/agrochat` | MVP |
| Componentes | BarChart | `/styleguide/components/bar-chart` | — |
| Componentes | LineChart | `/styleguide/components/line-chart` | — |
| Componentes | PieChart | `/styleguide/components/pie-chart` | — |
| Componentes | WorldMap | `/styleguide/components/world-map` | — |

### Pagina de Design Tokens (`/styleguide`)

Exibe de forma interativa:
- Swatches de todas as CSS custom properties de cor
- Escala de cores primaria (verde AgroComex) e neutra (creme)
- Exemplos de radii com visualizacao
- Componentes base: Button, Badge, Card, Alert, RadioGroup

---

## Autenticacao JWT

### Dependencias

| Pacote | Versao | Uso |
|--------|--------|-----|
| `axios` | ^1.9.0 | Cliente HTTP com interceptors para refresh automatico de token |

### Arquivos do servico

| Arquivo | Responsabilidade |
|---------|-----------------|
| `frontend/src/config/apiConfig.ts` | Exporta `API_BASE_URL` lido de `NEXT_PUBLIC_API_URL` (fallback: `http://localhost:8000`) |
| `frontend/src/authStore.ts` | Modulo singleton que encapsula o access token em memoria. Exporta: `getAccessToken()`, `setAccessToken()`, `clearAccessToken()` |
| `frontend/services/api.ts` | Instancia axios com interceptors de request e resposta |
| `frontend/src/services/authService.ts` | Servico HTTP de autenticacao: `login()`, `refreshToken()`, `logout()`. Usa `fetch` nativo com `credentials: 'include'`. Lanca `{ status: number }` em erros HTTP e `{ status: 0 }` em erros de rede. |
| `frontend/src/contexts/AuthContext.tsx` | React Context de estado de auth global. Expoe o hook `useAuth()`. O `AuthProvider` executa silent refresh no mount (`isLoading=true` ate a resolucao). `login()` lanca excecao em caso de erro; `logout()` e best-effort. |
| `frontend/src/app/providers.tsx` | Wrapper `"use client"` para o `AuthProvider`. Necessario porque `layout.tsx` e um Server Component e nao pode renderizar Context diretamente. |

### Interfaces

```typescript
interface UserProfile {
  group: string
  primeiro_nome: string
}

interface AuthContextValue {
  user: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
}
```

### Estrategia de armazenamento de tokens

- **Access token**: armazenado apenas em memoria via `authStore.ts`. Some ao recarregar a pagina (intencional — nunca persiste em localStorage ou cookies acessiveis ao JS).
- **Refresh token**: cookie `HttpOnly` gerenciado pelo servidor. Enviado automaticamente nas requisicoes com `credentials: 'include'`.

### Fluxo de autenticacao

| Etapa | Acao |
|-------|------|
| Login | `POST /api/v1/authentication/token/` — access token salvo em `authStore` (memoria); refresh token chega como cookie HttpOnly |
| Silent refresh | `AuthProvider` chama `POST /api/v1/authentication/token/refresh/` no mount para restaurar sessao sem exigir novo login |
| Logout | `POST /api/v1/authentication/logout/` (best-effort) — limpa `authStore` e estado do contexto |
| Pos-login | Redireciona para `/dashboard` |
| Dashboard sem sessao | Se `!isAuthenticated` apos o carregamento, redireciona para `/` |

### Fluxo do interceptor de refresh (api.ts)

1. Qualquer requisicao que receba HTTP 401 dispara um `POST /api/v1/authentication/token/refresh/`.
2. O cookie HttpOnly e enviado automaticamente (nenhuma acao necessaria no cliente).
3. Se o refresh for bem-sucedido: novo access token salvo em memoria via `setAccessToken()`, requisicao original refeita com o novo token.
4. Se o refresh falhar (cookie expirado ou blacklistado): `clearAccessToken()` chamado, Promise rejeitada — a UI trata o redirecionamento para login.
5. Flag `_retry` no objeto de config da requisicao impede loops infinitos em caso de 401 repetido.

### Variavel de ambiente

| Variavel | Valor padrao | Onde definir |
|----------|-------------|--------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | `frontend/.env.local` (nao commitado) |

---

## Modulo de Analises

### analiseService.ts

**Arquivo:** `src/services/analiseService.ts`

Servico HTTP para o recurso `Analise`. Todas as funcoes usam a instancia axios autenticada de `frontend/services/api.ts`.

**Tipos exportados:**

```typescript
type AnaliseStatus = "pendente" | "em_analise" | "aprovado" | "rejeitado"

interface Analise {
  id: number
  commodity: number
  commodity_nome: string
  status: AnaliseStatus
  resultado: string
  quantidade_toneladas: string | null
  criado_em: string
  atualizado_em: string
}

interface AnalisePaginada {
  count: number
  next: string | null
  previous: string | null
  results: Analise[]
}

interface AnaliseStatusCount {
  pendente: number
  em_analise: number
  aprovado: number
  rejeitado: number
  total: number
}

interface NovaAnalisePayload {
  commodity: number
  mes_contrato: number
  preco_exercicio: number
  quantidade: number
  unidade_quantidade: "sacas" | "toneladas"
  posicao?: "comprador" | "vendedor" | null
  nivel_barreira?: number | null
  barreira_tipo?: "knock_in" | "knock_out" | null
}
```

**Funcoes exportadas:**

| Funcao | Metodo | URL | Descricao |
|--------|--------|-----|-----------|
| `listarAnalises(page, status)` | GET | `/api/v1/dados/analises/` | Lista paginada (6/pag); `status` opcional filtra por estado |
| `criarAnalise(payload)` | POST | `/api/v1/dados/analises/create/` | Cria analise e enfileira tarefa Celery |
| `getAnalise(id)` | GET | `/api/v1/dados/analises/<id>/` | Detalhe de uma analise |
| `getStatusCount()` | GET | `/api/v1/dados/analises/status-count/` | Contagem por status + total |
| `aprovarAnalise(id)` | PATCH | `/api/v1/dados/analises/<id>/aprovar/` | Aprova (exige status em_analise) |
| `reprovarAnalise(id)` | PATCH | `/api/v1/dados/analises/<id>/reprovar/` | Reprova (exige status em_analise) |

---

### AnaliseCard

**Arquivo:** `src/components/system/analise/AnaliseCard.tsx`

Card expansivel que exibe resumo de uma analise. Ao expandir mostra `resultado` e `quantidade_toneladas`. Badge de status segue o mapeamento:

| Status | Variante do Badge |
|--------|------------------|
| `pendente` | warning |
| `em_analise` | info |
| `aprovado` | success |
| `rejeitado` | destructive |

Link para `/analises/[id]` no rodape do card expandido.

---

### AnaliseStatusPieChart

**Arquivo:** `src/components/system/analise/AnaliseStatusPieChart.tsx`

Grafico donut com 4 fatias (pendente, em_analise, aprovado, rejeitado) usando `PieChartComex`. Recebe `AnaliseStatusCount` como prop e exibe o total no centro.

---

### NovaAnaliseModal

**Arquivo:** `src/components/system/analise/NovaAnaliseModal.tsx`

Modal acionado pelo botao "Nova Analise" na pagina `/analises`. Formulario com: select de commodity, select de mes de contrato, campo de preco de exercicio, campo de quantidade e radio de unidade (sacas/toneladas). Todos os campos sao obrigatorios. Validacao de NaN e precisao float aplicada antes do submit. Apos submit bem-sucedido fecha o modal e dispara refresh da lista.

Quando o tipo de derivativo selecionado tem `requer_barreira`, o formulario exibe dois campos extras: **Nivel de Barreira** (numero) e **Tipo de Barreira** (select knock-in/knock-out, enviado como `barreira_tipo`). O nivel de barreira tem validacao visual espelhando o backend: deve ser positivo e diferente do preco de mercado atual (`commodity.preco_atual`). Em estado invalido o input usa o token `--destructive` (borda + anel) e uma mensagem inline curta; o estado valido retorna ao normal. As regras de barreira sao reforcadas no backend (serializer de criacao).

---

## Modulo de Chat (Mauro)

### chatService.ts

**Arquivo:** `src/services/chatService.ts`

Servico HTTP do chatbot. Usa `apiFetch` com Bearer token automatico.

**`interface ConversationResponse { id: string; created_at: string; greeting: string | null }`**

**`createConversation(analiseId?: number, clientHour?: number): Promise<ConversationResponse>`**
- `POST /api/v1/chat/conversations/`
- Body montado condicionalmente: inclui `analise_id` apenas se `analiseId !== undefined` e `client_hour` apenas se `clientHour !== undefined`
- Retorna `greeting` (saudacao contextual gerada pelo backend) ou `null`

**`type AnaliseCard = { id: number; commodity_nome: string; tipo_derivativo_nome: string; status: string }`** — card de analise alinhado ao `SolicitacaoAnaliseReadSerializer` do backend. O frame `cards` do stream SSE (tool `listar_analises`) envia `{id, commodity, tipo, status}` e e normalizado para este shape no frontend (`streamMessage`).

**`streamMessage(conversationId, message, onChunk, onDone, opts): Promise<void>`** — `opts: { analiseId?: number; onCards?: (cards: AnaliseCard[]) => void } = {}`
- `POST /api/v1/chat/stream/` com `{ conversation_id, message }` (inclui `analise_id` quando `opts.analiseId` definido)
- Usa `res.body.getReader()` + `TextDecoder` para consumir SSE
- Buffer acumula chunks, divide por `\n`, processa linhas `data: ...`
- Se o JSON tem `tipo === "cards"` e `opts.onCards` existe, chama `opts.onCards(dados.payload)`; caso contrario chama `onChunk(content)` a cada chunk; `onDone()` ao receber `[DONE]`

**`getProativoAnalises(filtro): Promise<{ analises: AnaliseCard[] }>`** — `filtro: { commodity?: string; tipo?: string; status?: string }`
- `GET /api/v1/chat/proativo/analises/`
- Lista analises do usuario para o `AnaliseCardPicker`

**`interface ProativoMessage`** — tipo para mensagens proativas: `id`, `role`, `content`, `created_at`, `is_proativa`, `tipo_alerta`, `lida_em`, `solicitacao`.

**`getProativoNaoLidas(): Promise<{ nao_lidas: number; solicitacoes: number[] }>`**
- `GET /api/v1/chat/proativo/nao-lidas/`
- Retorna a contagem (`nao_lidas`) e a lista `solicitacoes` (IDs de analises com mensagem proativa nao lida — usada para o prompt de permissao mid-conversa)

**`getProativoConversa(): Promise<{ conversation_id, messages: ProativoMessage[] }>`**
- `GET /api/v1/chat/proativo/`
- Retorna ID da conversa proativa e lista de mensagens

**`marcarProativoLidas(): Promise<{ marcadas: number }>`**
- `POST /api/v1/chat/proativo/marcar-lidas/`
- Marca todas as mensagens proativas como lidas

**`getProativoAbertura(clientHour?: number): Promise<{ created: boolean; message: ProativoMessage | null }>`**
- `POST /api/v1/chat/proativo/abertura/`
- Body inclui `client_hour` apenas quando `clientHour !== undefined`; caso contrario envia `{}` (backend usa a hora local do servidor)
- Dispara a saudacao proativa de abertura da pagina `/messages`; o backend sempre cria e persiste a mensagem (`tipo_alerta="abertura"`) e a retorna em `message`

---

### ChatMessage

**Arquivo:** `src/components/system/chat/ChatMessage.tsx`

Props: `role: "human" | "ai"`, `content: string`, `isStreaming?: boolean`

- Human: alinhado direita, badge "EU", `bg-[var(--primary)]`, texto `var(--primary-foreground)`
- AI (Mauro): alinhado esquerda, badge "M", `bg-[var(--secondary)]`
- Cursor pulsante (`animate-pulse`) quando `isStreaming=true`
- Todos os tokens de cor via CSS custom properties

Nota: o valor de dado `role="ai"` permanece inalterado (enum do model/DB); apenas o texto voltado ao usuario passou a nomear o assistente como "Mauro".

---

### TypingIndicator

**Arquivo:** `src/components/system/chat/TypingIndicator.tsx`

Indicador "Mauro esta digitando" exibido enquanto a saudacao contextual e gerada no backend e tambem enquanto o Mauro prepara cada resposta (entre o envio da mensagem do usuario e o primeiro chunk do stream). Segue o padrao visual do `ChatMessage`: avatar "M" (`bg-[var(--primary)]`), bolha `bg-[var(--secondary)]` e tres pontos animados (`animate-bounce` com delays escalonados). `role="status"` + `aria-label` para acessibilidade. Apenas tokens do styleguide; dark mode via tokens.

Prop opcional `label?: string` (Fase 2): quando informado, substitui o texto padrao do indicador — usado em `/messages` para exibir "conferindo atualizacao..." durante a conferencia mid-conversa.

---

### ChatInterface

**Arquivo:** `src/components/system/chat/ChatInterface.tsx`

Props: `analiseId?: number`

Estados: `conversationId`, `messages`, `input`, `isStreaming`, `error`, `isGreeting`, `isAwaitingReply`

Refs: `bottomRef` (auto-scroll) e `streamActiveRef` (guard de race condition)

- `useEffect` de mount: `createConversation(analiseId, new Date().getHours())` com flag `cancelled` para evitar setState apos desmonte
- Quando a resposta traz `greeting`, insere como primeira mensagem `{ role: "ai" }` no estado `messages` (saudacao exibida antes de qualquer interacao — tela nunca em branco)
- `isGreeting` (ativado so quando ha `analiseId`) exibe `<TypingIndicator />` enquanto a saudacao e gerada e suprime o estado vazio; desligado no `finally`
- `handleSend`: adiciona mensagem human, ativa `isAwaitingReply` (exibe `<TypingIndicator />`), inicia stream SSE; a bolha AI so e criada no primeiro chunk (desligando `isAwaitingReply`), e os chunks seguintes sao acumulados na ultima mensagem AI preservando `id` estavel
- `isAwaitingReply` exibe `<TypingIndicator />` em toda resposta do Mauro; desligado no primeiro chunk, no `onDone` e no `catch`
- Enter envia; Shift+Enter nao envia
- `aria-label` em Input e Button para acessibilidade
- `key={msg.id}` (UUID) em vez de index — key estavel durante streaming

---

### Pagina /chat

**Arquivo:** `src/app/chat/page.tsx`

- `ChatPage` exporta wrapper `<Suspense>` — obrigatorio no Next.js 15 App Router para `useSearchParams`
- `ChatPageInner`: le `analise_id` via `useSearchParams` com validacao `!isNaN(Number(raw))`
- Redireciona para `/login` se nao autenticado
- Exibe "Contexto: analise #{analiseId}" quando `analise_id` presente na URL
- `ChatInterface` em container com `rounded-[var(--radius-xl)]` e `border border-[var(--border)]`

---

### Sidebar — item "Mauro"

Adicionado ao array `DEFAULT_NAV_ITEMS` em `Sidebar.tsx`:
- Label: `"Mauro"`, href: `"/chat"`, icon: `Bot` (lucide-react)

---

### TopMenu — badge de nao-lidas proativas

**Componente:** `NaoLidasBadge` (em `TopMenu.tsx`)

Badge numerico exibido junto ao item "Mensagens" no menu superior (desktop e mobile). Usa o token `--accent` (green) como cor de fundo. Visivel apenas quando ha mensagens nao lidas (`nao_lidas > 0`).

**Hook:** `useProativoNaoLidas` — polling a cada 45 segundos via `getProativoNaoLidas()`. Retorna a contagem atual de mensagens proativas nao lidas.

---

### Pagina /messages

**Arquivo:** `src/app/messages/page.tsx`

Pagina dedicada ao thread de mensagens proativas do Mauro. Requer autenticacao (auth guard: redireciona para `/` se `!isAuthenticated`, consistente com o padrao do Dashboard).

- No mount, chama `getProativoConversa()` para carregar a thread e `marcarProativoLidas()` para zerar o badge
- Mensagens proativas destacadas visualmente com o token `--accent`
- O usuario pode responder via `streamMessage` existente, usando o `conversation_id` da conversa proativa

**Layout — TopMenu:**

- Renderiza `<TopMenu onLogout={logout} />`; a area de conteudo usa `pt-24` para compensar o offset do menu superior fixo, garantindo que o topo do thread nao fique encoberto ao rolar

**Modelo de mensagem `UiMessage` (uniao discriminada por `kind`):**

- `TextMessage`: `{ id, kind: "text", role: "human" | "ai", content: string, isProativa: boolean }`
- `CardsMessage`: `{ id, kind: "cards", role: "ai", cards: AnaliseCard[], isProativa: boolean }`
- `type UiMessage = TextMessage | CardsMessage`

**Cards inline (selecao/troca de analise):**

- Ao enviar, chama `streamMessage(..., { analiseId: analiseId ?? undefined, onCards: (c) => ... })`. O callback `onCards` recebe os cards do frame `cards` do stream (tool `listar_analises`), filtra a analise atualmente em contexto (`cards.filter((card) => card.id !== analiseId)`) e insere uma `CardsMessage` inline no thread (antes da ultima mensagem AI de texto) — os cards aparecem na propria conversa, nao como picker fixo
- `<AnaliseCardPicker>` renderiza cada `CardsMessage`; ao clicar, `onSelecionar` define `analiseId` como contexto da conversa
- Filtro em linguagem natural ("minha call de cafe", "quero falar de outra analise") ocorre via a tool `listar_analises` do agente, que devolve os cards ja filtrados

**Typing indicator (correcao do quadrado fantasma):**

- `mostrarTyping` so e verdadeiro quando ha streaming e a ultima mensagem e uma bolha AI de texto vazia (`kind === "text" && role === "ai" && content === ""`)
- A bolha AI vazia e suprimida na renderizacao (retorna `null`), evitando o "balao fantasma" acima da animacao; o `<TypingIndicator />` e exibido no lugar (com `label="conferindo atualizacao..."` durante a conferencia mid-conversa)

**Abertura proativa (uma vez por sessao):**

- No mount (apos autenticado), guarda via `sessionStorage["mauro_abertura_feita"]`: se a chave nao existe, define-a ANTES do await e chama `getProativoAbertura(new Date().getHours())` (best-effort, erros silenciados)
- A chave e limpa no logout (`sessionStorage.removeItem("mauro_abertura_feita")` em `contexts/AuthContext.tsx`), de modo que um novo login — mesmo no mesmo dia — gera nova saudacao. Nao ha dedup no servidor; o controle de frequencia e inteiramente do frontend (uma vez por sessao)

**Permissao mid-conversa (polling 45s preservado):**

- `useEffect` com polling a cada 45s chama `getProativoNaoLidas()` e, se `solicitacoes.includes(analiseId)`, abre o prompt ("Chegou dado novo sobre essa analise. Quer que eu confira agora?") com os botoes "Sim" (`marcarProativoLidas()` e dispara o envio perguntando se a analise mudou) e "Agora nao" (`marcarProativoLidas()` sem enviar)

---

### AnaliseCardPicker

**Arquivo:** `src/components/system/chat/AnaliseCardPicker.tsx`

Grade de cards para o usuario escolher a analise a discutir antes de iniciar a conversa proativa.

Props: `analises: AnaliseCard[]`, `onSelecionar: (id: number) => void`

- Retorna `null` quando `analises.length === 0`
- Grade `grid grid-cols-2 gap-2 sm:grid-cols-3`; cada item e um `<button>` envolvendo um `<Card>` com `commodity_nome` (negrito), `tipo_derivativo_nome` e `status` (mutados)
- Clique chama `onSelecionar(a.id)`

---

## Regras de Frontend

- Usar exclusivamente CSS custom properties (`var(--token)`) — nunca hex, rgb ou hsl hardcoded.
- Todo componente novo deve suportar dark mode (variaveis ajustam automaticamente).
- Nao duplicar componentes ja existentes em `src/components/ui/`.
- Nao introduzir bibliotecas de UI alternativas sem aprovacao explicita.
- Antes de qualquer trabalho de frontend, invocar a skill `frontend-design`.
