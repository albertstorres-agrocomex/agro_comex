"use client"

import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts"

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

export interface BarChartMetricItem {
  label: string
  value: string
  variant?: "success" | "warning" | "destructive" | "default"
}

export interface BarChartComexProps {
  data: Array<Record<string, string | number>>
  config: ChartConfig
  /** dataKey names for each bar series, in render order */
  seriesKeys: string[]
  xAxisKey: string
  title?: string
  description?: string
  /**
   * Index of the highlighted bar in the last series.
   * When set, that bar renders with the accent color and shows a value label.
   */
  activeIndex?: number
  /** Summary line rendered below the chart */
  summary?: {
    label: string
    baselineValue: number | string
    currentValue: number | string
  }
  metricItems?: BarChartMetricItem[]
  valueFormatter?: (val: number) => string
  className?: string
}

const variantClass: Record<NonNullable<BarChartMetricItem["variant"]>, string> = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  default: "text-foreground",
}

export function BarChartComex({
  data,
  config,
  seriesKeys,
  xAxisKey,
  title,
  description,
  activeIndex,
  summary,
  metricItems,
  valueFormatter = (v) => v.toLocaleString("pt-BR"),
  className,
}: BarChartComexProps) {
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
          <BarChart data={data} barCategoryGap="30%" barGap={2}>
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
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    typeof value === "number" ? valueFormatter(value) : String(value)
                  }
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />

            {seriesKeys.map((key, si) => {
              const isLast = key === lastKey
              return (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={`var(--color-${key})`}
                  radius={[3, 3, 0, 0]}
                >
                  {isLast && activeIndex !== undefined && (
                    <LabelList
                      dataKey={key}
                      position="top"
                      className="fill-foreground text-[10px] font-semibold"
                      content={({ x, y, width, value, index }) => {
                        if (index !== activeIndex || value == null) return null
                        const cx = Number(x) + Number(width) / 2
                        return (
                          <g>
                            <line
                              x1={cx}
                              y1={Number(y)}
                              x2={cx}
                              y2={Number(y) - 12}
                              stroke="var(--accent)"
                              strokeWidth={1.5}
                              strokeDasharray="3 2"
                            />
                            <rect
                              x={cx - 16}
                              y={Number(y) - 26}
                              width={32}
                              height={16}
                              rx={3}
                              fill="var(--accent)"
                            />
                            <text
                              x={cx}
                              y={Number(y) - 14}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize={10}
                              fontWeight={700}
                              fill="var(--foreground)"
                            >
                              {typeof value === "number" ? valueFormatter(value) : String(value)}
                            </text>
                          </g>
                        )
                      }}
                    />
                  )}

                  {isLast &&
                    data.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={
                          activeIndex !== undefined && i === activeIndex
                            ? "var(--color-accent)"
                            : `var(--color-${key})`
                        }
                        fillOpacity={
                          activeIndex !== undefined && i !== activeIndex ? 0.55 : 1
                        }
                      />
                    ))}
                </Bar>
              )
            })}
          </BarChart>
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
