"use client"

import { useState } from "react"
import { WorldMapComex, type TradeCountry } from "@/components/WorldMapComex"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Mock: Brazilian agro exports by destination country (2024 est.)
const EXPORT_DATA: TradeCountry[] = [
  { id: "156", name: "China", value: 42_800_000_000, share: 31.2 },
  { id: "840", name: "Estados Unidos", value: 9_100_000_000, share: 6.6 },
  { id: "528", name: "Paises Baixos", value: 6_200_000_000, share: 4.5 },
  { id: "276", name: "Alemanha", value: 4_800_000_000, share: 3.5 },
  { id: "724", name: "Espanha", value: 4_100_000_000, share: 3.0 },
  { id: "392", name: "Japao", value: 3_700_000_000, share: 2.7 },
  { id: "410", name: "Coreia do Sul", value: 3_400_000_000, share: 2.5 },
  { id: "818", name: "Egito", value: 2_900_000_000, share: 2.1 },
  { id: "682", name: "Arabia Saudita", value: 2_600_000_000, share: 1.9 },
  { id: "704", name: "Vietna", value: 2_400_000_000, share: 1.7 },
  { id: "360", name: "Indonesia", value: 2_100_000_000, share: 1.5 },
  { id: "356", name: "India", value: 1_800_000_000, share: 1.3 },
  { id: "504", name: "Marrocos", value: 1_200_000_000, share: 0.9 },
  { id: "792", name: "Turquia", value: 1_100_000_000, share: 0.8 },
  { id: "032", name: "Argentina", value: 980_000_000, share: 0.7 },
  { id: "484", name: "Mexico", value: 870_000_000, share: 0.6 },
  { id: "616", name: "Polonia", value: 760_000_000, share: 0.6 },
  { id: "380", name: "Italia", value: 710_000_000, share: 0.5 },
  { id: "056", name: "Belgica", value: 680_000_000, share: 0.5 },
  { id: "764", name: "Tailandia", value: 620_000_000, share: 0.5 },
]

// Mock: Brazilian agro imports by origin country (2024 est.)
const IMPORT_DATA: TradeCountry[] = [
  { id: "156", name: "China", value: 18_200_000_000, share: 22.5 },
  { id: "840", name: "Estados Unidos", value: 15_800_000_000, share: 19.5 },
  { id: "276", name: "Alemanha", value: 8_100_000_000, share: 10.0 },
  { id: "032", name: "Argentina", value: 6_700_000_000, share: 8.3 },
  { id: "380", name: "Italia", value: 3_200_000_000, share: 4.0 },
  { id: "528", name: "Paises Baixos", value: 2_800_000_000, share: 3.5 },
  { id: "724", name: "Espanha", value: 2_100_000_000, share: 2.6 },
  { id: "356", name: "India", value: 1_700_000_000, share: 2.1 },
  { id: "250", name: "Franca", value: 1_500_000_000, share: 1.9 },
  { id: "752", name: "Suecia", value: 1_100_000_000, share: 1.4 },
]

type Mode = "export" | "import"

export default function WorldMapShowcasePage() {
  const [mode, setMode] = useState<Mode>("export")

  const data = mode === "export" ? EXPORT_DATA : IMPORT_DATA

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">WorldMap</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mapa mundial interativo para visualizacao de destinos de importacao e exportacao agro.
          Utiliza coropleto de intensidade baseado no volume comercial por pais.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        {(["export", "import"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              mode === m
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {m === "export" ? "Exportacao" : "Importacao"}
          </button>
        ))}
      </div>

      {/* Main demo */}
      <WorldMapComex
        data={data}
        title={
          mode === "export"
            ? "Destinos de Exportacao Agro — Brasil"
            : "Origens de Importacao Agro — Brasil"
        }
        description={
          mode === "export"
            ? "Volume de exportacoes agropecuarias por pais de destino (2024 est.)"
            : "Volume de importacoes agropecuarias por pais de origem (2024 est.)"
        }
      />

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Uso basico</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-muted p-4 font-mono text-xs text-muted-foreground">
{`import { WorldMapComex } from "@/components/WorldMapComex"

<WorldMapComex
  data={[
    { id: "156", name: "China", value: 42_800_000_000, share: 31.2 },
    { id: "840", name: "Estados Unidos", value: 9_100_000_000, share: 6.6 },
    // ISO 3166-1 numeric codes — ver tabela abaixo
  ]}
  title="Destinos de Exportacao"
  description="Volume por pais de destino (2024)"
  originCountryId="076"       // Brasil (padrao)
  valueFormatter={(v) => \`US$ \${(v / 1e9).toFixed(1)}B\`}
  shareFormatter={(v) => \`\${v.toFixed(1)}%\`}
/>`}
          </pre>
        </CardContent>
      </Card>

      {/* Props */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Props — WorldMapComex</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Prop</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Tipo</th>
                <th className="pb-2 pr-4 font-medium text-muted-foreground">Padrao</th>
                <th className="pb-2 font-medium text-muted-foreground">Descricao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {[
                ["data", "TradeCountry[]", "—", "Paises com id ISO 3166-1 numerico, nome e valor"],
                ["title", "string", "—", "Titulo do card"],
                ["description", "string", "—", "Descricao do card"],
                ["originCountryId", "string", '"076"', "ISO numerico do pais origem (Brasil)"],
                ["valueFormatter", "(v: number) => string", '"US$ X.XB"', "Formata o valor comercial"],
                ["shareFormatter", "(v: number) => string", '"X.X%"', "Formata o percentual"],
                ["className", "string", "—", "Classe CSS adicional no Card"],
              ].map(([prop, type, def, desc]) => (
                <tr key={prop}>
                  <td className="py-1.5 pr-4 font-mono text-foreground">{prop}</td>
                  <td className="py-1.5 pr-4 font-mono text-muted-foreground">{type}</td>
                  <td className="py-1.5 pr-4 font-mono text-muted-foreground">{def}</td>
                  <td className="py-1.5 text-muted-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* TradeCountry interface */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Interface TradeCountry</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-muted p-4 font-mono text-xs text-muted-foreground">
{`interface TradeCountry {
  id: string     // ISO 3166-1 numerico: "156" = China, "076" = Brasil
  name: string   // Nome de exibicao
  value: number  // Volume em USD (absoluto)
  share?: number // % do total (opcional — exibido no tooltip e lista)
}`}
          </pre>
        </CardContent>
      </Card>

      {/* Codigos ISO comuns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Codigos ISO 3166-1 numericos — principais parceiros BR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 font-mono text-xs text-muted-foreground sm:grid-cols-3">
            {[
              ["076", "Brasil"],
              ["156", "China"],
              ["840", "Estados Unidos"],
              ["276", "Alemanha"],
              ["528", "Paises Baixos"],
              ["724", "Espanha"],
              ["392", "Japao"],
              ["410", "Coreia do Sul"],
              ["818", "Egito"],
              ["682", "Arabia Saudita"],
              ["356", "India"],
              ["032", "Argentina"],
              ["484", "Mexico"],
              ["704", "Vietna"],
              ["360", "Indonesia"],
              ["250", "Franca"],
              ["380", "Italia"],
              ["056", "Belgica"],
              ["616", "Polonia"],
              ["792", "Turquia"],
            ].map(([code, name]) => (
              <div key={code} className="flex gap-2 py-0.5">
                <span className="w-8 text-foreground">{code}</span>
                <span>{name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
