"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { TopMenu } from "@/components/system/layout/TopMenu"
import { API_BASE_URL } from "@/config/apiConfig"

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const [userCommodities, setUserCommodities] = useState<number[] | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated) return
    fetch(`${API_BASE_URL}/api/v1/usuario/commodities/`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setUserCommodities(data.commodity_ids ?? []))
      .catch(() => setUserCommodities([]))
  }, [isAuthenticated])

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
    <div className="min-h-screen bg-background">
      <TopMenu onLogout={handleLogout} />

      <main className="pt-20 flex flex-1 flex-col items-center justify-center gap-6 px-4">
      </main>
    </div>
  )
}
