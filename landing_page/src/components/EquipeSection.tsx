import Image from "next/image";

const membros = [
  {
    nome: "Albert Sevy",
    papel: "Desenvolvedor Full Stack & Arquiteto de Solução",
    bio: "Responsável pela arquitetura da plataforma, desenvolvimento do backend e coordenação técnica do projeto.",
    img: "https://raw.githubusercontent.com/albertstorres/imagem-embed/main/albert.jpeg",
    github: "albertstorres",
  },
  {
    nome: "André Pessoa",
    papel: "Desenvolvedor & Analista de Dados",
    bio: "Especialista em modelagem de dados, análise de mercado de commodities e integração com fontes de dados financeiros.",
    img: "https://raw.githubusercontent.com/albertstorres/imagem-embed/main/andre.jpeg",
    github: "andrepessoa",
    imgPosition: "center -30px",
  },
];

export default function EquipeSection() {
  return (
    <section
      id="equipe"
      className="py-24 px-6"
      style={{ background: "#081F0F" }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[oklch(0.87_0.185_125)]/15 border border-[oklch(0.87_0.185_125)]/25 rounded-full px-4 py-1.5 mb-6">
            <span className="text-[oklch(0.87_0.185_125)] text-sm font-medium">
              # Equipe
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Quem está por trás
          </h2>
          <p className="text-[oklch(0.65_0.010_75)] max-w-xl mx-auto">
            Uma equipe focada em resolver um problema real do agronegócio
            brasileiro com tecnologia e dados.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto md:max-w-none">
          {membros.map((m) => (
            <div
              key={m.nome}
              className="relative rounded-3xl overflow-hidden border border-gray-200 group cursor-pointer"
              style={{ height: "360px" }}
            >
              {/* Photo */}
              <Image
                src={m.img}
                alt={m.nome}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                style={{ objectPosition: (m as any).imgPosition ?? "center top" }}
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              {/* Info overlay — aparece no hover */}
              <div className="absolute inset-0 bg-black/80 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-xl font-bold text-white mb-1">{m.nome}</h3>
                <p className="text-[oklch(0.87_0.185_125)] text-sm font-medium mb-3">
                  {m.papel}
                </p>
                <p className="text-white/70 text-sm leading-relaxed">
                  {m.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
