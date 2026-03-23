"use client"

import { LineChartComex, type LineChartMetricItem } from "@/components/LineChartComex"
import { type ChartConfig } from "@/components/ui/chart"

// --- Demo 1: Multi-series — Soja vs Milho preco mensal ---
const multiSeriesData = [
  { mes: "Jan", soja: 142500, milho: 68200 },
  { mes: "Fev", soja: 138900, milho: 71400 },
  { mes: "Mar", soja: 151200, milho: 74800 },
  { mes: "Abr", soja: 158700, milho: 73100 },
  { mes: "Mai", soja: 163400, milho: 69500 },
  { mes: "Jun", soja: 155800, milho: 72300 },
  { mes: "Jul", soja: 148200, milho: 75900 },
  { mes: "Ago", soja: 161500, milho: 78400 },
]

const multiSeriesConfig: ChartConfig = {
  soja: {
    label: "Soja",
    color: "var(--chart-1)",
  },
  milho: {
    label: "Milho",
    color: "var(--chart-2)",
  },
}

const multiSeriesMetrics: LineChartMetricItem[] = [
  { label: "Pico Soja — Mai", value: "163.400 BRL/t", variant: "success" },
  { label: "Pico Milho — Ago", value: "78.400 BRL/t", variant: "success" },
  { label: "Minimo Soja — Fev", value: "138.900 BRL/t", variant: "destructive" },
]

// --- Demo 2: Serie unica com activeIndex e trendLine ---
const singleData = [
  { semana: "S1", volume: 2100 },
  { semana: "S2", volume: 2850 },
  { semana: "S3", volume: 3420 },
  { semana: "S4", volume: 3180 },
  { semana: "S5", volume: 4050 },
  { semana: "S6", volume: 3760 },
  { semana: "S7", volume: 4280 },
  { semana: "S8", volume: 3920 },
]

const singleConfig: ChartConfig = {
  volume: {
    label: "Volume (mil t)",
    color: "var(--chart-4)",
  },
}

// --- Demo 3: Multi-commodity MVP — cafe (chart-3), acucar (chart-4), outros (chart-5) ---
const multiCommodityData = [
  { trimestre: "T1 23", cafe: 32, acucar: 58, outros: 44 },
  { trimestre: "T2 23", cafe: 38, acucar: 62, outros: 51 },
  { trimestre: "T3 23", cafe: 35, acucar: 55, outros: 48 },
  { trimestre: "T4 23", cafe: 41, acucar: 70, outros: 56 },
  { trimestre: "T1 24", cafe: 47, acucar: 66, outros: 53 },
  { trimestre: "T2 24", cafe: 52, acucar: 73, outros: 61 },
]

const multiCommodityConfig: ChartConfig = {
  cafe:   { label: "Cafe",   color: "var(--chart-3)" },
  acucar: { label: "Acucar", color: "var(--chart-4)" },
  outros: { label: "Outros", color: "var(--chart-5)" },
}

const multiCommodityMetrics: LineChartMetricItem[] = [
  { label: "Maior alta — Cafe",   value: "+62.5% em 6 trimestres", variant: "success" },
  { label: "Maior alta — Acucar", value: "+25.9% em 6 trimestres", variant: "success" },
  { label: "Variacao — Outros",   value: "+38.6% em 6 trimestres", variant: "warning" },
]

// --- Code examples ---
const importCode = `import { LineChartComex } from "@/components/LineChartComex"
import { type ChartConfig } from "@/components/ui/chart"`

const usageCode = `const data = [
  { mes: "Jan", soja: 142500, milho: 68200 },
  { mes: "Fev", soja: 138900, milho: 71400 },
  // ...
]

const config: ChartConfig = {
  soja: { label: "Soja", color: "var(--chart-1)" },
  milho: { label: "Milho", color: "var(--chart-2)" },
}

<LineChartComex
  data={data}
  config={config}
  seriesKeys={["soja", "milho"]}
  xAxisKey="mes"
  title="Evolucao de Precos"
  activeIndex={4}
  trendLine={{ value: 150000, label: "media" }}
  summary={{
    label: "Variacao no periodo",
    baselineValue: "142.5k",
    currentValue: "161.5k",
  }}
  metricItems={[
    { label: "Pico Soja", value: "163.400 BRL/t", variant: "success" },
  ]}
/>`

