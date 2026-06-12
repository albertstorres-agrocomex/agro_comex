"use client"

import {
  CartesianGrid,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScatterPoint {
  x: number
  y: number
  /** Usado apenas em bubble charts — controla o tamanho do ponto */
  z?: number
  /** Rotulo exibido no tooltip */
  label?: string
}

export interface ScatterSeries {
  /** Chave que referencia uma entrada em ChartConfig */
  key: string
  data: ScatterPoint[]
}

export interface ScatterChartMetricItem {
  label: string
  value: string
  variant?: "success" | "warning" | "destructive" | "default"
}

export interface ScatterChartComexProps {
  series: ScatterSeries[]
  config: ChartConfig
  /** Label do eixo X exibido no tooltip */
  xAxisLabel?: string
  /** Label do eixo Y exibido no tooltip */
  yAxisLabel?: string
  /** Label do eixo Z (bubble) exibido no tooltip */
  zAxisLabel?: string
  title?: string
  description?: string
  /**
   * Exibe linha de regressao linear (OLS) calculada sobre a primeira serie.
   * Util para mostrar tendencia/correlacao.
   */
  showRegressionLine?: boolean
  /**
   * Ativa modo bubble: usa o campo `z` de cada ponto para dimensionar o circulo.
   */
  isBubble?: boolean
  /** Intervalo [min, max] para o ZAxis em pixels. Padrao: [40, 400] */
  bubbleRange?: [number, number]
  /** Linha de resumo abaixo do grafico */
  summary?: {
    label: string
    baselineValue: number | string
    currentValue: number | string
  }
  metricItems?: ScatterChartMetricItem[]
  xValueFormatter?: (val: number) => string
  yValueFormatter?: (val: number) => string
  zValueFormatter?: (val: number) => string
  className?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const variantClass: Record<
  NonNullable<ScatterChartMetricItem["variant"]>,
  string
> = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  default: "text-foreground",
}

/** Calcula coeficientes de regressao linear simples (OLS). */
function computeRegression(
  points: { x: number; y: number }[]
): { slope: number; intercept: number } | null {
  const n = points.length
  if (n < 2) return null

  const meanX = points.reduce((s, p) => s + p.x, 0) / n
  const meanY = points.reduce((s, p) => s + p.y, 0) / n
  const num = points.reduce((s, p) => s + (p.x - meanX) * (p.y - meanY), 0)
  const den = points.reduce((s, p) => s + (p.x - meanX) ** 2, 0)

  if (den === 0) return null
  const slope = num / den
  return { slope, intercept: meanY - slope * meanX }
}

// ---------------------------------------------------------------------------
// Tooltip customizado
// ---------------------------------------------------------------------------

interface ScatterTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ScatterPoint }>
  xAxisLabel: string
  yAxisLabel: string
  zAxisLabel: string
  isBubble: boolean
  xValueFormatter: (v: number) => string
  yValueFormatter: (v: number) => string
  zValueFormatter: (v: number) => string
  seriesColor?: string
}

