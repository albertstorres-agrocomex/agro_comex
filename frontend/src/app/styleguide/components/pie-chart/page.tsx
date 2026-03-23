"use client"

import { PieChartComex, type PieChartDataItem } from "@/components/PieChartComex"
import { type ChartConfig } from "@/components/ui/chart"

// --- Demo 1: Distribuicao de commodities exportadas ---
// MVP: Acucar (chart-4), Soja (chart-1), Milho (chart-2), Cafe (chart-3), Outros (chart-5)
const commodityData: PieChartDataItem[] = [
  { label: "Soja",   value: 38200, colorKey: "soja" },
  { label: "Milho",  value: 21500, colorKey: "milho" },
  { label: "Cafe",   value: 9800,  colorKey: "cafe" },
  { label: "Acucar", value: 4300,  colorKey: "acucar" },
  { label: "Outros", value: 2556,  colorKey: "outros" },
]

const commodityConfig: ChartConfig = {
  soja:   { label: "Soja",   color: "var(--chart-1)" },
  milho:  { label: "Milho",  color: "var(--chart-2)" },
  cafe:   { label: "Cafe",   color: "var(--chart-3)" },
  acucar: { label: "Acucar", color: "var(--chart-4)" },
  outros: { label: "Outros", color: "var(--chart-5)" },
}

// --- Demo 2: Destinos de exportacao por regiao ---
const destinoData: PieChartDataItem[] = [
  { label: "Asia", value: 54000, colorKey: "asia" },
  { label: "Europa", value: 23000, colorKey: "europa" },
  { label: "America do Norte", value: 11500, colorKey: "america_norte" },
  { label: "Oriente Medio", value: 7856, colorKey: "oriente_medio" },
]

const destinoConfig: ChartConfig = {
  asia:           { label: "Asia",             color: "var(--chart-1)" },
  europa:         { label: "Europa",           color: "var(--chart-3)" },
  america_norte:  { label: "America do Norte", color: "var(--chart-4)" },
  oriente_medio:  { label: "Oriente Medio",    color: "var(--chart-5)" },
}

// --- Demo 3: Participacao de mercado por tipo de derivativo ---
const derivativoData: PieChartDataItem[] = [
  { label: "Futuros", value: 41200, colorKey: "futuros" },
  { label: "Opcoes", value: 18900, colorKey: "opcoes" },
  { label: "Swaps", value: 16256, colorKey: "swaps" },
]

const derivativoConfig: ChartConfig = {
  futuros: { label: "Futuros", color: "var(--chart-2)" },
  opcoes:  { label: "Opcoes",  color: "var(--chart-4)" },
  swaps:   { label: "Swaps",   color: "var(--muted-foreground)" },
}

// --- Strings de codigo ---
const importCode = `import { PieChartComex, type PieChartDataItem } from "@/components/PieChartComex"
import { type ChartConfig } from "@/components/ui/chart"`

const usageCode = `const data: PieChartDataItem[] = [
  { label: "Soja",    value: 38200, colorKey: "soja" },
  { label: "Milho",   value: 21500, colorKey: "milho" },
  { label: "Outros",  value: 16756, colorKey: "outros" },
]

const config: ChartConfig = {
  soja:   { label: "Soja",   color: "var(--chart-1)" },
  milho:  { label: "Milho",  color: "var(--chart-2)" },
  outros: { label: "Outros", color: "var(--chart-5)" },
}

<PieChartComex
  data={data}
  config={config}
  title="Distribuicao de Exportacoes"
  description="Volume em mil toneladas — 2025"
  totalValue="76.456"
  totalLabel="Total"
  valueFormatter={(v) => \`\${(v / 1000).toFixed(1)}k t\`}
/>`

