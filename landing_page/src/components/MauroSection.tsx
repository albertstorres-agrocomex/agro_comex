import { MessageSquare, Search, BarChart2, Zap } from "lucide-react"

const recursos = [
  {
    icon: MessageSquare,
    titulo: "Conversa contextualizada",
    desc: "Mauro conhece cada analise criada pelo usuario e responde com base nos dados reais da posicao de hedge.",
  },
  {
    icon: Search,
    titulo: "Busca semantica (pgvector)",
    desc: "Recupera contexto relevante do banco vetorial para fundamentar cada resposta com precisao.",
  },
  {
    icon: BarChart2,
    titulo: "Black-Scholes integrado",
    desc: "Acessa curvas de resultado, cenarios e premissas de precificacao via tool-calling direto na API.",
  },
  {
    icon: Zap,
    titulo: "Streaming em tempo real",
    desc: "Respostas transmitidas token a token via SSE — com indicador de digitacao e sem bloqueio de interface.",
  },
]

const mockMsgs = [
  { role: "user", text: "Como ficou minha analise de soja para outubro?" },
  {
    role: "mauro",
    text: "Sua analise usa uma put com strike R$ 125,00/sc. No cenario moderado, o hedge cobre 87% da queda. Quer ver a curva completa?",
  },
  { role: "user", text: "Sim, qual seria o premio?" },
  {
    role: "mauro",
    text: "Premio estimado: R$ 4,20/saca (3,4% do nocional). Abaixo de R$ 120,00, a protecao entra automaticamente.",
  },
]

export default function MauroSection() {
  return (
    <section
      id="mauro"
      className="py-24 px-6"
      style={{ background: "oklch(0.12 0.025 145)" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border"
            style={{
              background: "oklch(0.87 0.185 125 / 0.12)",
              borderColor: "oklch(0.87 0.185 125 / 0.25)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "oklch(0.87 0.185 125)" }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: "oklch(0.87 0.185 125)" }}
            >
              Agente IA
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Conheca o Mauro
          </h2>
          <p
            className="max-w-xl mx-auto text-sm leading-relaxed"
            style={{ color: "oklch(0.62 0.010 75)" }}
          >
            O agente de IA do AgroComex. Analisa posicoes, interpreta dados de
            hedge e responde com contexto real — integrado diretamente as suas
            analises.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Feature list */}
          <div className="space-y-7">
            {recursos.map((r) => {
              const Icon = r.icon
              return (
                <div key={r.titulo} className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                    style={{
                      background: "oklch(0.87 0.185 125 / 0.12)",
                      borderColor: "oklch(0.87 0.185 125 / 0.25)",
                    }}
                  >
                    <Icon size={18} style={{ color: "oklch(0.87 0.185 125)" }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1 text-sm">
                      {r.titulo}
                    </h3>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "oklch(0.58 0.010 75)" }}
                    >
                      {r.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Mock chat */}
          <div
            className="rounded-2xl overflow-hidden border"
            style={{
              background: "oklch(0.10 0.038 145)",
              borderColor: "oklch(0.22 0.022 145)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b"
              style={{ borderColor: "oklch(0.22 0.022 145)" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                  background: "oklch(0.87 0.185 125)",
                  color: "oklch(0.18 0.08 135)",
                }}
              >
                M
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold leading-none">
                  Mauro
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "oklch(0.87 0.185 125)" }}
                >
                  Agente AgroComex
                </p>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: "oklch(0.87 0.185 125 / 0.15)",
                  color: "oklch(0.87 0.185 125)",
                }}
              >
                online
              </span>
            </div>

            {/* Messages */}
            <div className="p-4 space-y-3">
              {mockMsgs.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className="max-w-[85%] px-4 py-2.5 text-xs leading-relaxed"
                    style={
                      msg.role === "user"
                        ? {
                            background: "oklch(0.87 0.185 125)",
                            color: "oklch(0.18 0.08 135)",
                            borderRadius: "1rem 1rem 0.25rem 1rem",
                          }
                        : {
                            background: "oklch(0.18 0.025 145)",
                            color: "oklch(0.88 0.008 85)",
                            borderRadius: "1rem 1rem 1rem 0.25rem",
                          }
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              <div className="flex justify-start">
                <div
                  className="px-4 py-3 flex items-center gap-1"
                  style={{
                    background: "oklch(0.18 0.025 145)",
                    borderRadius: "1rem 1rem 1rem 0.25rem",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{
                        background: "oklch(0.87 0.185 125)",
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
