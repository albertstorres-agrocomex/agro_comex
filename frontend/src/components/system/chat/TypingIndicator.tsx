"use client"

export function TypingIndicator() {
  return (
    <div className="flex gap-3 px-4 py-3 justify-start">
      <div
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-xs font-semibold"
      >
        M
      </div>
      <div
        role="status"
        aria-label="Mauro esta digitando"
        className="flex items-center gap-2 rounded-[var(--radius-lg)] bg-[var(--secondary)] px-4 py-2.5 text-sm text-[var(--secondary-foreground)]"
      >
        <span className="text-[var(--muted-foreground)]">Mauro esta digitando</span>
        <span aria-hidden="true" className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
        </span>
      </div>
    </div>
  )
}
