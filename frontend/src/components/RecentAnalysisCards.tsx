"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { RecentAnalysisCard, type RecentAnalysisData } from "@/components/RecentAnalysisCard"
import { apiFetch } from "@/services/authService"
import { API_BASE_URL } from "@/config/apiConfig"
import type { SolicitacaoAnaliseData } from "@/services/analiseService"

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

function toRecentAnalysisData(a: SolicitacaoAnaliseData): RecentAnalysisData {
  const color = colorForCode(a.commodity_codigo)
  const ticket = a.mes_contrato_ticket ?? (
    a.mes_contrato_codigo && a.mes_contrato_ano
      ? `${a.mes_contrato_codigo}/${a.mes_contrato_ano}`
      : "-"
  )
  return {
    id: String(a.id),
    commodityCode: a.commodity_codigo,
    commodityColor: color.bg,
    commodityTextColor: color.text,
    imageUrl: a.commodity_imagem_url ?? undefined,
    title: `${a.commodity_nome} — ${a.tipo_derivativo_rotulo}`,
    status: a.status === "aguardando" ? "pendente"
          : a.status === "processando" ? "em_analise"
          : a.status === "concluido" ? "aprovado"
          : "rejeitado",
    salePrice: a.preco_mercado_atual,
    salePriceCurrency: a.commodity_moeda,
    salePriceUnit: a.commodity_unidade,
    contractType: a.tipo_derivativo_rotulo,
    expiryYear: a.mes_contrato_ano ?? 0,
    totalContractValue: ticket,
    country: a.posicao ?? "-",
    timeAgo: new Date(a.criado_em).toLocaleDateString("pt-BR"),
  }
}

interface RecentAnalysisCardsProps {
  className?: string
}

export function RecentAnalysisCards({ className }: RecentAnalysisCardsProps) {
  const [analises, setAnalises] = useState<RecentAnalysisData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch(`${API_BASE_URL}/api/v1/solicitacao_analise/`)
      .then((res) => {
        if (!res.ok) throw new Error("fetch failed")
        return res.json() as Promise<{ results: SolicitacaoAnaliseData[] }>
      })
      .then((data) => setAnalises(data.results.map(toRecentAnalysisData)))
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
