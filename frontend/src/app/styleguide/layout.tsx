"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { navigation } from "./navigation";

export default function StyleguideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card fixed top-0 left-0 h-screen overflow-y-auto flex flex-col">
        {/* Logo area */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2C4.686 2 2 4.686 2 8s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 2a4 4 0 110 8A4 4 0 018 4z" fill="currentColor" className="text-primary-foreground" />
                <circle cx="8" cy="8" r="2" fill="currentColor" className="text-primary-foreground" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold leading-tight tracking-wide text-foreground">AgroComex</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Design System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 flex flex-col gap-5">
          {navigation.map((section) => (
            <div key={section.title}>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-2">
                {section.title}
              </h3>
              {section.items.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 italic">Coming soon</p>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150",
                          pathname === item.href
                            ? "bg-primary text-primary-foreground font-medium"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            pathname === item.href ? "bg-primary-foreground" : "bg-muted-foreground"
                          )} />
                          {item.name}
                        </span>
                        {item.tag && (
                          <span className={cn(
                            "text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide",
                            pathname === item.href
                              ? "bg-white/20 text-white"
                              : item.tag === "FL"
                              ? "bg-info/15 text-info"
                              : "bg-accent/30 text-accent-foreground"
                          )}>
                            {item.tag}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>

        {/* Dark mode toggle */}
        <div className="px-4 py-4 border-t border-border">
          <button
            onClick={() => setDark(!dark)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted hover:bg-secondary transition-colors text-sm"
          >
            <span className="text-muted-foreground">
              {dark ? "Light mode" : "Dark mode"}
            </span>
            <div className={cn(
              "w-9 h-5 rounded-full relative transition-colors",
              dark ? "bg-primary" : "bg-border"
            )}>
              <div className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                dark ? "left-4" : "left-0.5"
              )} />
            </div>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 overflow-auto">
        {children}
      </main>
    </div>
  );
}
