"use client"

import { Cell, Pie, PieChart } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

export interface PieChartDataItem {
  label: string
  value: number
  /** Chave que mapeia para a cor em ChartConfig (ex: "soja") */
  colorKey: string
}

export interface PieChartComexProps {
  data: PieChartDataItem[]
  config: ChartConfig
  title?: string
  description?: string
  /** Valor exibido no centro do donut (ex: "R$ 76.356") */
  totalValue?: string
  /** Rotulo abaixo do valor central (ex: "Total") */
  totalLabel?: string
  valueFormatter?: (val: number) => string
  className?: string
}

export function PieChartComex({
  data,
  config,
  title,
  description,
  totalValue,
  totalLabel,
  valueFormatter = (v) => v.toLocaleString("pt-BR"),
  className,
}: PieChartComexProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      {(title || description) && (
        <CardHeader className="pb-2">
          {title && <CardTitle className="text-base font-semibold">{title}</CardTitle>}
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </CardHeader>
      )}

      <CardContent className="flex flex-row items-center gap-6 pb-4 pt-2">
        {/* Donut chart */}
        <div className="relative shrink-0">
          <ChartContainer config={config} className="h-[160px] w-[160px]">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      typeof value === "number" ? valueFormatter(value) : String(value)
                    }
                    nameKey="label"
                  />
                }
              />
              <Pie
                data={data.map((d) => ({ ...d, name: d.label }))}
                dataKey="value"
                nameKey="label"
                innerRadius={52}
                outerRadius={72}
                strokeWidth={2}
                stroke="var(--card)"
                paddingAngle={2}
              >
                {data.map((item) => (
                  <Cell
                    key={item.colorKey}
                    fill={`var(--color-${item.colorKey})`}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* Valor central */}
          {(totalValue || totalLabel) && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              {totalValue && (
                <span className="text-sm font-bold leading-none">{totalValue}</span>
              )}
              {totalLabel && (
                <span className="mt-0.5 text-[10px] text-muted-foreground">{totalLabel}</span>
              )}
            </div>
          )}
        </div>

        {/* Legenda lateral */}
        <ul className="flex-1 space-y-2">
          {data.map((item) => (
            <li
              key={item.colorKey}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: `var(--color-${item.colorKey})` }}
                />
                <span className="truncate text-muted-foreground">{item.label}</span>
              </div>
              <span className="shrink-0 font-mono font-semibold">
                {valueFormatter(item.value)}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}