"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import type { ExportIndexData, ExportIndexStat } from "@/services/commodityService"

const STAT_VARIANT_CLASS: Record<NonNullable<ExportIndexStat["variant"]>, string> = {
  success: "text-success",
  destructive: "text-destructive",
  default: "text-foreground",
}

interface ExportIndexChartProps {
  data: ExportIndexData | null
  isLoading?: boolean
  className?: string
}

export function ExportIndexChart({ data, isLoading, className }: ExportIndexChartProps) {
  const title = "Indice de Exportacao por Commodity"
  const description = "Indice base 100 | Trimestral"

  if (isLoading) {
    return (
      <Card className={cn("h-full flex flex-col gap-0 overflow-hidden", className)}>
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.chart_data.length || !data.series.length) {
    return (
      <Card className={cn("h-full flex flex-col gap-0 overflow-hidden", className)}>
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Sem dados de exportacao disponiveis para as suas commodities.
          </p>
        </CardContent>
      </Card>
    )
  }

  const chartConfig: ChartConfig = {}
  for (const s of data.series) {
    chartConfig[s.data_key] = {
      label: s.nome,
      color: `var(--${s.color_key})`,
    }
  }

  return (
    <Card className={cn("h-full flex flex-col gap-0 overflow-hidden", className)}>
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 px-2 pb-0 pt-2">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <LineChart
            data={data.chart_data}
            margin={{ top: 16, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              className="stroke-border/40"
            />
            <XAxis
              dataKey="quarter"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              domain={["auto", "auto"]}
              width={36}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 2" }}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    typeof value === "number" ? `${value.toFixed(1)} pts` : String(value),
                    name,
                  ]}
                  labelFormatter={(label) => `${label} — indice base 100`}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />

            {data.series.map((s) => (
              <Line
                key={s.data_key}
                dataKey={s.data_key}
                stroke={`var(--color-${s.data_key})`}
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: `var(--color-${s.data_key})`,
                  stroke: "var(--background)",
                  strokeWidth: 1.5,
                }}
                activeDot={{ r: 5, stroke: "var(--background)", strokeWidth: 2 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>

      {data.stats.length > 0 && (
        <div className="shrink-0 border-t border-border/50 px-4 py-3">
          <ul className="space-y-1">
            {data.stats.map((stat, i) => (
              <li key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{stat.label}</span>
                <span
                  className={cn(
                    "font-mono font-semibold ml-4",
                    STAT_VARIANT_CLASS[stat.variant ?? "default"]
                  )}
                >
                  {stat.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
