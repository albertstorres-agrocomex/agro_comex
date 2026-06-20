"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  getProativoConversa,
  marcarProativoLidas,
  getProativoAnalises,
  getProativoNaoLidas,
  streamMessage,
  type ProativoMessage,
  type AnaliseCard,
} from "@/services/chatService"
import { ChatMessage } from "@/components/system/chat/ChatMessage"
import { TypingIndicator } from "@/components/system/chat/TypingIndicator"
import { AnaliseCardPicker } from "@/components/system/chat/AnaliseCardPicker"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

type UiMessage = {
  id: string
  role: "human" | "ai"
  content: string
  isProativa: boolean
}

export default function MessagesPage() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [cards, setCards] = useState<AnaliseCard[]>([])
  const [analiseId, setAnaliseId] = useState<number | null>(null)
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [conferindo, setConferindo] = useState(false)
  const [permissaoAnalise, setPermissaoAnalise] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  /* Carregar conversa existente + cards iniciais */
  useEffect(() => {
    ;(async () => {
      const data = await getProativoConversa()
      setConversationId(data.conversation_id)
      setMessages(
        data.messages.map((m: ProativoMessage) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          isProativa: m.is_proativa,
        })),
      )
      await marcarProativoLidas()
      const { analises } = await getProativoAnalises()
      setCards(analises)
    })()
  }, [])

  /* Auto-scroll ao receber mensagens */
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
    async (texto: string, conferir = false) => {
      if (!conversationId || !texto.trim() || isStreaming) return
      setMessages((prev) => [
        ...prev,
        { id: `h-${Date.now()}`, role: "human", content: texto, isProativa: false },
        { id: `a-${Date.now()}`, role: "ai", content: "", isProativa: false },
      ])
      setIsStreaming(true)
      if (conferir) setConferindo(true)
      await streamMessage(
        conversationId,
        texto,
        (chunk) =>
          setMessages((prev) => {
            const copia = [...prev]
            copia[copia.length - 1] = {
              ...copia[copia.length - 1],
              content: copia[copia.length - 1].content + chunk,
            }
            return copia
          }),
        () => {
          setIsStreaming(false)
          setConferindo(false)
        },
        { analiseId: analiseId ?? undefined, onCards: (c) => setCards(c) },
      )
    },
    [conversationId, isStreaming, analiseId],
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.isProativa
                ? "rounded-[var(--radius-lg)] border-l-2 border-accent/40 bg-accent/5 pl-1"
                : ""
            }
          >
            <ChatMessage role={m.role} content={m.content} />
          </div>
        ))}
        {!analiseId && (
          <AnaliseCardPicker
            analises={cards}
            onSelecionar={(id) => setAnaliseId(id)}
          />
        )}
        {isStreaming && (
          <TypingIndicator
            label={conferindo ? "conferindo atualizacao..." : undefined}
          />
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
