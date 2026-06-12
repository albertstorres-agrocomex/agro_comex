"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// --- Shared icons ---

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

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function TargetIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function ZapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

// --- Cenario data ---

export interface CenarioConfig {
  id: string
  label: string
  badge?: string
  icon: React.ReactNode
  subtitulo: string
  metricaLabel: string
  metricaValor: string
  itens: string[]
  featured?: boolean
}

export const CENARIOS_PADRAO: CenarioConfig[] = [
  {
    id: "conservador",
    label: "Conservador",
    icon: <ShieldIcon />,
    subtitulo: "Para produtores com foco em proteção de preço",
    metricaLabel: "Cobertura de hedge",
    metricaValor: "70–80%",
    itens: [
      "Puts OTM como seguro de preço",
      "Stop loss rígido configurado",
      "Baixa alavancagem permitida",
      "Relatório de exposição a risco",
      "Alertas de margem automáticos",
    ],
  },
  {
    id: "moderado",
    label: "Moderado",
    badge: "Recomendado",
    icon: <TargetIcon />,
    subtitulo: "Equilíbrio entre proteção e rentabilidade",
    metricaLabel: "Cobertura de hedge",
    metricaValor: "50–65%",
    itens: [
      "Collars e spreads otimizados",
      "Hedge parcial com flexibilidade",
      "Alavancagem moderada",
      "Análise de cenários completa",
      "Dashboard de posições ativo",
      "Simulação Black-Scholes",
    ],
    featured: true,
  },
  {
    id: "agressivo",
    label: "Agressivo",
    icon: <ZapIcon />,
    subtitulo: "Para traders e exportadores experientes",
    metricaLabel: "Cobertura de hedge",
    metricaValor: "até 40%",
    itens: [
      "Calls nuas e operações direcionais",
      "Alta alavancagem habilitada",
      "Gestão ativa de posições",
      "Análise de volatilidade implícita",
      "Suporte a estratégias complexas",
    ],
  },
  {
    id: "proposto",
    label: "Seu Cenário",
    icon: <StarIcon />,
    subtitulo: "Cenário baseado no preço de exercício que você informou",
    metricaLabel: "Preço de exercício",
    metricaValor: "—",
    itens: [
      "Configurado com seus parâmetros",
      "Calculado pelo modelo Black-Scholes",
    ],
  },
]

// --- SelectionButton (same pattern as LoginCard submit) ---

interface SelectionButtonProps {
  label?: string
  onClick?: () => void
  disabled?: boolean
  featured?: boolean
}

function SelectionButton({ label = "Selecionar cenário", onClick, disabled, featured }: SelectionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative w-full h-14 overflow-hidden",
        "rounded-xl border",
        "text-base font-semibold tracking-wide",
        "cursor-pointer transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        featured
          ? "border-accent/50 bg-accent/10 hover:bg-accent/18 text-accent"
          : "border-accent/50 bg-accent/10 hover:bg-accent/18 text-accent"
      )}
    >
      <span className="relative z-10 block transition-transform duration-300 group-hover:-translate-x-3">
        {label}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "absolute right-7 top-1/2 -translate-y-1/2 z-10",
          "translate-x-4 opacity-0",
          "transition-all duration-300",
          "group-hover:translate-x-0 group-hover:opacity-100",
          featured ? "text-accent" : "text-accent"
        )}
      >
        <ArrowRightIcon />
      </span>
    </button>
  )
}

// --- Single card ---

interface CenarioCardProps {
  cenario: CenarioConfig
  selected?: boolean
  onSelect?: (id: CenarioConfig["id"]) => void
}

