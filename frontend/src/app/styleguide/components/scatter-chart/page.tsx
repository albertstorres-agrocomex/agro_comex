"use client"

import {
  ScatterChartComex,
  type ScatterChartMetricItem,
  type ScatterSeries,
} from "@/components/ScatterChartComex"
import { type ChartConfig } from "@/components/ui/chart"

// ---------------------------------------------------------------------------
// Demo 1: Correlacao de precos — Soja x Milho (com regressao linear)
// ---------------------------------------------------------------------------

const correlacaoSeries: ScatterSeries[] = [
  {
    key: "correlacao",
    data: [
      { x: 130, y: 68, label: "Jan" },
      { x: 135, y: 71, label: "Fev" },
      { x: 142, y: 72, label: "Mar" },
      { x: 148, y: 75, label: "Abr" },
      { x: 155, y: 74, label: "Mai" },
      { x: 151, y: 73, label: "Jun" },
      { x: 158, y: 77, label: "Jul" },
      { x: 163, y: 80, label: "Ago" },
      { x: 157, y: 78, label: "Set" },
      { x: 149, y: 76, label: "Out" },
      { x: 144, y: 74, label: "Nov" },
      { x: 138, y: 70, label: "Dez" },
    ],
  },
]

const correlacaoConfig: ChartConfig = {
  correlacao: { label: "Soja vs Milho", color: "var(--chart-1)" },
}

const correlacaoMetrics: ScatterChartMetricItem[] = [
  { label: "Correlacao (r)", value: "+0.97", variant: "success" },
  { label: "Coef. de determinacao (R²)", value: "0.94", variant: "success" },
  { label: "Amplitude Soja", value: "130 – 163 BRL/sac", variant: "default" },
]

// ---------------------------------------------------------------------------
// Demo 2: Risco vs Retorno por classe de derivativo (multi-serie)
// ---------------------------------------------------------------------------

const riscoRetornoSeries: ScatterSeries[] = [
  {
    key: "futuros",
    data: [
      { x: 2.1, y: 4.5, label: "Soja Fut. Jan" },
      { x: 3.4, y: 6.2, label: "Milho Fut. Mar" },
      { x: 4.8, y: 8.1, label: "Cafe Fut. Mai" },
      { x: 2.9, y: 5.3, label: "Acucar Fut. Jul" },
      { x: 6.2, y: 9.4, label: "Soja Fut. Set" },
      { x: 5.1, y: 7.8, label: "Milho Fut. Dez" },
    ],
  },
  {
    key: "opcoes",
    data: [
      { x: 11.2, y: 14.3, label: "Call Soja ATM" },
      { x: 18.5, y: 22.1, label: "Put Milho OTM" },
      { x: 22.4, y: 28.7, label: "Call Cafe ITM" },
      { x: 15.8, y: 19.2, label: "Put Acucar ATM" },
      { x: 24.1, y: 31.5, label: "Straddle Soja" },
      { x: 13.7, y: 17.6, label: "Strangle Milho" },
    ],
  },
  {
    key: "swaps",
    data: [
      { x: 4.2, y: 6.8, label: "Swap Soja 6M" },
      { x: 5.9, y: 8.4, label: "Swap Milho 12M" },
      { x: 7.3, y: 10.1, label: "Swap Cafe 9M" },
      { x: 6.1, y: 9.0, label: "Swap Acucar 6M" },
      { x: 9.4, y: 12.3, label: "Swap Blend 12M" },
    ],
  },
]

const riscoRetornoConfig: ChartConfig = {
  futuros: { label: "Futuros", color: "var(--chart-1)" },
  opcoes: { label: "Opcoes", color: "var(--chart-4)" },
  swaps: { label: "Swaps", color: "var(--chart-3)" },
}

const riscoRetornoMetrics: ScatterChartMetricItem[] = [
  { label: "Melhor Sharpe — Futuros", value: "Soja Fut. Jan  2.14x", variant: "success" },
  { label: "Maior retorno — Opcoes", value: "Straddle Soja  +31.5%", variant: "warning" },
  { label: "Melhor relacao risco/ret.", value: "Swap Soja 6M", variant: "default" },
]

// ---------------------------------------------------------------------------
// Demo 3: Bubble Chart — Volume x Preco x Market Share por commodity
// ---------------------------------------------------------------------------

const bubbleSeries: ScatterSeries[] = [
  {
    key: "soja",
    data: [{ x: 185, y: 38200, z: 49, label: "Soja" }],
  },
  {
    key: "milho",
    data: [{ x: 92, y: 21500, z: 28, label: "Milho" }],
  },
  {
    key: "cafe",
    data: [{ x: 1240, y: 4800, z: 12, label: "Cafe" }],
  },
  {
    key: "acucar",
    data: [{ x: 310, y: 4300, z: 7, label: "Acucar" }],
  },
  {
    key: "algodao",
    data: [{ x: 420, y: 2950, z: 4, label: "Algodao" }],
  },
]

