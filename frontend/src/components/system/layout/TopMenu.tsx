"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BarChart2,
  ArrowLeftRight,
  Package,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NavItem } from "./Sidebar"

// ---------------------------------------------------------------------------
// Default navigation — mirrors Sidebar
// ---------------------------------------------------------------------------

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",     href: "/dashboard",    icon: LayoutDashboard },
  { label: "Análises",       href: "/analises",     icon: BarChart2 },
  { label: "Transações",    href: "/transactions", icon: ArrowLeftRight },
  { label: "Commodities",   href: "/dashboard/commodities",  icon: Package },
  { label: "Mensagens",     href: "/messages",     icon: MessageSquare },
  //{ label: "Configurações", href: "/settings",     icon: Settings },
]

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TopMenuProps {
  navItems?: NavItem[]
  onLogout?: () => void
  /** Override active path — useful in preview/styleguide contexts */
  activePath?: string
  /**
   * Preview mode: renders with relative positioning instead of fixed.
   * Use when embedding inside a styleguide or demo container.
   */
  preview?: boolean
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TopMenu({
  navItems = DEFAULT_NAV_ITEMS,
  onLogout,
  activePath,
  preview = false,
  className,
}: TopMenuProps) {
  const pathname = usePathname()
  const resolvedPath = activePath ?? pathname

  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler)
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <header
      className={cn(
        preview
          ? "relative w-full max-w-5xl"
          : "fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl transition-all duration-300",
        !preview && scrolled && "shadow-lg",
        className
      )}
    >
      <nav
        style={{ backgroundColor: "black" }}
        className="rounded-full px-6 py-3 flex items-center justify-between border border-sidebar-border"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center border border-accent/30 bg-accent/10"
            aria-hidden="true"
          >
            <span className="text-accent font-bold text-xs">A</span>
          </div>
          <span className="text-sidebar-foreground font-semibold text-sm tracking-tight">
            AgroComex
          </span>
        </div>

        {/* Desktop nav items */}
        <ul className="hidden md:flex items-center gap-0.5">
          {navItems.map((item) => {
            const isActive =
              resolvedPath === item.href ||
              (item.href !== "/dashboard" && resolvedPath.startsWith(item.href + "/"))
            const Icon = item.icon

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-full transition-colors",
                    isActive
                      ? "text-white font-bold"
                      : "text-white/50 hover:text-white/80"
                  )}
                >
                  <Icon
                    className="h-3.5 w-3.5 shrink-0"
                    strokeWidth={isActive ? 2.5 : 1.75}
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Logout button (desktop) */}
        <button
          type="button"
          onClick={onLogout}
          aria-label="Log out of application"
          className="hidden md:inline-flex items-center gap-1.5 bg-accent text-accent-foreground text-sm font-semibold px-4 py-2 rounded-full hover:brightness-105 transition-all"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          Log Out
        </button>

        {/* Mobile toggle */}
        <button
          type="button"
          className="md:hidden text-sidebar-foreground p-1"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menu"
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div
          style={{ backgroundColor: "var(--sidebar)" }}
          className="md:hidden mt-2 rounded-2xl px-6 py-4 flex flex-col gap-1 border border-sidebar-border"
        >
          {navItems.map((item) => {
            const isActive =
              resolvedPath === item.href ||
              (item.href !== "/dashboard" && resolvedPath.startsWith(item.href + "/"))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 text-sm py-2.5 px-2 rounded-lg transition-colors border-b border-sidebar-border last:border-0",
                  isActive
                    ? "text-white font-bold"
                    : "text-white/50 hover:text-white/80"
                )}
              >
                <Icon
                  className="h-4 w-4 shrink-0"
                  strokeWidth={isActive ? 2.5 : 1.75}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            )
          })}

          <button
            type="button"
            onClick={() => { setOpen(false); onLogout?.() }}
            className="mt-2 flex items-center justify-center gap-1.5 bg-accent text-accent-foreground text-sm font-semibold px-4 py-2.5 rounded-full"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            Log Out
          </button>
        </div>
      )}
    </header>
  )
}
