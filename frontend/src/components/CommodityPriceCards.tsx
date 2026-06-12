"use client"

import { cn } from "@/lib/utils"
import type { ExportIndexData, UserCommodity } from "@/services/commodityService"
import { CommodityPriceCard } from "@/components/CommodityPriceCard"

function getLastDataPoint(
  chartData: Array<Record<string, string | number | null>>,
  dataKey: string
): { value: number | null; quarter: string | null } {
  for (let i = chartData.length - 1; i >= 0; i--) {
    const v = chartData[i][dataKey]
    if (v != null && typeof v === "number") {
      return {
        value: v,
        quarter: (chartData[i]["quarter"] as string) ?? null,
      }
    }
  }
  return { value: null, quarter: null }
}

function getIndexVariation(
  chartData: Array<Record<string, string | number | null>>,
  dataKey: string
): number | null {
  const values: number[] = []
  for (const row of chartData) {
    const v = row[dataKey]
    if (v != null && typeof v === "number") values.push(v)
  }
  if (values.length < 2) return null
  const last = values[values.length - 1]
  const prev = values[values.length - 2]
  return ((last - prev) / prev) * 100
}

interface CommodityPriceCardsProps {
  data?: ExportIndexData | null
  commodities?: UserCommodity[]
  isLoading?: boolean
  className?: string
}

function AreaHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between mt-2 px-1 shrink-0">
      <p className="text-base font-bold text-foreground ml-1">
        {title}
      </p>
      <button
        type="button"
        className="text-xs text-muted-foreground underline cursor-pointer transition-colors hover:text-foreground mr-1"
      >
        Veja tudo
      </button>
    </div>
  )
}

export function CommodityPriceCards({ data, commodities, isLoading, className }: CommodityPriceCardsProps) {
  if (isLoading) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <AreaHeader title="Cotacoes" />
        <div className="flex gap-2.5 flex-1 p-2.5 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-[var(--radius-xl)] animate-pulse bg-muted"
            />
          ))}
        </div>
      </div>
    )
  }

  if (commodities && commodities.length > 0) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <AreaHeader title="Cotacoes" />
        <div className="flex gap-2.5 flex-1 px-2.5 pb-2.5 pt-2 overflow-x-auto">
          {commodities.slice(0, 3).map((c) => (
            <CommodityPriceCard
              key={c.id}
              mode="current-price"
              nome={c.nome}
              codigo={c.codigo}
              preco={c.preco_atual}
              moeda={c.moeda}
              unidade={c.unidade}
              data_preco={c.data_preco_atual}
              className="flex-1 min-w-[119px]"
            />
          ))}
        </div>
      </div>
    )
  }

  if (!data || !data.series.length) return null

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <AreaHeader title="Indice de exportacao" />
      <div className="flex gap-2.5 flex-1 px-2.5 pb-2.5 pt-2 overflow-x-auto">
        {data.series.slice(0, 3).map((series) => {
          const { value: lastValue, quarter: lastQuarter } = getLastDataPoint(
            data.chart_data,
            series.data_key
          )
          const variation = getIndexVariation(data.chart_data, series.data_key)

          return (
            <CommodityPriceCard
              key={series.commodity_id}
              mode="export-index"
              nome={series.nome}
              codigo={series.codigo}
              value={lastValue}
              quarter={lastQuarter}
              variation={variation}
              className="flex-1 min-w-[119px]"
            />
          )
        })}
      </div>
    </div>
  )
}