const bubbleConfig: ChartConfig = {
  soja:     { label: "Soja",     color: "var(--chart-1)" },
  milho:    { label: "Milho",    color: "var(--chart-2)" },
  cafe:     { label: "Cafe",     color: "var(--chart-3)" },
  acucar:   { label: "Acucar",   color: "var(--chart-4)" },
  algodao:  { label: "Algodao",  color: "var(--chart-5)" },
}

const bubbleMetrics: ScatterChartMetricItem[] = [
  { label: "Maior market share", value: "Soja  49%", variant: "success" },
  { label: "Maior preco unitario", value: "Cafe  1.240 BRL/sac", variant: "default" },
  { label: "Maior volume", value: "Soja  38.200 mil t", variant: "default" },
]

// ---------------------------------------------------------------------------
// Strings de codigo
// ---------------------------------------------------------------------------

const importCode = `import { ScatterChartComex, type ScatterSeries } from "@/components/ScatterChartComex"
import { type ChartConfig } from "@/components/ui/chart"`

const usageCode = `const series: ScatterSeries[] = [
  {
    key: "correlacao",
    data: [
      { x: 130, y: 68, label: "Jan" },
      { x: 148, y: 75, label: "Abr" },
      // ...
    ],
  },
]

const config: ChartConfig = {
  correlacao: { label: "Soja vs Milho", color: "var(--chart-1)" },
}

<ScatterChartComex
  series={series}
  config={config}
  xAxisLabel="Preco Soja (BRL/sac)"
  yAxisLabel="Preco Milho (BRL/sac)"
  title="Correlacao Soja x Milho — 2024"
  showRegressionLine
  xValueFormatter={(v) => \`\${v} BRL\`}
  yValueFormatter={(v) => \`\${v} BRL\`}
  metricItems={[
    { label: "Correlacao (r)", value: "+0.97", variant: "success" },
  ]}
/>`

const propsTable = [
  { prop: "series", type: "ScatterSeries[]", required: "sim", default: "—", desc: "Array de series; cada serie tem key (ref. ao config) e data (pontos {x, y, z?, label?})" },
  { prop: "config", type: "ChartConfig", required: "sim", default: "—", desc: "Mapeamento de chave → { label, color } para cada serie" },
  { prop: "xAxisLabel", type: "string", required: "nao", default: '"X"', desc: "Nome do eixo X exibido no tooltip" },
  { prop: "yAxisLabel", type: "string", required: "nao", default: '"Y"', desc: "Nome do eixo Y exibido no tooltip" },
  { prop: "zAxisLabel", type: "string", required: "nao", default: '"Z"', desc: "Nome do eixo Z exibido no tooltip (bubble)" },
  { prop: "title", type: "string", required: "nao", default: "—", desc: "Titulo do card" },
  { prop: "description", type: "string", required: "nao", default: "—", desc: "Descricao abaixo do titulo" },
  { prop: "showRegressionLine", type: "boolean", required: "nao", default: "false", desc: "Exibe linha de regressao linear (OLS) calculada sobre a primeira serie" },
  { prop: "isBubble", type: "boolean", required: "nao", default: "false", desc: "Ativa modo bubble: usa z de cada ponto para dimensionar o circulo" },
  { prop: "bubbleRange", type: "[number, number]", required: "nao", default: "[40, 400]", desc: "Intervalo de tamanho em px para o ZAxis" },
  { prop: "summary", type: "object", required: "nao", default: "—", desc: "Linha de resumo: { label, baselineValue, currentValue }" },
  { prop: "metricItems", type: "ScatterChartMetricItem[]", required: "nao", default: "—", desc: "Lista de metricas: { label, value, variant? }" },
  { prop: "xValueFormatter", type: "(v: number) => string", required: "nao", default: "pt-BR locale", desc: "Formata valores do eixo X no tooltip" },
  { prop: "yValueFormatter", type: "(v: number) => string", required: "nao", default: "pt-BR locale", desc: "Formata valores do eixo Y no tooltip" },
  { prop: "zValueFormatter", type: "(v: number) => string", required: "nao", default: "pt-BR locale", desc: "Formata valores Z no tooltip (bubble)" },
  { prop: "className", type: "string", required: "nao", default: "—", desc: "Classe extra para o Card raiz" },
]

// ---------------------------------------------------------------------------
// Pagina
// ---------------------------------------------------------------------------

