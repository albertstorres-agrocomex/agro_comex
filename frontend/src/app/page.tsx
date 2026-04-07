"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { LoginCard } from "@/components/system/auth/LoginCard"
import { useAuth } from "@/contexts/AuthContext"
import bgImage from "../../screen_shots/imagem_tela_login.jpg"

const DRIVE_URL = "https://drive.google.com/drive/folders/1sfuOYIuZdYWmvefMX6Qs3aULYiqTZKS_"
const GITHUB_URL = "https://github.com/albertstorres-agrocomex/agro_comex"

function GoogleDriveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 87.3 78" aria-hidden="true">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="M43.65 25L29.9 1.2C28.55.4 27 0 25.45 0c-1.55 0-3.1.4-4.5 1.2L7.2 25H43.65z" fill="#00ac47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5c.8-1.4 1.2-2.95 1.2-4.5H59.8L73.55 76.8z" fill="#ea4335"/>
      <path d="M43.65 25L57.4 1.2C56 .4 54.45 0 52.9 0H34.4c-1.55 0-3.1.4-4.5 1.2L43.65 25z" fill="#00832d"/>
      <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.1-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="M73.4 26.5L59.65 2.7c-.8-1.4-1.9-2.5-3.3-3.3L43 25l16.8 28H86.1c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  )
}

function TopNav() {
  const [expanded, setExpanded] = useState(false)

  return (
    <nav className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4">
      <span className="text-sm font-semibold tracking-widest text-white/80 uppercase">
        AgroComex
      </span>

      <div className="flex items-center gap-2">
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:border-white/40"
          >
            <span className="text-base leading-none">+</span>
            <span>Ver Projeto</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
            <a
              href={DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:border-white/40"
              title="Abrir no Google Drive"
            >
              <GoogleDriveIcon />
              <span>Drive</span>
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:border-white/40"
              title="Abrir no GitHub"
            >
              <GitHubIcon />
              <span>GitHub</span>
            </a>
            <button
              onClick={() => setExpanded(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/60 backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:text-white"
              aria-label="Fechar"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

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

      <TopNav />

      <div className="relative z-20 flex min-h-screen items-center justify-center px-4">
        <LoginCard
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
        />
      </div>

      <footer className="absolute bottom-0 left-0 right-0 z-20 py-5 text-center">
        <p className="text-xs text-primary-foreground/60">
          AgroComex &copy; 2026 &mdash; Desenvolvido pela Equipe 3 da disciplina Projetos 5 GTI da CESAR School. Todos os direitos reservados.
        </p>
      </footer>
    </main>
  )
}
