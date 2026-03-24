"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, router])

  async function handleLogout() {
    await logout()
    router.push('/')
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-foreground/60">Carregando...</p>
      </main>
    )
  }

  if (!isAuthenticated) return null

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="space-y-1 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          AgroComex
        </p>
        <h1 className="text-2xl font-bold text-foreground">
          Bem-vindo, {user!.primeiro_nome || 'usuario'}
        </h1>
        <p className="text-sm text-foreground/60">
          Grupo: {user!.group || '—'}
        </p>
      </div>

      <Button
        variant="outline"
        onClick={handleLogout}
      >
        Sair
      </Button>
    </main>
  )
}
