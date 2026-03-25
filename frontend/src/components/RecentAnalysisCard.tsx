"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CommodityImageCard } from "@/components/system/commodity/CommodityImageCard"

export interface RecentAnalysisData {
  id: string
  commodityCode: string
  commodityColor: string
  commodityTextColor: string
  imageUrl?: string
  title: string
  status: "aprovado" | "pendente" | "rejeitado" | "em_analise"
  salePrice: number
  salePriceCurrency: string
  salePriceUnit: string
  contractType: string
  expiryYear: number
  totalContractValue: string
  country: string
  timeAgo: string
}

const STATUS_CONFIG = {
  aprovado: {
    label: "Aprovado",
    style: { background: "var(--success)", color: "var(--success-foreground)" },
  },
  pendente: {
    label: "Pendente",
    style: { background: "var(--warning)", color: "var(--warning-foreground)" },
  },
  rejeitado: {
    label: "Rejeitado",
    style: { background: "var(--destructive)", color: "var(--destructive-foreground)" },
  },
  em_analise: {
    label: "Em Analise",
    style: { background: "var(--info)", color: "var(--info-foreground)" },
  },
} as const

export function RecentAnalysisCard({ analysis }: { analysis: RecentAnalysisData }) {
  const [isOpen, setIsOpen] = useState(false)
  const statusInfo = STATUS_CONFIG[analysis.status]

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-start gap-3 px-1 py-3">

        {/* Left column: image card only */}
        <div className="shrink-0">
          {analysis.imageUrl ? (
            <CommodityImageCard
              src={analysis.imageUrl}
              alt={analysis.commodityCode}
              size="sm"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-[var(--radius-lg)] overflow-hidden flex items-center justify-center bg-muted"
            >
              <span className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                {analysis.commodityCode.slice(0, 3)}
              </span>
            </div>
          )}
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight truncate">
                {analysis.title}
              </p>
              <Badge
                className="text-[10px] px-1.5 py-0 h-[18px] mt-1 border-0 font-semibold rounded-[var(--radius-sm)]"
                style={statusInfo.style}
              >
                {statusInfo.label}
              </Badge>
              <p className="text-sm font-semibold text-foreground mt-1.5 tabular-nums">
                {analysis.salePriceCurrency}{" "}
                {analysis.salePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                <span className="text-[11px] font-normal text-muted-foreground ml-1">
                  {analysis.salePriceUnit}
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Fechar detalhes" : "Ver detalhes"}
              className={cn(
                "shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-opacity",
                "bg-muted",
                "hover:opacity-80"
              )}
            >
              {isOpen
                ? <ChevronUp size={14} className="text-foreground/70" />
                : <ChevronDown size={14} className="text-foreground/70" />
              }
            </button>
          </div>

          {isOpen && (
            <div className="mt-1.5">
              <div className="flex gap-[2px] mb-1.5">
                <Badge
                  className="text-[9px] px-1.5 py-0 h-[18px] font-semibold border-0 rounded-[var(--radius-sm)]"
                  style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                >
                  {analysis.contractType}
                </Badge>
                <Badge
                  className="text-[9px] px-1.5 py-0 h-[18px] font-semibold border-0 rounded-[var(--radius-sm)]"
                  style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                >
                  {analysis.expiryYear}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">
                {analysis.totalContractValue}
              </p>
              <div className="flex items-center mt-2.5" style={{ gap: 10 }}>
                <MapPin size={11} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-foreground/80">{analysis.country}</span>
                <span className="text-xs text-muted-foreground">{analysis.timeAgo}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