const propsTable = [
  { prop: "data", type: "PieChartDataItem[]", required: "sim", default: "—", desc: "Array de fatias: { label, value, colorKey }" },
  { prop: "config", type: "ChartConfig", required: "sim", default: "—", desc: "Mapa de colorKey para label + cor" },
  { prop: "title", type: "string", required: "nao", default: "—", desc: "Titulo do card" },
  { prop: "description", type: "string", required: "nao", default: "—", desc: "Subtitulo do card" },
  { prop: "totalValue", type: "string", required: "nao", default: "—", desc: "Valor exibido no centro do donut" },
  { prop: "totalLabel", type: "string", required: "nao", default: "—", desc: "Rotulo abaixo do valor central" },
  { prop: "valueFormatter", type: "(v: number) => string", required: "nao", default: "pt-BR locale", desc: "Formata valores na legenda e tooltip" },
  { prop: "className", type: "string", required: "nao", default: "—", desc: "Classe extra para o Card raiz" },
]

export default function PieChartPage() {
  return (
    <div className="space-y-12 py-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">PieChartComex</h1>
        <p className="text-sm text-muted-foreground">
          Grafico de pizza no formato donut para distribuicao proporcional de volumes e valores.
          Construido sobre{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">recharts</code> via
          shadcn/ui Chart, com legenda lateral e valor centralizado no donut.
        </p>
      </div>

      {/* Demo 1 */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Distribuicao de Commodities</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quatro commodities MVP + Outros, com legenda lateral e total centralizado no donut.
          </p>
        </div>
        <div className="max-w-sm">
          <PieChartComex
            data={commodityData}
            config={commodityConfig}
            title="Exportacoes por Commodity"
            description="Volume em mil toneladas — 2025"
            totalValue="76.356"
            totalLabel="Total"
            valueFormatter={(v) =>
              v >= 1000 ? `${(v / 1000).toFixed(1)}k t` : `${v} t`
            }
          />
        </div>
      </section>

      {/* Demo 2 */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Destinos de Exportacao</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quatro regioes destino com valores absolutos em USD.
          </p>
        </div>
        <div className="max-w-sm">
          <PieChartComex
            data={destinoData}
            config={destinoConfig}
            title="Destinos de Exportacao"
            description="Valor FOB em mil USD — T1 2025"
            totalValue="$96.4M"
            totalLabel="FOB Total"
            valueFormatter={(v) =>
              v >= 1000 ? `$${(v / 1000).toFixed(1)}M` : `$${v}k`
            }
          />
        </div>
      </section>

      {/* Demo 3 */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Participacao por Derivativo</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tres classes de derivativo com porcentagem formatada.
          </p>
        </div>
        <div className="max-w-sm">
          <PieChartComex
            data={derivativoData}
            config={derivativoConfig}
            title="Mix de Derivativos"
            description="Contratos abertos — Fev 2025"
            totalValue="76.356"
            totalLabel="Contratos"
            valueFormatter={(v) => {
              const total = derivativoData.reduce((s, d) => s + d.value, 0)
              return `${((v / total) * 100).toFixed(1)}%`
            }}
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
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-semibold text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {propsTable.map((row) => (
                <tr key={row.prop} className="transition-colors hover:bg-muted/30">
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
          <pre className="overflow-auto rounded-lg bg-muted px-4 py-3 font-mono text-xs leading-relaxed">
            <code>{importCode}</code>
          </pre>
          <pre className="overflow-auto rounded-lg bg-muted px-4 py-3 font-mono text-xs leading-relaxed">
            <code>{usageCode}</code>
          </pre>
        </div>
      </section>

      {/* Accessibility */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold">Acessibilidade</h2>
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          <li>
            O container SVG do recharts inclui{" "}
            <code className="rounded bg-muted px-1 font-mono">role="img"</code> e suporta
            navegacao por teclado.
          </li>
          <li>
            O tooltip e acionado por hover ou foco — compativel com leitores de tela.
          </li>
          <li>
            A legenda lateral replica os dados visualmente, servindo como alternativa textual
            ao grafico para usuarios de tecnologia assistiva.
          </li>
          <li>
            Nao depender exclusivamente de cor para diferenciar fatias — use labels descritivos
            na legenda e valores formatados no tooltip.
          </li>
        </ul>
      </section>
    </div>
  )
}