function CenarioCard({ cenario, selected, onSelect }: CenarioCardProps) {
  const { id, label, badge, icon, subtitulo, metricaLabel, metricaValor, itens, featured } = cenario

  return (
    <div
      className={cn(
        "relative flex flex-col",
        "rounded-[28px] border",
        "transition-all duration-300",
        featured
          ? [
              "pt-[48px] pb-[36px] px-[28px]",
              "border-accent/30 shadow-[0_0_40px_-8px_oklch(0.87_0.185_125/0.25)]",
              "bg-[#0c2a14]/80 backdrop-blur-xl",
              "scale-[1.03] z-10",
            ]
          : [
              "pt-[36px] pb-[28px] px-[28px]",
              "border-border hover:border-primary/30",
              "bg-card",
              "hover:shadow-[0_0_24px_-6px_oklch(0.87_0.185_125/0.12)]",
            ],
        selected && "border-accent/60 ring-1 ring-accent/40"
      )}
    >
      {/* Top highlight line */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px rounded-full",
          featured
            ? "bg-gradient-to-r from-transparent via-accent/50 to-transparent"
            : "bg-gradient-to-r from-transparent via-border to-transparent"
        )}
      />

      {/* Badge */}
      {badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-accent-foreground text-[11px] font-bold tracking-widest uppercase">
            {badge}
          </span>
        </div>
      )}

      {/* Icon + label */}
      <div className="flex items-center gap-3 mb-3">
        <span className={cn("flex-shrink-0", featured ? "text-accent" : "text-muted-foreground")}>
          {icon}
        </span>
        <span className={cn(
          "text-sm font-semibold uppercase tracking-[0.15em]",
          featured ? "text-accent" : "text-muted-foreground"
        )}>
          {label}
        </span>
      </div>

      {/* Subtitle */}
      <p className={cn("text-sm leading-relaxed mb-6", featured ? "text-white/55" : "text-muted-foreground")}>
        {subtitulo}
      </p>

      {/* Metric */}
      <div className="mb-6">
        <div className={cn("text-4xl font-bold leading-none tracking-tight", featured ? "text-accent" : "text-foreground")}>
          {metricaValor}
        </div>
        <div className={cn("text-xs mt-1.5 uppercase tracking-[0.12em]", featured ? "text-white/40" : "text-muted-foreground")}>
          {metricaLabel}
        </div>
      </div>

      {/* Divider */}
      <div className={cn("h-px mb-5", featured ? "bg-accent/15" : "bg-border")} />

      {/* Feature list */}
      <div className="mb-7 flex flex-col gap-2.5 flex-1">
        <p className={cn("text-[11px] font-semibold uppercase tracking-[0.15em] mb-1", featured ? "text-white/35" : "text-muted-foreground")}>
          O que está incluído
        </p>
        {itens.map((item) => (
          <div key={item} className="flex items-start gap-2.5">
            <span className={cn("mt-0.5 flex-shrink-0", featured ? "text-accent" : "text-muted-foreground")}>
              <CheckIcon />
            </span>
            <span className={cn("text-sm leading-snug", featured ? "text-white/70" : "text-foreground")}>{item}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <SelectionButton
        label="Selecionar cenário"
        featured={featured}
        onClick={() => onSelect?.(id)}
      />
    </div>
  )
}

// --- Main component ---

export interface CardSelecaoCenarioAnaliseProps {
  cenarios?: CenarioConfig[]
  defaultSelected?: CenarioConfig["id"]
  onCenarioChange?: (id: CenarioConfig["id"]) => void
  className?: string
}

export function CardSelecaoCenarioAnalise({
  cenarios = CENARIOS_PADRAO.filter((c) => c.id !== "proposto"),
  defaultSelected,
  onCenarioChange,
  className,
}: CardSelecaoCenarioAnaliseProps) {
  const [selected, setSelected] = React.useState<CenarioConfig["id"] | undefined>(defaultSelected)

  function handleSelect(id: CenarioConfig["id"]) {
    setSelected(id)
    onCenarioChange?.(id)
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className="grid gap-4 items-center"
        style={{ gridTemplateColumns: `repeat(${cenarios.length}, minmax(0, 1fr))` }}
      >
        {cenarios.map((cenario) => (
          <CenarioCard
            key={cenario.id}
            cenario={cenario}
            selected={selected === cenario.id}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  )
}
