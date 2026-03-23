"use client"

import { BarChartComex, type BarChartMetricItem } from "@/components/BarChartComex"
import { type ChartConfig } from "@/components/ui/chart"

// --- Demo 1: Grouped — Soja price comparison (two safras, quarterly) ---
const groupedData = [
  { quarter: "T1", safra2324: 38200, safra2425: 41500 },
  { quarter: "T2", safra2324: 44100, safra2425: 51800 },
  { quarter: "T3", safra2324: 52700, safra2425: 58300 },
  { quarter: "T4", safra2324: 47900, safra2425: 24000 },
]

const groupedConfig: ChartConfig = {
  safra2324: {
    label: "Safra 23/24",
    color: "var(--muted-foreground)",
  },
  safra2425: {
    label: "Safra 24/25",
    color: "var(--chart-4)",
  },
}

const groupedMetrics: BarChartMetricItem[] = [
  { label: "Melhor trimestre — Soja", value: "T3  +58.300 USD/ton", variant: "success" },
  { label: "Melhor trimestre — Milho", value: "T2  +51.800 USD/ton", variant: "success" },
  { label: "Pior trimestre — Soja", value: "T4  +24.000 USD/ton", variant: "destructive" },
]

// --- Demo 2: Single series — Exportacoes mensais ---
const singleData = [
  { mes: "Jan", volume: 1_840 },
  { mes: "Fev", volume: 2_310 },
  { mes: "Mar", volume: 3_050 },
  { mes: "Abr", volume: 2_720 },
  { mes: "Mai", volume: 3_480 },
  { mes: "Jun", volume: 2_900 },
]

const singleConfig: ChartConfig = {
  volume: {
    label: "Volume (mil t)",
    color: "var(--chart-1)",
  },
}

// --- Demo 3: Multi-commodity quarterly ---
const multiData = [
  { quarter: "T1", soja: 420, milho: 280, cafe: 95 },
  { quarter: "T2", soja: 510, milho: 340, cafe: 112 },
  { quarter: "T3", soja: 380, milho: 420, cafe: 88 },
  { quarter: "T4", soja: 290, milho: 310, cafe: 140 },
]

const multiConfig: ChartConfig = {
  soja: { label: "Soja", color: "var(--chart-1)" },
  milho: { label: "Milho", color: "var(--chart-2)" },
  cafe: { label: "Cafe", color: "var(--chart-3)" },
}

// --- Code example strings ---
const importCode = `import { BarChartComex } from "@/components/BarChartComex"
import { type ChartConfig } from "@/components/ui/chart"`

const usageCode = `const data = [
  { quarter: "T1", safra2324: 38200, safra2425: 41500 },
  { quarter: "T2", safra2324: 44100, safra2425: 51800 },
  // ...
]

const config: ChartConfig = {
  safra2324: { label: "Safra 23/24", color: "var(--muted-foreground)" },
  safra2425: { label: "Safra 24/25", color: "var(--chart-4)" },
}

<BarChartComex
  data={data}
  config={config}
  seriesKeys={["safra2324", "safra2425"]}
  xAxisKey="quarter"
  title="Preco Soja — Comparativo Safras"
  activeIndex={3}
  summary={{
    label: "Media Geral",
    baselineValue: "45.7k",
    currentValue: "43.9k",
  }}
  metricItems={[
    { label: "Melhor trimestre", value: "T3  +58.3k", variant: "success" },
    { label: "Pior trimestre",   value: "T4  +24.0k", variant: "destructive" },
  ]}
/>`

const propsTable = [
  { prop: "data", type: "Record<string, string | number>[]", required: "sim", default: "—", desc: "Array de pontos de dado" },
  { prop: "config", type: "ChartConfig", required: "sim", default: "—", desc: "Mapa de chaves para label + cor" },
  { prop: "seriesKeys", type: "string[]", required: "sim", default: "—", desc: "dataKeys de cada serie de barras, em ordem de renderizacao" },
  { prop: "xAxisKey", type: "string", required: "sim", default: "—", desc: "Chave do eixo X no objeto de dado" },
  { prop: "title", type: "string", required: "nao", default: "—", desc: "Titulo do card" },
  { prop: "description", type: "string", required: "nao", default: "—", desc: "Subtitulo do card" },
  { prop: "activeIndex", type: "number", required: "nao", default: "—", desc: "Indice da barra destacada na ultima serie" },
  { prop: "summary", type: "object", required: "nao", default: "—", desc: "Linha de resumo abaixo do grafico: { label, baselineValue, currentValue }" },
  { prop: "metricItems", type: "BarChartMetricItem[]", required: "nao", default: "—", desc: "Lista de metricas: { label, value, variant? }" },
  { prop: "valueFormatter", type: "(v: number) => string", required: "nao", default: "pt-BR locale", desc: "Formata valores no tooltip e label ativo" },
  { prop: "className", type: "string", required: "nao", default: "—", desc: "Classe extra para o Card raiz" },
]

