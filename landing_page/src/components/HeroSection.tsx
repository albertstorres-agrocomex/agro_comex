export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "oklch(0.935 0.012 88)",
      }}
    >
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.26 0.068 145) 1px, transparent 1px), linear-gradient(90deg, oklch(0.26 0.068 145) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-28">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[oklch(0.87_0.185_125)]/20 border border-[oklch(0.87_0.185_125)]/30 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-[oklch(0.87_0.185_125)]" />
          <span className="text-[oklch(0.26_0.068_145)] text-sm font-medium">
            Especialista em Hedge Agrícola
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[oklch(0.175_0.018_70)] leading-tight mb-6">
          Hedge mais{" "}
          <span className="text-[oklch(0.26_0.068_145)]">Preciso</span> para o{" "}
          <br />
          Agronegócio{" "}
          <span className="text-[oklch(0.26_0.068_145)]">Brasileiro</span>
        </h1>

        <p className="text-lg text-[oklch(0.52_0.010_75)] max-w-2xl mx-auto mb-10 leading-relaxed">
          Uma plataforma inteligente que reduz a dependência da experiência do
          operador, tornando as decisões de hedge mais precisas, rastreáveis e
          acessíveis para toda a cadeia do agro.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#desafio"
            className="inline-flex items-center justify-center bg-[oklch(0.26_0.068_145)] text-white font-semibold px-7 py-3.5 rounded-full hover:brightness-110 transition-all"
          >
            Conheça o Desafio
          </a>
          <a
            href="#projeto"
            className="inline-flex items-center justify-center border border-[oklch(0.26_0.068_145)] text-[oklch(0.26_0.068_145)] font-semibold px-7 py-3.5 rounded-full hover:bg-[oklch(0.26_0.068_145)]/5 transition-all"
          >
            Ver Projeto
          </a>
        </div>
      </div>

      {/* Bottom dark band with feature cards */}
      <div className="relative z-10 w-full mt-20 px-6 max-w-5xl mx-auto">
        {/* Key Features badge */}
        <div className="inline-flex items-center gap-2 bg-[oklch(0.87_0.185_125)]/15 border border-[oklch(0.87_0.185_125)]/25 rounded-full px-3 py-1 mb-6">
          <span className="text-[oklch(0.26_0.068_145)] text-xs font-medium">⚡ Funcionalidades</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="bg-[oklch(0.26_0.068_145)] rounded-2xl p-6 text-white">
            <div className="w-10 h-10 rounded-xl bg-[oklch(0.87_0.185_125)] flex items-center justify-center mb-4">
              <span className="text-[oklch(0.18_0.08_135)] font-bold text-lg">A</span>
            </div>
            <h3 className="font-bold text-lg mb-2">AgroComex</h3>
            <p className="text-white/70 text-sm">
              Plataforma integrada para gestão de risco cambial e de commodities no agro.
            </p>
          </div>

          {/* Card 2 — image style */}
          <div
            className="rounded-2xl p-6 min-h-[160px] relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.40 0.10 145) 0%, oklch(0.22 0.05 145) 100%)",
            }}
          >
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.3'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/svg%3E\")",
              }}
            />
            <h3 className="font-bold text-lg text-white mb-2">Análise de Mercado</h3>
            <p className="text-white/70 text-sm">
              Dados em tempo real de câmbio, soja, milho e boi para decisões embasadas.
            </p>
          </div>

          {/* Card 3 — accent */}
          <div className="bg-[oklch(0.87_0.185_125)] rounded-2xl p-6">
            <h3 className="font-bold text-lg text-[oklch(0.18_0.08_135)] mb-2">
              Risco e Conformidade
            </h3>
            <p className="text-[oklch(0.18_0.08_135)]/75 text-sm mb-4">
              Monitore exposições, limites e alertas de hedge de forma automatizada.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {["Exposição", "Limite", "Alerta"].map((t) => (
                <span
                  key={t}
                  className="text-xs bg-[oklch(0.18_0.08_135)]/10 text-[oklch(0.18_0.08_135)] px-2.5 py-1 rounded-full font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