export default function ScatterChartPage() {
  return (
    <div className="space-y-12 py-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">ScatterChartComex</h1>
        <p className="text-sm text-muted-foreground">
          Grafico de dispersao para analise de correlacao, classificacao por categoria
          e visualizacao de tres dimensoes (bubble). Construido sobre Recharts +
          shadcn/ui, segue os tokens de design do AgroComex.
        </p>
      </div>

      {/* Demo 1: Correlacao com regressao */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Correlacao de Precos (com regressao linear)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dispersao simples com linha de regressao OLS. Util para identificar
            correlacao entre precos de duas commodities ao longo do tempo.
          </p>
        </div>
        <div className="max-w-xl">
          <ScatterChartComex
            series={correlacaoSeries}
            config={correlacaoConfig}
            xAxisLabel="Preco Soja (BRL/sac)"
            yAxisLabel="Preco Milho (BRL/sac)"
            title="Correlacao Soja x Milho — 2024"
            description="Preco mensal — BRL por saca de 60 kg"
            showRegressionLine
            xValueFormatter={(v) => `${v} BRL`}
            yValueFormatter={(v) => `${v} BRL`}
            summary={{ label: "Amplitude anual — Soja", baselineValue: "130 BRL", currentValue: "163 BRL" }}
            metricItems={correlacaoMetrics}
          />
        </div>
      </section>

      {/* Demo 2: Risco vs Retorno multi-serie */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Risco vs Retorno por Classe de Derivativo</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Multi-serie com tres categorias de ativos. Cada cor representa uma classe
            de derivativo — padrao de visualizacao semelhante ao k-NN.
          </p>
        </div>
        <div className="max-w-xl">
          <ScatterChartComex
            series={riscoRetornoSeries}
            config={riscoRetornoConfig}
            xAxisLabel="Volatilidade (%)"
            yAxisLabel="Retorno esperado (%)"
            title="Risco vs Retorno — Derivativos Agricolas"
            description="Posicoes abertas em carteira — Q3 2025"
            xValueFormatter={(v) => `${v}%`}
            yValueFormatter={(v) => `${v}%`}
            metricItems={riscoRetornoMetrics}
          />
        </div>
      </section>

      {/* Demo 3: Bubble chart */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Bubble Chart — Volume x Preco x Market Share</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tres dimensoes simultaneas: eixo X (preco medio), eixo Y (volume exportado)
            e tamanho da bolha (participacao de mercado em %). Cada commodity e uma serie.
          </p>
        </div>
        <div className="max-w-xl">
          <ScatterChartComex
            series={bubbleSeries}
            config={bubbleConfig}
            xAxisLabel="Preco medio (BRL/sac)"
            yAxisLabel="Volume (mil t)"
            zAxisLabel="Market share (%)"
            title="Commodities — Volume x Preco x Participacao"
            description="Exportacoes brasileiras acumuladas — 2025"
            isBubble
            bubbleRange={[60, 600]}
            xValueFormatter={(v) => `${v} BRL`}
            yValueFormatter={(v) => `${(v / 1000).toFixed(1)}M t`}
            zValueFormatter={(v) => `${v}%`}
            metricItems={bubbleMetrics}
          />
        </div>
      </section>

      {/* Importacao */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Importacao</h2>
        <pre className="rounded-lg bg-muted px-4 py-3 text-xs font-mono overflow-x-auto">
          <code>{importCode}</code>
        </pre>
      </section>

      {/* Uso basico */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Uso basico</h2>
        <pre className="rounded-lg bg-muted px-4 py-3 text-xs font-mono overflow-x-auto">
          <code>{usageCode}</code>
        </pre>
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

      {/* Casos de uso no projeto */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Casos de uso no AgroComex</h2>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>
            <span className="font-medium text-foreground">Correlacao de precos</span>
            {" "}— dispersao com regressao para identificar co-movimentos entre commodities.
          </li>
          <li>
            <span className="font-medium text-foreground">Analise de risco/retorno</span>
            {" "}— comparativo visual de classes de derivativos por volatilidade e retorno esperado.
          </li>
          <li>
            <span className="font-medium text-foreground">Bubble de portfolio</span>
            {" "}— visualizacao de tres metricas simultaneas (ex: preco, volume, participacao de mercado).
          </li>
          <li>
            <span className="font-medium text-foreground">Classificacao k-NN</span>
            {" "}— exibicao do espaco de features com cores por classe para modelos de ML.
          </li>
        </ul>
      </section>

      {/* Acessibilidade */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Acessibilidade</h2>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>Tooltip exibe valores numericos formatados para leitores de tela.</li>
          <li>Multi-serie diferencia por cor E formato de ponto — nao depende exclusivamente de cor.</li>
          <li>Linha de regressao usa tracejado para ser distinguivel de series de dados.</li>
          <li>Cores satisfazem contraste WCAG AA com os tokens de foreground do projeto.</li>
        </ul>
      </section>
    </div>
  )
}
