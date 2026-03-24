"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface LoginCardProps {
  className?: string
  onSubmit?: (data: { email: string; password: string }) => void
  onForgotPassword?: () => void
  isLoading?: boolean
  error?: string
}

export function LoginCard({
  className,
  onSubmit,
  onForgotPassword,
  isLoading = false,
  error,
}: LoginCardProps) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit?.({ email, password })
  }

  return (
    <div
      className={cn(
        // Glassmorphism: primary scale 950 (#081F0F) at 85% opacity
        "relative overflow-hidden",
        "rounded-2xl border border-primary-foreground/10",
        "bg-[#081F0F]/80 backdrop-blur-xl",
        "shadow-2xl shadow-[#081F0F]/60",
        // Layout
        "w-full max-w-sm px-8 py-10",
        className
      )}
    >
      {/* Top inner highlight line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/20 to-transparent"
      />

      {/* Header */}
      <header className="mb-8 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          AgroComex
        </p>
        <h1 className="text-2xl font-bold leading-tight text-primary-foreground">
          Bem-vindo de volta
        </h1>
        <p className="text-sm text-primary-foreground/60">
          Acesse sua conta para continuar
        </p>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Email field */}
        <div className="space-y-1.5">
          <Label
            htmlFor="login-email"
            className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70"
          >
            Email
          </Label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className={cn(
              "w-full rounded-lg",
              "border border-primary-foreground/15 bg-primary-foreground/8",
              "px-4 py-2.5 text-sm text-primary-foreground",
              "placeholder:text-primary-foreground/35",
              "outline-none transition-all",
              "hover:border-primary-foreground/25",
              "focus:border-accent/60 focus:bg-primary-foreground/12 focus:ring-2 focus:ring-accent/25"
            )}
          />
        </div>

        {/* Password field */}
        <div className="space-y-1.5">
          <Label
            htmlFor="login-password"
            className="text-xs font-semibold uppercase tracking-widest text-primary-foreground/70"
          >
            Senha
          </Label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={cn(
              "w-full rounded-lg",
              "border border-primary-foreground/15 bg-primary-foreground/8",
              "px-4 py-2.5 text-sm text-primary-foreground",
              "placeholder:text-primary-foreground/35",
              "outline-none transition-all",
              "hover:border-primary-foreground/25",
              "focus:border-accent/60 focus:bg-primary-foreground/12 focus:ring-2 focus:ring-accent/25"
            )}
          />
        </div>

        {/* Forgot password */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className={cn(
              "rounded text-xs text-primary-foreground/50",
              "underline-offset-4 transition-colors",
              "hover:text-accent hover:underline",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            )}
          >
            Esqueceu a senha?
          </button>
        </div>

        {/* Submit button — accent (lime) color */}
        <Button
          type="submit"
          disabled={isLoading}
          className={cn(
            "w-full font-semibold tracking-wide",
            "bg-accent text-accent-foreground hover:bg-accent/90",
            "active:scale-[0.98] transition-all"
          )}
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </Button>

        {error && (
          <p
            role="alert"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </form>

      {/* Bottom accent line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent"
      />
    </div>
  )
}
