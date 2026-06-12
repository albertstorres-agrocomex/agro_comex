"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { TopMenu } from "@/components/system/layout/TopMenu"
import { ChatInterface } from "@/components/system/chat/ChatInterface"

function ChatPageInner() {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const raw = searchParams.get("analise_id")
  const analiseId = raw && !isNaN(Number(raw)) ? Number(raw) : undefined

  async function handleLogout() {
    await logout()
    router.push("/")
  }

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) return null

  return (
    <div className="flex flex-col h-screen bg-[var(--background)]">
      <TopMenu onLogout={handleLogout} />
      <div className="flex flex-1 min-h-0">
        <main className="flex flex-col flex-1 min-h-0 max-w-3xl mx-auto w-full px-4 py-6">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-[var(--foreground)]">
              Assistente AgroComex
            </h1>
            {analiseId && (
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                Contexto: analise #{analiseId}
              </p>
            )}
          </div>
          <div className="flex-1 min-h-0 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] overflow-hidden">
            <ChatInterface analiseId={analiseId} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  )
}
