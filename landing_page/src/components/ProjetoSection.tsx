import { Server, Database, Globe, MessageSquare } from "lucide-react"

const stack = [
  {
    icon: Globe,
    nome: "Frontend",
    tech: "Next.js + Tailwind + Recharts",
    desc: "Interface web responsiva para visualizacao de analises, curvas de hedge e dashboards de commodities. Dark mode nativo.",
    deploy: "Vercel",
    cor: "oklch(0.87 0.185 125)",
  },
  {
    icon: Server,
    nome: "Backend",
    tech: "Python / Django REST + Celery",
    desc: "API REST com motor de calculo de hedge, fila assincrona (Celery + Redis) e gestao de usuarios com autenticacao JWT.",
    deploy: "Render",
    cor: "oklch(0.26 0.068 145)",
  },
  {
    icon: Database,
    nome: "Banco de Dados",
    tech: "PostgreSQL + pgvector (Neon)",
    desc: "Armazenamento de analises, series historicas e embeddings vetoriais para busca semantica do agente Mauro.",
    deploy: "Neon",
    cor: "oklch(0.64 0.185 280)",
  },
  {
    icon: MessageSquare,
    nome: "Agente Mauro",
    tech: "OpenAI gpt-4o-mini + pgvector",
    desc: "Agente de IA com tool-calling, busca semantica e acesso contextualizado as analises do usuario. Streaming via SSE.",
    deploy: "Backend",
    cor: "oklch(0.87 0.185 125)",
  },
]

const funcionalidades = [
  "Analise de hedge com Black-Scholes — curva de resultado e 4 cenarios (conservador, moderado, agressivo, proposto)",
  "Agente Mauro: perguntas em linguagem natural sobre posicoes e analises",
  "Dashboard de commodities com graficos de preco em tempo real (Recharts)",
  "Busca semantica em historico de analises via pgvector (extensao Neon)",
  "Streaming de respostas do Mauro via SSE — token a token, sem latencia",
  "Cadastro de usuarios com isolamento completo de dados por conta",
]

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
            Arquitetura da Solucao
          </h2>
          <p className="text-[oklch(0.65_0.010_75)] max-w-xl mx-auto">
            Uma stack moderna e escalavel, com cada componente hospedado de
            forma independente para maxima flexibilidade e custo otimizado.
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
