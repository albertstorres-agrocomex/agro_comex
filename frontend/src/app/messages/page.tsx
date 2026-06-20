"use client"

import { useEffect, useRef, useState } from "react"
import {
  getProativoConversa,
  marcarProativoLidas,
  streamMessage,
  type ProativoMessage,
} from "@/services/chatService"
import { ChatMessage } from "@/components/system/chat/ChatMessage"
import { TypingIndicator } from "@/components/system/chat/TypingIndicator"
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
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

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
    })()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!conversationId || !input.trim() || isStreaming) return
    const texto = input.trim()
    setInput("")
    setMessages((prev) => [
      ...prev,
      { id: `h-${Date.now()}`, role: "human", content: texto, isProativa: false },
      { id: `a-${Date.now()}`, role: "ai", content: "", isProativa: false },
    ])
    setIsStreaming(true)
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
      () => setIsStreaming(false),
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-1 overflow-y-auto p-4">
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
        {isStreaming && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t border-border p-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Fale com o Mauro sobre suas analises"
        />
        <Button onClick={handleSend} disabled={isStreaming}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
