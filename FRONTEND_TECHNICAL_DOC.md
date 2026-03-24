# Frontend Technical Doc — AgroComex

---

## Landing Page

- **Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Diretorio:** `landing_page/`
- **Deploy:** Vercel — projeto `agro-comex-landing`
- **URL producao:** https://agro-comex-landing.vercel.app
- **Vercel inspect:** https://vercel.com/torres-projects-3f0de638/agro-comex-landing

### Deploy manual
```bash
cd landing_page
npx vercel --prod
```

---

## Frontend (app principal)

- **Diretorio:** `frontend/`
- **Deploy:** Vercel
- **URL producao:** —

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
    layout.tsx               # Root layout — fontes + providers
    page.tsx                 # Home (placeholder)
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
    ui/                      # Componentes shadcn/ui tematizados
      card.tsx
      button.tsx
      badge.tsx
      alert.tsx
      radio-group.tsx
      label.tsx
      chart.tsx              # ChartContainer + wrappers Recharts
  lib/
    utils.ts                 # cn() — merge de classes Tailwind
  types/
    react-simple-maps.d.ts   # Declaracoes de tipo para react-simple-maps v3
```

---

## Rotas

| Rota | Descricao |
|---|---|
| `/` | Home — placeholder |
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
| Core Tecnico | FedPredict | `/styleguide/components/fedpredict` | FL |

### Pagina de Design Tokens (`/styleguide`)

Exibe de forma interativa:
- Swatches de todas as CSS custom properties de cor
- Escala de cores primaria (verde AgroComex) e neutra (creme)
- Exemplos de radii com visualizacao
- Componentes base: Button, Badge, Card, Alert, RadioGroup

---

## Servico de Autenticacao

### Dependencia adicionada

| Pacote | Versao | Uso |
|--------|--------|-----|
| `axios` | ^1.9.0 | Cliente HTTP com interceptors para refresh automatico de token |

### Arquivos do servico

| Arquivo | Responsabilidade |
|---------|-----------------|
| `frontend/src/config/apiConfig.ts` | Exporta `API_BASE_URL` lido de `NEXT_PUBLIC_API_URL` (fallback: `http://localhost:8000`) |
| `frontend/src/authStore.ts` | Modulo singleton que encapsula o access token em memoria. Exporta: `getAccessToken()`, `setAccessToken()`, `clearAccessToken()` |
| `frontend/services/api.ts` | Instancia axios com interceptors de request e resposta |

### Estrategia de armazenamento de tokens

- **Access token**: armazenado apenas em memoria via `authStore.ts`. Some ao recarregar a pagina (intencional — nunca persiste em localStorage ou cookies acessiveis ao JS).
- **Refresh token**: cookie `HttpOnly` gerenciado pelo servidor. Enviado automaticamente nas requisicoes com `withCredentials: true`.

### Fluxo do interceptor de refresh (api.ts)

1. Qualquer requisicao que receba HTTP 401 dispara um `POST /api/v1/authentication/token/refresh/`.
2. O cookie HttpOnly e enviado automaticamente (nenhuma acao necessaria no cliente).
3. Se o refresh for bem-sucedido: novo access token salvo em memoria via `setAccessToken()`, requisicao original refeita com o novo token.
4. Se o refresh falhar (cookie expirado ou blacklistado): `clearAccessToken()` chamado, Promise rejeitada — a UI trata o redirecionamento para login quando a pagina existir.
5. Flag `_retry` no objeto de config da requisicao impede loops infinitos em caso de 401 repetido.

### Variavel de ambiente

| Variavel | Valor padrao | Onde definir |
|----------|-------------|--------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | `frontend/.env.local` (nao commitado) |

---

## Regras de Frontend

- Usar exclusivamente CSS custom properties (`var(--token)`) — nunca hex, rgb ou hsl hardcoded.
- Todo componente novo deve suportar dark mode (variaveis ajustam automaticamente).
- Nao duplicar componentes ja existentes em `src/components/ui/`.
- Nao introduzir bibliotecas de UI alternativas sem aprovacao explicita.
- Antes de qualquer trabalho de frontend, invocar a skill `frontend-design`.
