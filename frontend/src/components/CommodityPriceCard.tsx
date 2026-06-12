"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ExportIndexMode = {
  mode: "export-index"
  nome: string
  codigo: string
  value: number | null
  unit?: string
  quarter: string | null
  variation: number | null
  className?: string
}

type CurrentPriceMode = {
  mode: "current-price"
  nome: string
  codigo: string
  preco: number | null
  moeda: string
  unidade: string
  data_preco: string | null
  className?: string
}

export type CommodityPriceCardProps = ExportIndexMode | CurrentPriceMode

function formatDataPreco(isoDate: string | null): string | null {
  if (!isoDate) return null
  const [y, m, d] = isoDate.split("-")
  return `${d}/${m}/${y}`
}

export function CommodityPriceCard(props: CommodityPriceCardProps) {
  if (props.mode === "current-price") {
    const { nome, codigo, preco, moeda, unidade, data_preco, className } = props
    return (
      <div
        className={cn(
          "flex flex-col justify-between rounded-[var(--radius-xl)] p-4",
          "bg-muted",
          className
        )}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5 text-muted-foreground truncate">
            {codigo}
          </p>
          <p className="text-sm font-bold leading-tight text-foreground truncate">
            {nome}
          </p>
        </div>

        <div>
          {preco != null ? (
            <p className="text-3xl font-bold tabular-nums leading-none mb-1 text-foreground">
              {preco.toFixed(2)}
              <span className="text-xs font-normal ml-1 text-muted-foreground">{unidade}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados</p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">{moeda}</span>
            {data_preco && (
              <span className="text-[11px] text-muted-foreground">
                {formatDataPreco(data_preco)}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // mode: "export-index"
  const { nome, codigo, value, unit = "pts", quarter, variation, className } = props
  const isPositive = variation != null && variation >= 0

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-[var(--radius-xl)] p-4",
        "bg-background border border-foreground/20",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5 text-muted-foreground truncate">
              {codigo}
            </p>
            <p className="text-sm font-bold leading-tight text-foreground truncate">
              {nome}
            </p>
          </div>
        </div>

        {variation != null && (
          <Badge
            className="shrink-0 text-[10px] font-semibold border-0 px-1.5"
            style={
              isPositive
                ? { background: "var(--success)", color: "var(--success-foreground)" }
                : { background: "var(--destructive)", color: "var(--destructive-foreground)" }
            }
          >
            {isPositive ? "+" : ""}
            {variation.toFixed(1)}%
          </Badge>
        )}
      </div>

      <div>
        {value != null ? (
          <p className="text-3xl font-bold tabular-nums leading-none mb-1 text-foreground">
            {value.toFixed(1)}
            <span className="text-xs font-normal ml-1 text-muted-foreground">{unit}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Sem dados</p>
        )}
        {quarter && (
          <p className="text-[11px] text-muted-foreground">{quarter}</p>
        )}
      </div>
    </div>
  )
}