function ScatterTooltipContent({
  active,
  payload,
  xAxisLabel,
  yAxisLabel,
  zAxisLabel,
  isBubble,
  xValueFormatter,
  yValueFormatter,
  zValueFormatter,
  seriesColor,
}: ScatterTooltipProps) {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  if (!point) return null

  // Suprime tooltip nos pontos da linha de regressao (sem label nem z definidos
  // e com valores gerados internamente)
  if ((point as ScatterPoint & { __regression?: boolean }).__regression) {
    return null
  }

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-xs space-y-1 min-w-[140px]">
      {point.label && (
        <p className="font-semibold text-foreground pb-0.5 border-b border-border/60 mb-1">
          {point.label}
        </p>
      )}
      <div className="flex items-center justify-between gap-4">
        {seriesColor && (
          <span
            className="inline-block h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: seriesColor }}
          />
        )}
        <span className="text-muted-foreground truncate">{xAxisLabel}</span>
        <span className="font-mono font-medium tabular-nums">
          {xValueFormatter(point.x)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground truncate">{yAxisLabel}</span>
        <span className="font-mono font-medium tabular-nums">
          {yValueFormatter(point.y)}
        </span>
      </div>
      {isBubble && point.z != null && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground truncate">{zAxisLabel}</span>
          <span className="font-mono font-medium tabular-nums">
            {zValueFormatter(point.z)}
          </span>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function ScatterChartComex({
  series,
  config,
  xAxisLabel = "X",
  yAxisLabel = "Y",
  zAxisLabel = "Z",
  title,
  description,
  showRegressionLine = false,
  isBubble = false,
  bubbleRange = [40, 400],
  summary,
  metricItems,
  xValueFormatter = (v) => v.toLocaleString("pt-BR"),
  yValueFormatter = (v) => v.toLocaleString("pt-BR"),
  zValueFormatter = (v) => v.toLocaleString("pt-BR"),
  className,
}: ScatterChartComexProps) {
  // Regressao linear sobre a primeira serie
  const regressionData: (ScatterPoint & { __regression: boolean })[] | null =
    (() => {
      if (!showRegressionLine || !series[0]?.data?.length) return null
      const points = series[0].data
      const reg = computeRegression(points)
      if (!reg) return null

      const xs = points.map((p) => p.x)
      const xMin = Math.min(...xs)
      const xMax = Math.max(...xs)

      return [
        { x: xMin, y: reg.intercept + reg.slope * xMin, __regression: true },
        { x: xMax, y: reg.intercept + reg.slope * xMax, __regression: true },
      ]
    })()

  return (
    <Card className={cn("flex flex-col gap-0 overflow-hidden", className)}>
      {(title || description) && (
        <CardHeader className="pb-2">
          {title && (
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
          )}
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </CardHeader>
      )}

      <CardContent className="flex-1 px-2 pb-0 pt-4">
        <ChartContainer config={config} className="h-[260px] w-full">
          <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-border/40"
            />
            <XAxis
              type="number"
              dataKey="x"
              name={xAxisLabel}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
              }
              domain={["auto", "auto"]}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yAxisLabel}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
              }
              width={40}
              domain={["auto", "auto"]}
            />
            {isBubble && (
              <ZAxis
                type="number"
                dataKey="z"
                name={zAxisLabel}
                range={bubbleRange}
              />
            )}

            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "var(--border)" }}
              content={(props) => (
                <ScatterTooltipContent
                  {...(props as unknown as ScatterTooltipProps)}
                  xAxisLabel={xAxisLabel}
                  yAxisLabel={yAxisLabel}
                  zAxisLabel={zAxisLabel}
                  isBubble={isBubble}
                  xValueFormatter={xValueFormatter}
                  yValueFormatter={yValueFormatter}
                  zValueFormatter={zValueFormatter}
                />
              )}
            />

            {series.length > 1 && (
              <ChartLegend content={<ChartLegendContent />} />
            )}

            {/* Series de dados */}
            {series.map(({ key, data }) => (
              <Scatter
                key={key}
                name={key}
                data={data}
                fill={`var(--color-${key})`}
                fillOpacity={isBubble ? 0.7 : 0.85}
                stroke={`var(--color-${key})`}
                strokeWidth={1}
                r={isBubble ? undefined : 5}
              />
            ))}

            {/* Linha de regressao linear */}
            {regressionData && (
              <Scatter
                name="__regression__"
                data={regressionData}
                fill="transparent"
                stroke="var(--muted-foreground)"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                line
                shape={<g />}
                legendType="none"
                isAnimationActive={false}
              />
            )}
          </ScatterChart>
        </ChartContainer>
      </CardContent>

      {(summary || (metricItems && metricItems.length > 0)) && (
        <div className="mt-2 border-t border-border/50 px-4 pb-4 pt-3">
          {summary && (
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">
                {summary.label}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">
                  {summary.baselineValue}
                </span>
                <span className="h-3 w-px bg-border" />
                <span className="font-mono font-semibold text-accent">
                  {summary.currentValue}
                </span>
              </div>
            </div>
          )}

          {metricItems && metricItems.length > 0 && (
            <ul className="space-y-1">
              {metricItems.map((item, i) => (
                <li key={i} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span
                    className={cn(
                      "font-mono font-semibold",
                      variantClass[item.variant ?? "default"]
                    )}
                  >
                    {item.value}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  )
}
