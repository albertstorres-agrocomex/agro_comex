"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface LoginCardNewProps {
  className?: string
  onSubmit?: (data: { email: string; password: string }) => void
  onForgotPassword?: () => void
  isLoading?: boolean
  error?: string
}

// --- Icon components ---

function EmailIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.64321 18.196C6.27493 18.196 5.95966 18.0649 5.69741 17.8026C5.43515 17.5403 5.30402 17.2251 5.30402 16.8568V8.82162C5.30402 8.45334 5.43515 8.13807 5.69741 7.87581C5.95966 7.61355 6.27493 7.48242 6.64321 7.48242H17.3568C17.7251 7.48242 18.0403 7.61355 18.3026 7.87581C18.5649 8.13807 18.696 8.45334 18.696 8.82162V16.8568C18.696 17.2251 18.5649 17.5403 18.3026 17.8026C18.0403 18.0649 17.7251 18.196 17.3568 18.196H6.64321ZM12 13.5088L17.3568 10.1608V8.82162L12 12.1696L6.64321 8.82162V10.1608L12 13.5088Z"
        fill="url(#lnew_emailGrad)"
      />
      <defs>
        <linearGradient id="lnew_emailGrad" x1="12" y1="7.48242" x2="12" y2="18.196" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2D6A3F" />
          <stop offset="1" stopColor="#C2EC45" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function PasswordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.84438 18.197C7.46344 18.197 7.13734 18.0614 6.86607 17.7901C6.5948 17.5189 6.45917 17.1928 6.45917 16.8118V9.88578C6.45917 9.50485 6.5948 9.17875 6.86607 8.90748C7.13734 8.63621 7.46344 8.50057 7.84438 8.50057H8.53698V7.11536C8.53698 6.15726 8.87462 5.34057 9.54991 4.66528C10.2252 3.98999 11.0419 3.65234 12 3.65234C12.9581 3.65234 13.7748 3.98999 14.4501 4.66528C15.1254 5.34057 15.463 6.15726 15.463 7.11536V8.50057H16.1556C16.5366 8.50057 16.8627 8.63621 17.1339 8.90748C17.4052 9.17875 17.5408 9.50485 17.5408 9.88578V16.8118C17.5408 17.1928 17.4052 17.5189 17.1339 17.7901C16.8627 18.0614 16.5366 18.197 16.1556 18.197H7.84438ZM12.9783 14.3271C13.2496 14.0558 13.3852 13.7297 13.3852 13.3488C13.3852 12.9679 13.2496 12.6418 12.9783 12.3705C12.707 12.0992 12.3809 11.9636 12 11.9636C11.6191 11.9636 11.293 12.0992 11.0217 12.3705C10.7504 12.6418 10.6148 12.9679 10.6148 13.3488C10.6148 13.7297 10.7504 14.0558 11.0217 14.3271C11.293 14.5984 11.6191 14.734 12 14.734C12.3809 14.734 12.707 14.5984 12.9783 14.3271ZM9.92219 8.50057H14.0778V7.11536C14.0778 6.53819 13.8758 6.0476 13.4718 5.64358C13.0678 5.23956 12.5772 5.03755 12 5.03755C11.4228 5.03755 10.9322 5.23956 10.5282 5.64358C10.1242 6.0476 9.92219 6.53819 9.92219 7.11536V8.50057Z"
        fill="url(#lnew_passGrad)"
      />
      <defs>
        <linearGradient id="lnew_passGrad" x1="12" y1="3.65234" x2="12" y2="18.197" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2D6A3F" />
          <stop offset="1" stopColor="#C2EC45" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

// Harvest volume bars animation — vertical columns that grow/shrink
// evoking commodity volume charts and grain harvest cycles.
// Each entry: [x, minH, maxH, durationSeconds, delaySeconds]
const BARS: [number, number, number, number, number][] = [
  [2,   20, 42, 3.2, 0.0],
  [22,  38, 62, 2.8, 0.4],
  [42,  28, 52, 4.0, 0.8],
  [62,  48, 76, 3.5, 0.2],
  [82,  18, 38, 2.6, 1.2],
  [102, 55, 82, 4.2, 0.6],
  [122, 32, 58, 3.0, 1.6],
  [142, 44, 70, 3.8, 0.3],
  [162, 25, 48, 2.9, 1.0],
  [182, 52, 80, 4.5, 0.7],
  [202, 22, 44, 3.1, 1.4],
  [222, 42, 66, 3.6, 0.5],
  [242, 35, 60, 2.7, 1.8],
  [262, 52, 78, 4.1, 0.9],
  [282, 18, 40, 3.3, 1.3],
  [302, 38, 62, 2.5, 0.1],
  [322, 28, 52, 3.9, 1.7],
  [342, 46, 72, 3.4, 0.6],
  [362, 20, 42, 2.8, 1.1],
]

const VH = 100
const BAR_W = 16
const KT = "0;0.5;1"
const KS = "0.42,0,0.58,1;0.42,0,0.58,1"