const propsTable = [
  { prop: "data", type: "Record<string, string | number>[]", required: "sim", default: "—", desc: "Array de pontos de dado" },
  { prop: "config", type: "ChartConfig", required: "sim", default: "—", desc: "Mapa de chaves para label + cor" },
  { prop: "seriesKeys", type: "string[]", required: "sim", default: "—", desc: "dataKeys de cada serie de linha, em ordem de renderizacao" },
  { prop: "xAxisKey", type: "string", required: "sim", default: "—", desc: "Chave do eixo X no objeto de dado" },
  { prop: "title", type: "string", required: "nao", default: "—", desc: "Titulo do card" },
  { prop: "description", type: "string", required: "nao", default: "—", desc: "Subtitulo do card" },
  { prop: "activeIndex", type: "number", required: "nao", default: "—", desc: "Indice do ponto destacado na ultima serie — exibe dot acento + callout de valor" },
  { prop: "trendLine", type: "{ value: number; label?: string }", required: "nao", default: "—", desc: "Linha de referencia horizontal (media, meta, threshold)" },
  { prop: "summary", type: "object", required: "nao", default: "—", desc: "Linha de resumo abaixo do grafico: { label, baselineValue, currentValue }" },
  { prop: "metricItems", type: "LineChartMetricItem[]", required: "nao", default: "—", desc: "Lista de metricas: { label, value, variant? }" },
  { prop: "valueFormatter", type: "(v: number) => string", required: "nao", default: "pt-BR locale", desc: "Formata valores no tooltip e callout ativo" },
  { prop: "className", type: "string", required: "nao", default: "—", desc: "Classe extra para o Card raiz" },
]

export default function LineChartPage() {
  return (
    <div className="space-y-12 py-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">LineChartComex</h1>
        <p className="text-sm text-muted-foreground">
          Grafico de linha para evolucao temporal de precos e volumes de commodities.
          Construido sobre <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">recharts</code> via
          shadcn/ui Chart, totalmente compativel com os tokens de design do projeto.
          Suporta multiplas series, ponto ativo destacado com callout e linha de referencia de tendencia.
        </p>
      </div>

      {/* Demo 1: Multi-series */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Multi-series — Evolucao de Precos</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Duas commodities comparadas ao longo do tempo, com linha de media e ponto ativo.
          </p>
        </div>
        <div className="max-w-xl">
          <LineChartComex
            data={multiSeriesData}
            config={multiSeriesConfig}
            seriesKeys={["soja", "milho"]}
            xAxisKey="mes"
            title="Evolucao de Precos — Soja e Milho"
            description="BRL / tonelada  |  Mensal 2025"
            activeIndex={4}
            trendLine={{ value: 151000, label: "media" }}
            summary={{
              label: "Variacao Soja no periodo",
              baselineValue: "142.5k",
              currentValue: "161.5k",
            }}
            metricItems={multiSeriesMetrics}
            valueFormatter={(v) =>
              v >= 1000
                ? `${(v / 1000).toFixed(1)}k`
                : v.toLocaleString("pt-BR")
            }
          />
        </div>
      </section>

      {/* Demo 2: Single series with trendLine */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Serie Unica com Linha de Referencia</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Uma unica serie com threshold de meta e ponto de pico destacado.
          </p>
        </div>
        <div className="max-w-xl">
          <LineChartComex
            data={singleData}
            config={singleConfig}
            seriesKeys={["volume"]}
            xAxisKey="semana"
            title="Volume de Exportacao — Soja"
            description="Mil toneladas por semana  |  2025"
            activeIndex={6}
            trendLine={{ value: 3500, label: "meta" }}
            summary={{
              label: "Total acumulado",
              baselineValue: "27.6M t",
              currentValue: "29.4M t",
            }}
            valueFormatter={(v) => `${v.toLocaleString("pt-BR")} kt`}
          />
        </div>
      </section>

      {/* Demo 3: Multi-commodity */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Multi-commodity (3 series)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cafe (chart-3), Acucar (chart-4) e Outros (chart-5) comparados por trimestre.
          </p>
        </div>
        <div className="max-w-xl">
          <LineChartComex
            data={multiCommodityData}
            config={multiCommodityConfig}
            seriesKeys={["cafe", "acucar", "outros"]}
            xAxisKey="trimestre"
            title="Indice de Exportacao por Commodity"
            description="Indice base 100  |  Trimestral"
            activeIndex={5}
            metricItems={multiCommodityMetrics}
            valueFormatter={(v) => `${v}`}
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
          <li>Nao depender exclusivamente de cor para diferenciar series — o formato de linha solida e suficiente na maioria dos casos, mas considerar <code className="font-mono bg-muted px-1 rounded">strokeDasharray</code> para diferenciar series adicionais.</li>
        </ul>
      </section>
    </div>
  )
}
