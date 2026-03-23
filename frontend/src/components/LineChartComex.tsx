"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts"

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

export interface LineChartMetricItem {
  label: string
  value: string
  variant?: "success" | "warning" | "destructive" | "default"
}

export interface LineChartComexProps {
  data: Array<Record<string, string | number>>
  config: ChartConfig
  /** dataKey names for each line series, in render order */
  seriesKeys: string[]
  xAxisKey: string
  title?: string
  description?: string
  /**
   * Index of the highlighted point in the last series.
   * Renders an accent-colored dot with a value label callout.
   */
  activeIndex?: number
  /** Optional horizontal reference line (e.g. average, target) */
  trendLine?: {
    value: number
    label?: string
  }
  /** Summary line rendered below the chart */
  summary?: {
    label: string
    baselineValue: number | string
    currentValue: number | string
  }
  metricItems?: LineChartMetricItem[]
  valueFormatter?: (val: number) => string
  className?: string
}

const variantClass: Record<NonNullable<LineChartMetricItem["variant"]>, string> = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  default: "text-foreground",
}

export function LineChartComex({
  data,
  config,
  seriesKeys,
  xAxisKey,
  title,
  description,
  activeIndex,
  trendLine,
  summary,
  metricItems,
  valueFormatter = (v) => v.toLocaleString("pt-BR"),
  className,
}: LineChartComexProps) {
  const lastKey = seriesKeys[seriesKeys.length - 1]

  return (
    <Card className={cn("flex flex-col gap-0 overflow-hidden", className)}>
      {(title || description) && (
        <CardHeader className="pb-2">
          {title && <CardTitle className="text-base font-semibold">{title}</CardTitle>}
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </CardHeader>
      )}

      <CardContent className="flex-1 px-2 pb-0 pt-4">
        <ChartContainer config={config} className="h-[220px] w-full">
          <LineChart data={data} margin={{ top: 28, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey={xAxisKey}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
              }
              width={36}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1, strokeDasharray: "4 2" }}
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    typeof value === "number" ? valueFormatter(value) : String(value)
                  }
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />

            {trendLine && (
              <ReferenceLine
                y={trendLine.value}
                stroke="var(--muted-foreground)"
                strokeDasharray="5 3"
                strokeWidth={1}
                label={
                  trendLine.label
                    ? {
                        value: trendLine.label,
                        position: "insideTopRight",
                        fontSize: 9,
                        fill: "var(--muted-foreground)",
                        dy: -4,
                      }
                    : undefined
                }
              />
            )}

            {seriesKeys.map((key) => {
              const isLast = key === lastKey
              return (
                <Line
                  key={key}
                  dataKey={key}
                  stroke={`var(--color-${key})`}
                  strokeWidth={2}
                  dot={(props: Record<string, unknown>) => {
                    const cx = Number(props.cx)
                    const cy = Number(props.cy)
                    const index = Number(props.index)
                    const isActive = isLast && activeIndex !== undefined && index === activeIndex

                    if (isActive) {
                      const val = data[index]?.[key]
                      const label =
                        typeof val === "number" ? valueFormatter(val) : String(val ?? "")
                      return (
                        <g key={`dot-active-${key}-${index}`}>
                          <line
                            x1={cx}
                            y1={cy - 7}
                            x2={cx}
                            y2={cy - 19}
                            stroke="var(--accent)"
                            strokeWidth={1.5}
                            strokeDasharray="3 2"
                          />
                          <rect
                            x={cx - 18}
                            y={cy - 35}
                            width={36}
                            height={16}
                            rx={3}
                            fill="var(--accent)"
                          />
                          <text
                            x={cx}
                            y={cy - 23}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={9}
                            fontWeight={700}
                            fill="var(--foreground)"
                          >
                            {label}
                          </text>
                          <circle
                            cx={cx}
                            cy={cy}
                            r={6}
                            fill="var(--color-accent)"
                            stroke="var(--background)"
                            strokeWidth={2}
                          />
                        </g>
                      )
                    }

                    return (
                      <circle
                        key={`dot-${key}-${index}`}
                        cx={cx}
                        cy={cy}
                        r={2.5}
                        fill={`var(--color-${key})`}
                        stroke="var(--background)"
                        strokeWidth={1.5}
                      />
                    )
                  }}
                  activeDot={{ r: 5, stroke: "var(--background)", strokeWidth: 2 }}
                />
              )
            })}
          </LineChart>
        </ChartContainer>
      </CardContent>

      {(summary || (metricItems && metricItems.length > 0)) && (
        <div className="mt-2 border-t border-border/50 px-4 pb-4 pt-3">
          {summary && (
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">{summary.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted-foreground">{summary.baselineValue}</span>
                <span className="h-3 w-px bg-border" />
                <span className="font-mono font-semibold text-accent">{summary.currentValue}</span>
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
