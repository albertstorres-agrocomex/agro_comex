"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { RecentAnalysisCard, type RecentAnalysisData } from "@/components/RecentAnalysisCard"
import { apiFetch } from "@/services/authService"
import { API_BASE_URL } from "@/config/apiConfig"

// Paleta deterministica baseada no codigo da commodity
const CHART_PALETTE = [
  { bg: "var(--chart-1)", text: "oklch(0.92 0.008 80)" },
  { bg: "var(--chart-2)", text: "oklch(0.175 0.018 70)" },
  { bg: "var(--chart-3)", text: "oklch(0.175 0.018 70)" },
  { bg: "var(--chart-4)", text: "oklch(0.175 0.018 70)" },
  { bg: "var(--chart-5)", text: "oklch(0.92 0.008 80)" },
]

function colorForCode(code: string) {
  const hash = [...code].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return CHART_PALETTE[hash % CHART_PALETTE.length]
}

interface ApiAnalise {
  id: number
  commodity_code: string
  title: string
  status: "aprovado" | "pendente" | "rejeitado" | "em_analise"
  sale_price: string
  sale_price_currency: string
  sale_price_unit: string
  contract_type: string
  expiry_year: number
  total_contract_value: string
  country: string
  time_ago: string
  commodity_image_url?: string | null
}

function toRecentAnalysisData(a: ApiAnalise): RecentAnalysisData {
  const color = colorForCode(a.commodity_code)
  return {
    id: String(a.id),
    commodityCode: a.commodity_code,
    commodityColor: color.bg,
    commodityTextColor: color.text,
    imageUrl: a.commodity_image_url ?? undefined,
    title: a.title,
    status: a.status,
    salePrice: parseFloat(a.sale_price),
    salePriceCurrency: a.sale_price_currency,
    salePriceUnit: a.sale_price_unit,
    contractType: a.contract_type,
    expiryYear: a.expiry_year,
    totalContractValue: a.total_contract_value,
    country: a.country,
    timeAgo: a.time_ago,
  }
}

interface RecentAnalysisCardsProps {
  className?: string
}

export function RecentAnalysisCards({ className }: RecentAnalysisCardsProps) {
  const [analises, setAnalises] = useState<RecentAnalysisData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch(`${API_BASE_URL}/api/v1/dados/analises/`)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed")
        return res.json() as Promise<ApiAnalise[]>
      })
      .then((data) => setAnalises(data.map(toRecentAnalysisData)))
      .catch(() => setAnalises([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mt-2 px-1 shrink-0">
        <p className="text-base font-bold text-foreground ml-1">
          Suas Analises Recentes
        </p>
        <Link
          href="/analises"
          className="text-xs text-muted-foreground underline cursor-pointer transition-colors hover:text-foreground mr-1"
        >
          Veja tudo
        </Link>
      </div>

      {/* Cards */}
      <div className="flex flex-col flex-1 mt-1 px-1 overflow-y-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground px-1 py-3">
            Carregando...
          </p>
        ) : analises.length === 0 ? (
          <p className="text-sm text-muted-foreground px-1 py-3">
            Nenhuma analise realizada.
          </p>
        ) : (
          analises.map((analysis) => (
            <RecentAnalysisCard key={analysis.id} analysis={analysis} />
          ))
        )}
      </div>
    </div>
  )
}
