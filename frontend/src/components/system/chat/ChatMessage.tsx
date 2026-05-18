"use client"

import { cn } from "@/lib/utils"

interface ChatMessageProps {
  role: "human" | "ai"
  content: string
  isStreaming?: boolean
}

export function ChatMessage({ role, content, isStreaming = false }: ChatMessageProps) {
  const isHuman = role === "human"

  return (
    <div className={cn("flex gap-3 px-4 py-3", isHuman ? "justify-end" : "justify-start")}>
      {!isHuman && (
        <div aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold">
          IA
        </div>
      )}
      <div
        className={cn(
          "max-w-[75%] rounded-[var(--radius-lg)] px-4 py-2.5 text-sm leading-relaxed",
          isHuman
            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
            : "bg-[var(--secondary)] text-[var(--secondary-foreground)]"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>
        {isStreaming && (
          <span className="inline-block ml-1 h-4 w-0.5 bg-current animate-pulse" />
        )}
      </div>
      {isHuman && (
        <div aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] text-xs font-semibold">
          EU
        </div>
      )}
    </div>
  )
}
