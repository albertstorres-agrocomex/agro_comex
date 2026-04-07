"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const DRIVE_URL = "https://drive.google.com/drive/folders/1sfuOYIuZdYWmvefMX6Qs3aULYiqTZKS_";
const GITHUB_URL = "https://github.com/albertstorres-agrocomex/agro_comex";

const links = [
  { label: "Home", href: "#home" },
  { label: "Equipe", href: "#equipe" },
  { label: "Desafio", href: "#desafio" },
  { label: "Projeto", href: "#projeto" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl transition-all duration-300 ${
        scrolled ? "shadow-lg" : ""
      }`}
    >
      <nav className="bg-black rounded-full px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-full bg-[oklch(0.87_0.185_125)] flex items-center justify-center">
            <span className="text-[oklch(0.175_0.018_70)] font-bold text-xs">A</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">
            AgroComex
          </span>
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-[oklch(0.75_0.008_80)] hover:text-white text-sm px-4 py-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-2">
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-1.5 bg-[oklch(0.87_0.185_125)] text-[oklch(0.18_0.08_135)] text-sm font-semibold px-4 py-2 rounded-full hover:brightness-105 transition-all"
            >
              + Ver Projeto
            </button>
          ) : (
            <>
              <a
                href={DRIVE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-white/10 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-white/20 transition-all"
              >
                <svg width="15" height="15" viewBox="0 0 87.3 78" aria-hidden="true">
                  <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                  <path d="M43.65 25L29.9 1.2C28.55.4 27 0 25.45 0c-1.55 0-3.1.4-4.5 1.2L7.2 25H43.65z" fill="#00ac47"/>
                  <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5c.8-1.4 1.2-2.95 1.2-4.5H59.8L73.55 76.8z" fill="#ea4335"/>
                  <path d="M43.65 25L57.4 1.2C56 .4 54.45 0 52.9 0H34.4c-1.55 0-3.1.4-4.5 1.2L43.65 25z" fill="#00832d"/>
                  <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.1-.45 4.5-1.2z" fill="#2684fc"/>
                  <path d="M73.4 26.5L59.65 2.7c-.8-1.4-1.9-2.5-3.3-3.3L43 25l16.8 28H86.1c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                </svg>
                Drive
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-white/10 text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-white/20 transition-all"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </a>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all"
                aria-label="Fechar"
              >
                <X size={12} />
              </button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-white p-1"
          onClick={() => setOpen(!open)}
          aria-label="menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden mt-2 bg-black rounded-2xl px-6 py-4 flex flex-col gap-2">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-[oklch(0.75_0.008_80)] hover:text-white text-sm py-2 border-b border-white/10 last:border-0 transition-colors"
            >
              {l.label}
            </a>
          ))}
          {!expanded ? (
            <button
              type="button"
              onClick={() => { setExpanded(true); setOpen(false); }}
              className="mt-2 text-center bg-[oklch(0.87_0.185_125)] text-[oklch(0.18_0.08_135)] text-sm font-semibold px-4 py-2.5 rounded-full"
            >
              + Ver Projeto
            </button>
          ) : (
            <div className="mt-2 flex gap-2">
              <a
                href={DRIVE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex-1 text-center bg-white/10 text-white text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-white/20 transition-all"
              >
                Drive
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="flex-1 text-center bg-white/10 text-white text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-white/20 transition-all"
              >
                GitHub
              </a>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