function HarvestBars() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 380 ${VH}`}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="hb-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a3e635" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#a3e635" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="hb-fg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a3e635" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#a3e635" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      {/* Background layer — offset, muted */}
      {BARS.map(([x, h1, h2, dur, begin], i) => {
        const bx = x + 10
        if (bx + BAR_W > 380) return null
        const bh1 = Math.round(h1 * 0.7)
        const bh2 = Math.round(h2 * 0.7)
        const bdur = dur + 0.6
        const bbegin = begin + 0.3
        return (
          <rect key={`bg-${i}`} x={bx} y={VH - bh1} width={BAR_W} height={bh1} rx="2" fill="url(#hb-bg)">
            <animate attributeName="height" values={`${bh1};${bh2};${bh1}`} dur={`${bdur}s`} begin={`${bbegin}s`} calcMode="spline" keyTimes={KT} keySplines={KS} repeatCount="indefinite" />
            <animate attributeName="y" values={`${VH - bh1};${VH - bh2};${VH - bh1}`} dur={`${bdur}s`} begin={`${bbegin}s`} calcMode="spline" keyTimes={KT} keySplines={KS} repeatCount="indefinite" />
          </rect>
        )
      })}

      {/* Foreground layer */}
      {BARS.map(([x, h1, h2, dur, begin], i) => (
        <rect key={`fg-${i}`} x={x} y={VH - h1} width={BAR_W} height={h1} rx="2" fill="url(#hb-fg)">
          <animate attributeName="height" values={`${h1};${h2};${h1}`} dur={`${dur}s`} begin={`${begin}s`} calcMode="spline" keyTimes={KT} keySplines={KS} repeatCount="indefinite" />
          <animate attributeName="y" values={`${VH - h1};${VH - h2};${VH - h1}`} dur={`${dur}s`} begin={`${begin}s`} calcMode="spline" keyTimes={KT} keySplines={KS} repeatCount="indefinite" />
        </rect>
      ))}
    </svg>
  )
}

// --- Floating label field ---

interface FloatingFieldProps {
  id: string
  type: string
  label: string
  icon: React.ReactNode
  value: string
  onChange: (v: string) => void
  autoComplete?: string
}

function FloatingField({ id, type, label, icon, value, onChange, autoComplete }: FloatingFieldProps) {
  const [focused, setFocused] = React.useState(false)
  const isFloating = focused || value.length > 0

  return (
    <div className="relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 pointer-events-none">
        {icon}
      </div>

      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "w-full pl-9 pr-3 pt-5 pb-2",
          "rounded-xl border text-sm text-primary-foreground",
          "outline-none transition-colors duration-300",
          focused
            ? "border-accent/70"
            : "border-white/10 hover:border-white/20"
        )}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.06)",
          WebkitBoxShadow: "0 0 0 1000px rgba(23, 44, 29, 1) inset",
          WebkitTextFillColor: "rgba(255,255,255,0.9)",
        }}
      />

      <label
        htmlFor={id}
        className={cn(
          "absolute left-9 pointer-events-none select-none",
          "text-sm transition-all duration-300 origin-left",
          isFloating
            ? "top-1.5 scale-[0.75] text-accent/90"
            : "top-[50%] -translate-y-[60%] scale-100 text-white/40"
        )}
      >
        {label}
      </label>
    </div>
  )
}

// --- Main component ---

export function LoginCard({
  className,
  onSubmit,
  onForgotPassword,
  isLoading = false,
  error,
}: LoginCardNewProps) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    onSubmit?.({ email, password })
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        // Dimensions matching login-8: 380px wide, 72px top, 58px bottom, 40px radius
        "w-[380px] pt-[72px] pb-[158px] px-[38px] rounded-[40px]",
        "border border-white/10",
        "bg-[#081F0F]/56 backdrop-blur-xl",
        "shadow-2xl shadow-[#081F0F]/60",
        className
      )}
    >
      {/* Top inner highlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      {/* Header */}
      <header className="mb-8 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          AgroComex
        </p>
        <h1 className="text-2xl font-bold leading-tight text-primary-foreground">
          Bem-vindo de volta
        </h1>
        <p className="text-sm text-white/60">
          Acesse sua conta para continuar
        </p>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <FloatingField
          id="lnew-email"
          type="email"
          label="Email"
          icon={<EmailIcon />}
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />

        <FloatingField
          id="lnew-password"
          type="password"
          label="Senha"
          icon={<PasswordIcon />}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        {/* Forgot password */}
        <div className="flex justify-end -mt-2">
          <button
            type="button"
            onClick={onForgotPassword}
            className={cn(
              "rounded text-xs text-white/50",
              "underline-offset-4 transition-colors",
              "hover:text-accent hover:underline",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            )}
          >
            Esqueceu a senha?
          </button>
        </div>

        {/* Submit — text slides left, arrow appears from right (login-8 style) */}
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "group relative w-full h-14 overflow-hidden",
            "rounded-xl border border-white/10",
            "bg-white/6 hover:bg-white/9",
            "text-base font-semibold tracking-wide text-primary-foreground",
            "cursor-pointer transition-all duration-300",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <span className="relative z-10 block transition-transform duration-300 group-hover:-translate-x-3">
            {isLoading ? "Entrando..." : "Entrar"}
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "absolute right-7 top-1/2 -translate-y-1/2 z-10 text-accent",
              "translate-x-4 opacity-0",
              "transition-all duration-300",
              "group-hover:translate-x-0 group-hover:opacity-100"
            )}
          >
            <ArrowRightIcon />
          </span>
        </button>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </form>

      {/* Harvest volume bars — SVG bars grow/shrink evoking crop volume cycles */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[100px]"
      >
        {/* Fade: blends bars into card background at top */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#081F0F]/56 via-transparent to-transparent" />
        <HarvestBars />
      </div>
    </div>
  )
}
