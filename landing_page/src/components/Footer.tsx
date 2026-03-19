export default function Footer() {
  return (
    <footer
      className="py-10 px-6 border-t border-white/10"
      style={{ background: "#000000" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[oklch(0.87_0.185_125)] flex items-center justify-center">
            <span className="text-[oklch(0.18_0.08_135)] font-bold text-xs">A</span>
          </div>
          <span className="text-white font-semibold text-sm">AgroComex</span>
        </div>
        <p className="text-[oklch(0.55_0.010_75)] text-sm text-center">
          Projeto acadêmico — Hedge inteligente para o agronegócio brasileiro
        </p>
        <div className="flex items-center gap-4">
          <a
            href="#home"
            className="text-[oklch(0.55_0.010_75)] hover:text-white text-sm transition-colors"
          >
            Topo
          </a>
        </div>
      </div>
    </footer>
  );
}
