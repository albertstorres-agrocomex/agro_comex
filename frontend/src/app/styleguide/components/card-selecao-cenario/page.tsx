"use client"

import { CardSelecaoCenarioAnalise } from "@/components/CardSelecaoCenarioAnalise"

export default function CardSelecaoCenarioPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Componente
        </p>
        <h1 className="text-3xl font-bold text-foreground">
          CardSelecaoCenarioAnalise
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg">
          Card de seleção de cenário para análises de derivativos. Três opções de
          estratégia — Conservador, Moderado e Agressivo — com o cenário central
          destacado como recomendado.
        </p>
      </div>

      {/* Demo — dark background to match intended context */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-foreground/80">Demo interativo</h2>
        <div className="rounded-2xl bg-[#081F0F] p-8 md:p-12">
          <CardSelecaoCenarioAnalise
            onCenarioChange={(id) => console.log("Cenário selecionado:", id)}
          />
        </div>
      </section>

      {/* Usage */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground/80">Uso básico</h2>
        <pre className="rounded-xl bg-muted px-5 py-4 text-xs text-muted-foreground overflow-x-auto leading-relaxed">
          {`import { CardSelecaoCenarioAnalise } from "@/components/CardSelecaoCenarioAnalise"

// Uso padrão (3 cenários pré-configurados)
<CardSelecaoCenarioAnalise
  onCenarioChange={(id) => console.log(id)}
/>

// Com seleção inicial
<CardSelecaoCenarioAnalise
  defaultSelected="moderado"
  onCenarioChange={(id) => setScenarion(id)}
/>`}
        </pre>
      </section>

      {/* Props */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground/80">Props</h2>
        <div className="rounded-xl border border-border overflow-hidden text-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-foreground/70">Prop</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground/70">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground/70">Padrão</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground/70">Descrição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-4 py-3 font-mono text-xs text-accent">cenarios</td>
                <td className="px-4 py-3 text-muted-foreground">CenarioConfig[]</td>
                <td className="px-4 py-3 text-muted-foreground">CENARIOS_DEFAULT</td>
                <td className="px-4 py-3 text-muted-foreground">Array de cenários a exibir</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs text-accent">defaultSelected</td>
                <td className="px-4 py-3 text-muted-foreground">"conservador" | "moderado" | "agressivo"</td>
                <td className="px-4 py-3 text-muted-foreground">undefined</td>
                <td className="px-4 py-3 text-muted-foreground">Cenário pré-selecionado</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs text-accent">onCenarioChange</td>
                <td className="px-4 py-3 text-muted-foreground">(id) =&gt; void</td>
                <td className="px-4 py-3 text-muted-foreground">undefined</td>
                <td className="px-4 py-3 text-muted-foreground">Callback ao selecionar cenário</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-mono text-xs text-accent">className</td>
                <td className="px-4 py-3 text-muted-foreground">string</td>
                <td className="px-4 py-3 text-muted-foreground">undefined</td>
                <td className="px-4 py-3 text-muted-foreground">Classe CSS adicional no wrapper</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* State variants */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-foreground/80">Estado com seleção pré-definida</h2>
        <div className="rounded-2xl bg-[#081F0F] p-8 md:p-12">
          <CardSelecaoCenarioAnalise defaultSelected="conservador" />
        </div>
      </section>
    </div>
  )
}
