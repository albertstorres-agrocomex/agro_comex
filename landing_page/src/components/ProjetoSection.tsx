import { Server, Database, Globe, Layers } from "lucide-react";

const stack = [
  {
    icon: Globe,
    nome: "Frontend",
    tech: "Next.js + Tailwind",
    desc: "Interface web responsiva para visualização de posições, curvas de hedge e dashboards analíticos.",
    deploy: "Vercel",
    cor: "oklch(0.87 0.185 125)",
  },
  {
    icon: Server,
    nome: "Backend",
    tech: "Python / Django Rest Framework",
    desc: "API REST para integração com fontes de dados de mercado, motor de cálculo de hedge e gestão de usuários.",
    deploy: "Render",
    cor: "oklch(0.26 0.068 145)",
  },
  {
    icon: Database,
    nome: "Banco de Dados",
    tech: "PostgreSQL (Neon)",
    desc: "Armazenamento de contratos, histórico de operações, usuários e séries históricas de preços.",
    deploy: "Neon",
    cor: "oklch(0.64 0.185 280)",
  },
  {
    icon: Layers,
    nome: "Landing Page",
    tech: "Next.js + Tailwind",
    desc: "Página pública de apresentação do projeto, com deploy independente no Vercel.",
    deploy: "Vercel",
    cor: "oklch(0.60 0.12 185)",
  },
];

const funcionalidades = [
  "Dashboard de posições e exposições cambiais",
  "Cálculo automatizado de estratégias de hedge (NDF, opções, swaps)",
  "Alertas de limites e gatilhos de proteção",
  "Integração com cotações de câmbio e commodities em tempo real",
  "Histórico e rastreabilidade de decisões",
  "Relatórios para compliance e gestão de risco",
];

export default function ProjetoSection() {
  return (
    <section
      id="projeto"
      className="py-24 px-6"
      style={{ background: "#081F0F" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[oklch(0.87_0.185_125)]/15 border border-[oklch(0.87_0.185_125)]/25 rounded-full px-4 py-1.5 mb-6">
            <span className="text-[oklch(0.87_0.185_125)] text-sm font-medium">
              # O Projeto
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Arquitetura da Solução
          </h2>
          <p className="text-[oklch(0.65_0.010_75)] max-w-xl mx-auto">
            Uma stack moderna e escalável, com cada componente hospedado de
            forma independente para máxima flexibilidade e custo otimizado.
          </p>
        </div>

        {/* Stack cards */}
        <div className="grid sm:grid-cols-2 gap-6 mb-20">
          {stack.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.nome}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: s.cor }}
                  >
                    <Icon size={18} className="text-white" />
                  </div>
                  <span className="text-xs bg-[oklch(0.87_0.185_125)]/25 text-[oklch(0.22_0.068_145)] font-medium px-2.5 py-1 rounded-full">
                    {s.deploy}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{s.nome}</h3>
                <p
                  className="text-sm font-medium mb-3"
                  style={{ color: s.cor }}
                >
                  {s.tech}
                </p>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Funcionalidades */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Funcionalidades da Plataforma
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {funcionalidades.map((f) => (
              <div key={f} className="flex items-start gap-3">
                <span className="mt-1 w-5 h-5 rounded-full bg-[oklch(0.87_0.185_125)] flex items-center justify-center shrink-0">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                  >
                    <path
                      d="M2 5l2 2 4-4"
                      stroke="oklch(0.18 0.08 135)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-gray-600 text-sm leading-relaxed">
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
