"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { TopMenu } from "@/components/system/layout/TopMenu"
import { ExportIndexChart } from "@/components/ExportIndexChart"
import { API_BASE_URL } from "@/config/apiConfig"
import { apiFetch } from "@/services/authService"
import { fetchIndiceExportacao, type ExportIndexData, type UserCommodity } from "@/services/commodityService"
import { CommodityPriceCards } from "@/components/CommodityPriceCards"
import { RecentAnalysisCards } from "@/components/RecentAnalysisCards"

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const [userCommodities, setUserCommodities] = useState<UserCommodity[] | null>(null)
  const [exportIndex, setExportIndex] = useState<ExportIndexData | null>(null)
  const [exportIndexLoading, setExportIndexLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return
    apiFetch(`${API_BASE_URL}/api/v1/usuario/commodities/`)
      .then(r => r.json())
      .then(data => setUserCommodities(data.commodities ?? []))
      .catch(() => setUserCommodities([]))
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !userCommodities || userCommodities.length === 0) return
    setExportIndexLoading(true)
    fetchIndiceExportacao()
      .then(data => setExportIndex(data))
      .catch(() => setExportIndex(null))
      .finally(() => setExportIndexLoading(false))
  }, [isAuthenticated, userCommodities])

  useEffect(() => {
    if (!isLoading && isAuthenticated && userCommodities !== null) {
      if (userCommodities.length === 0) {
        router.push('/dashboard/commodities')
      }
    }
  }, [isLoading, isAuthenticated, userCommodities, router])

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  if (isLoading || (isAuthenticated && userCommodities === null)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-foreground/60">Carregando...</p>
      </main>
    )
  }

  if (!isAuthenticated) return null

  const userName = user!.primeiro_nome || "Usuario"

  return (
    <div className="h-screen overflow-hidden bg-background">
      <TopMenu onLogout={handleLogout} />

      {/*
        Layout principal do dashboard.
        Margens: 20px do topo do conteudo (abaixo do TopMenu), 20px esquerda/direita/baixo.
        TopMenu e fixed top-4 com py-3 — pt-20 (80px) e a clearance segura do projeto.

        Colunas : [60%] [1fr]
        Linhas  : [~61.7% da area disponivel] [1fr]

        Coluna direita ocupa as duas linhas (row-span-2) via flex column:
          - Historico de analises : flex-1
          - Area futura 2         : avail-h / 4
          - Area futura           : avail-h / 3 - 10px (gap)
      */}
      <main
        className="fixed left-5 right-5 bottom-5 grid gap-2.5"
        style={{
          top: "calc(80px + 20px)",
          gridTemplateColumns: "60% 1fr",
          gridTemplateRows: "calc((100vh - 120px) * 0.6167) 1fr",
        }}
      >
        {/* ------------------------------------------------------------------ */}
        {/* ZONA 1 — Grafico de linha (60% largura, ~61.7% altura)             */}
        {/* ------------------------------------------------------------------ */}
        <div className="col-start-1 row-start-1">
          <ExportIndexChart
            data={exportIndex}
            isLoading={exportIndexLoading}
            className="h-full"
          />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* ZONA 2 — Cards das commodities (60% largura, restante da altura)   */}
        {/* ------------------------------------------------------------------ */}
        <div
          className="col-start-1 row-start-2"
        >
          <CommodityPriceCards
            data={exportIndex}
            commodities={userCommodities ?? []}
            isLoading={exportIndexLoading}
            className="h-full"
          />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* COLUNA DIREITA — ocupa as duas linhas, dividida em 3 zonas         */}
        {/* ------------------------------------------------------------------ */}
        <div className="col-start-2 row-span-2 flex flex-col gap-2.5">
          {/* ZONA 3 — Historico de analises (flex-1) */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <RecentAnalysisCards className="h-full" />
          </div>

          {/* ZONA 5 — Area futura (1/3 da altura disponivel - gap) */}
          <div
            className="rounded-xl border-2 border-dashed border-border"
            style={{ height: "calc((100vh - 120px) / 3 - 10px)" }}
          />
        </div>
      </main>
    </div>
  )
}
