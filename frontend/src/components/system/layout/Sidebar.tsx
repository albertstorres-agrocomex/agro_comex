"use client"

import * as React from "react"
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
  Bot,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

export interface SidebarProps {
  /** Override default nav items */
  navItems?: NavItem[]
  /** Display name shown in the user section */
  userName?: string
  /** Optional avatar URL; falls back to initials placeholder */
  userAvatarUrl?: string
  /** Application name shown in the top section */
  appName?: string
  /** Called when the user clicks Log Out */
  onLogout?: () => void
  /**
   * Preview mode: renders with relative positioning instead of fixed.
   * Use this when embedding the sidebar inside a styleguide or demo container.
   */
  preview?: boolean
  /**
   * Override the active path used for nav highlighting.
   * Useful in preview/storybook contexts where usePathname() isn't meaningful.
   */
  activePath?: string
  className?: string
}

// ---------------------------------------------------------------------------
// Default navigation configuration
// ---------------------------------------------------------------------------

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard },
  { label: "Análises",      href: "/statistics",   icon: BarChart2 },
  { label: "Transações",   href: "/transactions", icon: ArrowLeftRight },
  { label: "Commodities",  href: "/commodities",  icon: Package },
  { label: "Mensagens",    href: "/messages",     icon: MessageSquare },
  { label: "Mauro", href: "/chat",        icon: Bot },
  { label: "Configurações",href: "/settings",     icon: Settings },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("")
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Sidebar({
  navItems = DEFAULT_NAV_ITEMS,
  userName = "Mark Johnson",
  userAvatarUrl,
  appName = "AgroComex",
  onLogout,
  preview = false,
  activePath,
  className,
}: SidebarProps) {
  const pathname = usePathname()

  const resolvedPath = activePath ?? pathname

  return (
    <aside
      style={{ backgroundColor: 'var(--sidebar)' }}
      className={cn(
        // Position: fixed by default; relative in preview/demo mode
        preview
          ? "relative flex h-full w-60 flex-col"
          : "fixed inset-y-[4px] left-[2px] z-40 flex w-60 flex-col rounded-l-[var(--radius-2xl)]",
        // Subtle border using sidebar-border token
        "border border-sidebar-border",
        // Scroll when content overflows
        "overflow-y-auto overflow-x-hidden",
        // Scrollbar styling — subtle, matches dark bg
        "scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent",
        className
      )}
      aria-label="Main navigation"
    >
      {/* ------------------------------------------------------------------ */}
      {/* TOP SECTION — Logo + App name                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-3 px-5 py-5">
        {/* Logo mark */}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center",
            "rounded-[var(--radius-md)]",
            "border border-accent/30 bg-accent/10",
          )}
          aria-hidden="true"
        >
          <span className="text-sm font-bold text-accent">A</span>
        </div>

        {/* App name */}
        <span className="truncate text-sm font-bold tracking-wide text-sidebar-foreground">
          {appName}
        </span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* USER SECTION — Avatar + Welcome + Name                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col items-center gap-3 px-5 py-6">
        {/* Avatar */}
        <div
          className={cn(
            "relative h-14 w-14 shrink-0 overflow-hidden rounded-full",
            "border-2 border-accent/35",
            "bg-sidebar-accent",
            "flex items-center justify-center",
          )}
        >
          {userAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatarUrl}
              alt={`${userName} avatar`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              className="text-sm font-semibold text-sidebar-foreground/70"
              aria-hidden="true"
            >
              {getInitials(userName)}
            </span>
          )}
        </div>

        {/* Welcome text + user name */}
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/40">
            Olá,
          </p>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-sidebar-foreground">
            {userName}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* NAVIGATION SECTION                                                   */}
      {/* ------------------------------------------------------------------ */}
      <nav
        className="flex-1 space-y-0.5 px-3 py-4"
        aria-label="Primary navigation"
      >
        {navItems.map((item) => {
          const isActive =
            resolvedPath === item.href || resolvedPath.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5",
                "text-sm font-medium",
                "outline-none transition-all duration-150 ease-out",
                // Focus ring using sidebar ring token
                "focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar",
                isActive
                  ? // Active: texto em destaque sem fundo colorido
                    "text-sidebar-foreground font-bold"
                  : // Default + hover
                    "text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors duration-150",
                  isActive
                    ? "text-sidebar-foreground"
                    : "text-sidebar-foreground/45 group-hover:text-sidebar-accent-foreground"
                )}
                strokeWidth={isActive ? 2.5 : 1.75}
                aria-hidden="true"
              />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* BOTTOM SECTION — Logout                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="px-3 py-4">
        <button
          type="button"
          onClick={onLogout}
          aria-label="Log out of application"
          className={cn(
            "group flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5",
            "text-sm font-medium",
            "text-sidebar-foreground/45",
            "outline-none transition-all duration-150 ease-out",
            "hover:bg-accent/15 hover:text-accent",
            "focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none",
          )}
        >
          <LogOut
            className="h-4 w-4 shrink-0 transition-colors duration-150 group-hover:text-accent"
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  )
}
