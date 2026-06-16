"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { ChatMessage } from "./ChatMessage"
import { TypingIndicator } from "./TypingIndicator"
import { createConversation, streamMessage } from "@/services/chatService"

interface Message {
  id: string
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
  const [isGreeting, setIsGreeting] = useState(false)
  const [isAwaitingReply, setIsAwaitingReply] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const streamActiveRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    if (analiseId !== undefined) setIsGreeting(true)
    createConversation(analiseId, new Date().getHours())
      .then((data) => {
        if (cancelled) return
        setConversationId(data.id)
        if (data.greeting) {
          setMessages([
            { id: crypto.randomUUID(), role: "ai", content: data.greeting },
          ])
        }
      })
      .catch(() => {
        if (!cancelled) setError("Nao foi possivel iniciar a conversa.")
      })
      .finally(() => {
        if (!cancelled) setIsGreeting(false)
      })
    return () => { cancelled = true }
  }, [analiseId])

  useEffect(() => {
    return () => { streamActiveRef.current = false }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isAwaitingReply])

  async function handleSend() {
    if (!input.trim() || !conversationId || isStreaming) return

    const userMessage = input.trim()
    setInput("")
    setError(null)
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "human", content: userMessage }])
    setIsStreaming(true)
    setIsAwaitingReply(true)
    streamActiveRef.current = true
    let replyStarted = false

    try {
      await streamMessage(
        conversationId,
        userMessage,
        (chunk) => {
          if (!streamActiveRef.current) return
          if (!replyStarted) {
            replyStarted = true
            setIsAwaitingReply(false)
            setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "ai", content: chunk }])
            return
          }
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: updated[updated.length - 1].content + chunk,
            }
            return updated
          })
        },
        () => {
          streamActiveRef.current = false
          setIsAwaitingReply(false)
          setIsStreaming(false)
        },
      )
    } catch {
      streamActiveRef.current = false
      setError("Erro ao processar a mensagem. Tente novamente.")
      setIsAwaitingReply(false)
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
          {messages.length === 0 && !isGreeting && (
            <p className="text-center text-sm text-[var(--muted-foreground)] py-12">
              Faca uma pergunta sobre suas analises de derivativos.
            </p>
          )}
          {messages.map((msg, idx) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              isStreaming={isStreaming && idx === messages.length - 1 && msg.role === "ai"}
            />
          ))}
          {(isGreeting || isAwaitingReply) && <TypingIndicator />}
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
            aria-label="Digite sua mensagem"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || !conversationId || isStreaming}
            size="icon"
            aria-label="Enviar mensagem"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
