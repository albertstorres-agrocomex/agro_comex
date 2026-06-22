"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import {
  getProativoConversa,
  marcarProativoLidas,
  getProativoNaoLidas,
  getProativoAbertura,
  streamMessage,
  type ProativoMessage,
  type AnaliseCard,
} from "@/services/chatService"
import { TopMenu } from "@/components/system/layout/TopMenu"
import { ChatMessage } from "@/components/system/chat/ChatMessage"
import { TypingIndicator } from "@/components/system/chat/TypingIndicator"
import { AnaliseCardPicker } from "@/components/system/chat/AnaliseCardPicker"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

type TextMessage = {
  id: string
  kind: "text"
  role: "human" | "ai"
  content: string
  isProativa: boolean
}
type CardsMessage = {
  id: string
  kind: "cards"
  role: "ai"
  cards: AnaliseCard[]
  isProativa: boolean
}
type UiMessage = TextMessage | CardsMessage

export default function MessagesPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, logout } = useAuth()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [analiseId, setAnaliseId] = useState<number | null>(null)
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [conferindo, setConferindo] = useState(false)
  const [permissaoAnalise, setPermissaoAnalise] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  /* Guard de autenticacao */
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/")
  }, [isLoading, isAuthenticated, router])

  /* Abertura proativa (1x por sessao) + carregamento da conversa */
  useEffect(() => {
    if (!isAuthenticated) return
    ;(async () => {
      if (!sessionStorage.getItem("mauro_abertura_feita")) {
        sessionStorage.setItem("mauro_abertura_feita", "1")
        try {
          await getProativoAbertura(new Date().getHours())
        } catch {
          /* abertura e best-effort */
        }
      }
      const data = await getProativoConversa()
      setConversationId(data.conversation_id)
      setMessages(
        data.messages.map((m: ProativoMessage) => ({
          id: m.id,
          kind: "text" as const,
          role: m.role,
          content: m.content,
          isProativa: m.is_proativa,
        })),
      )
      await marcarProativoLidas()
    })()
  }, [isAuthenticated])

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  /* Polling de permissao mid-conversa (~45s) */
  useEffect(() => {
    if (!analiseId) return
    const id = setInterval(async () => {
      try {
        const { solicitacoes } = await getProativoNaoLidas()
        if (solicitacoes.includes(analiseId)) setPermissaoAnalise(analiseId)
      } catch {
        /* silencioso */
      }
    }, 45_000)
    return () => clearInterval(id)
  }, [analiseId])

  const enviar = useCallback(
    async (texto: string, conferir = false, analiseIdOverride?: number) => {
      if (!conversationId || !texto.trim() || isStreaming) return
      const idAnalise = analiseIdOverride ?? analiseId ?? undefined
      setMessages((prev) => [
        ...prev,
        { id: `h-${Date.now()}`, kind: "text", role: "human", content: texto, isProativa: false },
        { id: `a-${Date.now()}`, kind: "text", role: "ai", content: "", isProativa: false },
      ])
      setIsStreaming(true)
      if (conferir) setConferindo(true)
      await streamMessage(
        conversationId,
        texto,
        (chunk) =>
          setMessages((prev) => {
            const copia = [...prev]
            const ultima = copia[copia.length - 1]
            if (ultima.kind === "text") {
              copia[copia.length - 1] = { ...ultima, content: ultima.content + chunk }
            }
            return copia
          }),
        () => {
          setIsStreaming(false)
          setConferindo(false)
        },
        {
          analiseId: idAnalise,
          onCards: (c) =>
            setMessages((prev) => {
              const copia = [...prev]
              const cardsMsg: CardsMessage = {
                id: `c-${Date.now()}`,
                kind: "cards",
                role: "ai",
                cards: c.filter((card) => card.id !== idAnalise),
                isProativa: false,
              }
              copia.splice(copia.length - 1, 0, cardsMsg)
              return copia
            }),
        },
      )
    },
    [conversationId, isStreaming, analiseId],
  )

  const selecionarAnalise = useCallback(
    (id: number, cards: AnaliseCard[]) => {
      setAnaliseId(id)
      const card = cards.find((c) => c.id === id)
      const nome = card
        ? `${card.commodity_nome} (${card.tipo_derivativo_nome})`
        : "essa analise"
      enviar(`Quero discutir essa analise de ${nome}. Qual a sua visao sobre ela?`, false, id)
    },
    [enviar],
  )

  const confirmarPermissao = async () => {
    setPermissaoAnalise(null)
    await marcarProativoLidas()
    await enviar("Chegou dado novo. Pode conferir se muda a analise atual?", true)
  }

  const negarPermissao = async () => {
    setPermissaoAnalise(null)
    await marcarProativoLidas()
  }

  const ultima = messages[messages.length - 1]
  const mostrarTyping =
    isStreaming && ultima?.kind === "text" && ultima.role === "ai" && ultima.content === ""

  return (
    <div className="flex h-full flex-col">
      <TopMenu onLogout={logout} />
      <div className="flex-1 space-y-3 overflow-y-auto p-4 pt-24">
        {messages.map((m, i) => {
          if (m.kind === "cards") {
            return (
              <AnaliseCardPicker
                key={m.id}
                analises={m.cards}
                onSelecionar={(id) => selecionarAnalise(id, m.cards)}
              />
            )
          }
          if (m.role === "ai" && m.content === "") return null
          const isLast = i === messages.length - 1
          return (
            <div
              key={m.id}
              className={
                m.isProativa
                  ? "rounded-[var(--radius-lg)] border-l-2 border-accent/40 bg-accent/5 pl-1"
                  : ""
              }
            >
              <ChatMessage
                role={m.role}
                content={m.content}
                isStreaming={isLast && m.role === "ai" && isStreaming}
              />
            </div>
          )
        })}
        {mostrarTyping && (
          <TypingIndicator label={conferindo ? "conferindo atualizacao..." : undefined} />
        )}
        {permissaoAnalise && (
          <div className="rounded-[var(--radius-lg)] border-l-2 border-accent/40 bg-accent/5 p-3 text-sm">
            <p className="text-foreground">
              Chegou dado novo sobre essa analise. Quer que eu confira agora?
            </p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={confirmarPermissao}>
                Sim
              </Button>
              <Button size="sm" variant="outline" onClick={negarPermissao}>
                Agora nao
              </Button>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t border-border p-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              enviar(input)
              setInput("")
            }
          }}
          placeholder="Fale com o Mauro sobre suas analises"
        />
        <Button
          onClick={() => {
            enviar(input)
            setInput("")
          }}
          disabled={isStreaming}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
