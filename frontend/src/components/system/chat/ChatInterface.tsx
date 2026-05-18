"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { ChatMessage } from "./ChatMessage"
import { createConversation, streamMessage } from "@/services/chatService"

interface Message {
  role: "human" | "ai"
  content: string
}

interface ChatInterfaceProps {
  analiseId?: number
}

export function ChatInterface({ analiseId }: ChatInterfaceProps) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    createConversation(analiseId)
      .then((conv) => setConversationId(conv.id))
      .catch(() => setError("Nao foi possivel iniciar a conversa."))
  }, [analiseId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || !conversationId || isStreaming) return

    const userMessage = input.trim()
    setInput("")
    setError(null)
    setMessages((prev) => [...prev, { role: "human", content: userMessage }])
    setIsStreaming(true)
    setMessages((prev) => [...prev, { role: "ai", content: "" }])

    try {
      await streamMessage(
        conversationId,
        userMessage,
        (chunk) => {
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: "ai",
              content: updated[updated.length - 1].content + chunk,
            }
            return updated
          })
        },
        () => setIsStreaming(false),
      )
    } catch {
      setError("Erro ao processar a mensagem. Tente novamente.")
      setMessages((prev) => prev.slice(0, -1))
      setIsStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="py-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-[var(--muted-foreground)] py-12">
              Faca uma pergunta sobre suas analises de derivativos.
            </p>
          )}
          {messages.map((msg, idx) => (
            <ChatMessage
              key={idx}
              role={msg.role}
              content={msg.content}
              isStreaming={isStreaming && idx === messages.length - 1 && msg.role === "ai"}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && (
        <p className="text-xs text-[var(--destructive)] px-4 pb-1">{error}</p>
      )}

      <div className="border-t border-[var(--border)] p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre suas analises..."
            disabled={!conversationId || isStreaming}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || !conversationId || isStreaming}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