export default function BarChartPage() {
  return (
    <div className="space-y-12 py-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">BarChartComex</h1>
        <p className="text-sm text-muted-foreground">
          Grafico de barras agrupadas para comparacao de series temporais de commodities.
          Construido sobre <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">recharts</code> via
          shadcn/ui Chart, totalmente compativel com os tokens de design do projeto.
        </p>
      </div>

      {/* Demo 1: Grouped with active bar + metrics */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Comparativo de Safras (agrupado)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Duas series por periodo — barra ativa destacada com label e acento.
          </p>
        </div>
        <div className="max-w-xl">
          <BarChartComex
            data={groupedData}
            config={groupedConfig}
            seriesKeys={["safra2324", "safra2425"]}
            xAxisKey="quarter"
            title="Preco Soja — Comparativo Safras"
            description="USD / tonelada  |  Trimestral"
            activeIndex={3}
            summary={{
              label: "Media Geral do Periodo",
              baselineValue: "45.7k",
              currentValue: "43.9k",
            }}
            metricItems={groupedMetrics}
            valueFormatter={(v) =>
              v >= 1000
                ? `${(v / 1000).toFixed(1)}k`
                : v.toLocaleString("pt-BR")
            }
          />
        </div>
      </section>

      {/* Demo 2: Single series */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Serie Unica</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Uma unica serie de barras com cor do design system.
          </p>
        </div>
        <div className="max-w-xl">
          <BarChartComex
            data={singleData}
            config={singleConfig}
            seriesKeys={["volume"]}
            xAxisKey="mes"
            title="Exportacoes de Soja"
            description="Volume mensal em mil toneladas — 2025"
            valueFormatter={(v) => `${(v / 1000).toFixed(2)}M t`}
          />
        </div>
      </section>

      {/* Demo 3: Multi-commodity */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Multi-commodity (3 series)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tres commodities comparadas por trimestre, usando chart-1, chart-2 e chart-3.
          </p>
        </div>
        <div className="max-w-xl">
          <BarChartComex
            data={multiData}
            config={multiConfig}
            seriesKeys={["soja", "milho", "cafe"]}
            xAxisKey="quarter"
            title="Volume por Commodity"
            description="Mil toneladas exportadas  |  Trimestral 2025"
            valueFormatter={(v) => `${v}k t`}
          />
        </div>
      </section>

      {/* Props */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Props</h2>
        <div className="overflow-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                {["Prop", "Tipo", "Obrig.", "Padrao", "Descricao"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {propsTable.map((row) => (
                <tr key={row.prop} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-mono text-foreground">{row.prop}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{row.type}</td>
                  <td className="px-3 py-2 text-center">{row.required}</td>
                  <td className="px-3 py-2 font-mono">{row.default}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Code */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Uso</h2>
        <div className="space-y-3">
          <pre className="rounded-lg bg-muted px-4 py-3 text-xs overflow-auto leading-relaxed font-mono">
            <code>{importCode}</code>
          </pre>
          <pre className="rounded-lg bg-muted px-4 py-3 text-xs overflow-auto leading-relaxed font-mono">
            <code>{usageCode}</code>
          </pre>
        </div>
      </section>

      {/* Accessibility */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold">Acessibilidade</h2>
        <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
          <li>O container SVG do recharts inclui <code className="font-mono bg-muted px-1 rounded">role="img"</code> e suporta navegacao por teclado via <code className="font-mono bg-muted px-1 rounded">accessibilityLayer</code>.</li>
          <li>O tooltip e acionado por hover ou foco — compativel com leitores de tela.</li>
          <li>Cores satisfazem contraste WCAG AA quando combinadas com os tokens de foreground do projeto.</li>
          <li>Nao depender exclusivamente de cor para diferenciar series — utilizar <code className="font-mono bg-muted px-1 rounded">indicator="line"</code> ou icones no tooltip quando necessario.</li>
        </ul>
      </section>
    </div>
  )
}
