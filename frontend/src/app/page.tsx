"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LoginCard } from "@/components/system/auth/LoginCard"
import { useAuth } from "@/contexts/AuthContext"
import bgImage from "../../screen_shots/imagem_tela_login.jpg"

function getErrorMessage(status: number): string {
  if (status === 401) return "Email ou senha incorretos."
  if (status === 429) return "Muitas tentativas. Aguarde alguns instantes."
  return "Servico indisponivel. Tente novamente."
}

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  async function handleSubmit({ email, password }: { email: string; password: string }) {
    setIsLoading(true)
    setError(undefined)
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: unknown) {
      const status =
        err !== null &&
        typeof err === 'object' &&
        'status' in err &&
        typeof (err as Record<string, unknown>).status === 'number'
          ? (err as { status: number }).status
          : 500
      setError(getErrorMessage(status))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <Image
        src={bgImage}
        alt=""
        fill
        priority
        quality={85}
        sizes="100vw"
        className="object-cover object-center"
        aria-hidden="true"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-black/45"
      />

      <div className="relative z-20 flex min-h-screen items-center justify-center px-4">
        <LoginCard
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </main>
  )
}
