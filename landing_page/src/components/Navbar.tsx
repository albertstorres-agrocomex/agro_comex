"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Home", href: "#home" },
  { label: "Equipe", href: "#equipe" },
  { label: "Desafio", href: "#desafio" },
  { label: "Projeto", href: "#projeto" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
        <a
          href="#projeto"
          className="hidden md:inline-flex items-center gap-1.5 bg-[oklch(0.87_0.185_125)] text-[oklch(0.18_0.08_135)] text-sm font-semibold px-4 py-2 rounded-full hover:brightness-105 transition-all"
        >
          + Ver Projeto
        </a>

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
          <a
            href="#projeto"
            onClick={() => setOpen(false)}
            className="mt-2 text-center bg-[oklch(0.87_0.185_125)] text-[oklch(0.18_0.08_135)] text-sm font-semibold px-4 py-2.5 rounded-full"
          >
            + Ver Projeto
          </a>
        </div>
      )}
    </header>
  );
}
