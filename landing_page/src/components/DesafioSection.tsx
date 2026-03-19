import { TrendingUp, Brain, Shield, BarChart3 } from "lucide-react";

const pilares = [
  {
    icon: TrendingUp,
    titulo: "Volatilidade do Mercado",
    desc: "Câmbio, taxas de juros e preços de commodities em constante variação exigem decisões rápidas e precisas.",
  },
  {
    icon: Brain,
    titulo: "Dependência Humana",
    desc: "Decisões de hedge ainda dependem fortemente da intuição e experiência de poucos operadores especializados.",
  },
  {
    icon: Shield,
    titulo: "Gestão de Risco",
    desc: "Exposições não gerenciadas adequadamente representam risco financeiro significativo para produtores e tradings.",
  },
  {
    icon: BarChart3,
    titulo: "Dados Fragmentados",
    desc: "As informações existem, mas estão dispersas em diferentes fontes. Sem integração entre bases de câmbio, commodities e contratos, o operador perde tempo e toma decisões com visão incompleta.",
  },
];

export default function DesafioSection() {
  return (
    <section id="desafio" className="py-24 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        {/* Badge */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[oklch(0.26_0.068_145)]/10 border border-[oklch(0.26_0.068_145)]/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-[oklch(0.26_0.068_145)] text-sm font-medium">
              # O Desafio
            </span>
          </div>
        </div>

        {/* Pergunta central */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <blockquote className="text-3xl md:text-4xl font-bold text-[oklch(0.175_0.018_70)] leading-tight mb-6">
            &ldquo;Como tornar o processo de hedge no agronegócio brasileiro,
            mais preciso e menos dependente da experiência do operador?&rdquo;
          </blockquote>
          <p className="text-[oklch(0.52_0.010_75)] text-lg leading-relaxed">
            Esta é a pergunta central que guia todo o desenvolvimento da
            plataforma AgroComex. Buscamos democratizar o acesso a estratégias
            de proteção cambial e de preço para toda a cadeia produtiva do agro.
          </p>
        </div>

        {/* Pilares */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pilares.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.titulo}
                className="bg-white/60 rounded-2xl p-6 border border-[oklch(0.86_0.012_85)] hover:border-[oklch(0.26_0.068_145)]/30 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[oklch(0.26_0.068_145)] flex items-center justify-center mb-4">
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className="font-semibold text-[oklch(0.175_0.018_70)] mb-2">
                  {p.titulo}
                </h3>
                <p className="text-[oklch(0.52_0.010_75)] text-sm leading-relaxed">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Contexto numérico */}
        <div className="mt-16 grid sm:grid-cols-3 gap-8 text-center">
          {[
            { num: "U$ 169 Bi", label: "PIB do Agronegócio Brasileiro (2025)" },
            { num: "≈ 50%", label: "Das exportações brasileiras são commodities agrícolas" },
            { num: "Alta", label: "Volatilidade cambial BRL/USD nos últimos 5 anos" },
          ].map((s) => (
            <div key={s.label} className="py-8 px-6 rounded-2xl bg-[oklch(0.26_0.068_145)] text-white">
              <div className="text-3xl font-bold text-[oklch(0.87_0.185_125)] mb-2">
                {s.num}
              </div>
              <div className="text-white/75 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
