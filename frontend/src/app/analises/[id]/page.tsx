"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { TopMenu } from "@/components/system/layout/TopMenu";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  fetchSolicitacao,
  type SolicitacaoAnaliseData,
} from "@/services/analiseService";

const STATUS_CONFIG = {
  aguardando: { label: "Aguardando", variant: "warning" as const },
  processando: { label: "Processando", variant: "info" as const },
  concluido: { label: "Concluido", variant: "success" as const },
  erro: { label: "Erro", variant: "destructive" as const },
};

function statusBgColor(status: SolicitacaoAnaliseData["status"]) {
  switch (status) {
    case "concluido": return "var(--success)";
    case "erro": return "var(--destructive)";
    case "processando": return "var(--info)";
    default: return "var(--warning)";
  }
}

function statusFgColor(status: SolicitacaoAnaliseData["status"]) {
  switch (status) {
    case "concluido": return "var(--success-foreground)";
    case "erro": return "var(--destructive-foreground)";
    case "processando": return "var(--info-foreground)";
    default: return "var(--warning-foreground)";
  }
}

export default function AnaliseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading, logout } = useAuth();

  const [solicitacao, setSolicitacao] = useState<SolicitacaoAnaliseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.push("/"); return; }
    const id = Number(params.id);
    if (isNaN(id)) { setNotFound(true); setLoading(false); return; }
    fetchSolicitacao(id)
      .then(setSolicitacao)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [isAuthenticated, isLoading, router, params.id]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  const cfg = solicitacao ? STATUS_CONFIG[solicitacao.status] : null;

  const mesLabel = solicitacao
    ? solicitacao.mes_contrato_ticket ??
      (solicitacao.mes_contrato_codigo && solicitacao.mes_contrato_ano
        ? `${solicitacao.mes_contrato_codigo}/${solicitacao.mes_contrato_ano}`
        : null)
    : null;

  const title = solicitacao
    ? `${solicitacao.commodity_nome} — ${solicitacao.tipo_derivativo_rotulo}${mesLabel ? ` (${mesLabel})` : ""}`
    : null;

  return (
    <div className="h-screen overflow-hidden bg-background">
      <TopMenu onLogout={handleLogout} />

      <div
        className="absolute inset-x-5 bottom-5 grid gap-2.5"
        style={{
          top: "calc(80px + 20px)",
          gridTemplateColumns: "60% 1fr",
          gridTemplateRows: "1fr",
        }}
      >
        {/* Coluna esquerda — conteudo da analise */}
        <div className="flex flex-col min-h-0 rounded-[var(--radius-2xl)] border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 shrink-0 border-b border-border">
            <Link
              href="/analises"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft size={16} />
            </Link>
            {loading ? (
              <div className="h-5 w-48 bg-muted rounded animate-pulse" />
            ) : solicitacao ? (
              <>
                <h1 className="text-base font-bold text-foreground truncate flex-1">
                  {title}
                </h1>
                {cfg && (
                  <Badge
                    variant="secondary"
                    style={{
                      background: statusBgColor(solicitacao.status),
                      color: statusFgColor(solicitacao.status),
                    }}
                    className="text-[10px] px-1.5 py-0 h-[18px] font-semibold shrink-0"
                  >
                    {cfg.label}
                  </Badge>
                )}
              </>
            ) : (
              <h1 className="text-base font-bold text-foreground">Solicitacao nao encontrada</h1>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${80 - i * 10}%` }} />
                ))}
              </div>
            ) : notFound ? (
              <p className="text-sm text-muted-foreground">Solicitacao nao encontrada.</p>
            ) : solicitacao ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Criada em{" "}
                  {new Date(solicitacao.criado_em).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {solicitacao.status === "concluido" && solicitacao.resultado ? (
                  <div className="rounded-[var(--radius-xl)] border border-border bg-background p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Resultado da Analise</h3>
                    {solicitacao.resultado.nivel_acumulacao !== null && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                          Nivel de Acumulacao
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {solicitacao.resultado.nivel_acumulacao}
                        </p>
                      </div>
                    )}
                    {solicitacao.resultado.volatilidade_utilizada && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                          Volatilidade Utilizada
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {solicitacao.resultado.volatilidade_utilizada}
                        </p>
                      </div>
                    )}
                    {solicitacao.resultado.taxa_juros_utilizada && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                          Taxa de Juros Utilizada
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {solicitacao.resultado.taxa_juros_utilizada}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Calculado em{" "}
                      {new Date(solicitacao.resultado.calculado_em).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[var(--radius-xl)] border border-border bg-muted/40 p-4">
                    <p className="text-sm text-muted-foreground">
                      {solicitacao.status === "aguardando"
                        ? "Aguardando processamento..."
                        : solicitacao.status === "processando"
                        ? "Processando analise..."
                        : solicitacao.status === "erro"
                        ? "Ocorreu um erro ao processar esta analise."
                        : "Aguardando resultado..."}
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Coluna direita — detalhes do contrato */}
        <div className="flex flex-col gap-2.5 min-h-0">
          <div className="flex-1 rounded-[var(--radius-2xl)] border border-border bg-card overflow-hidden flex flex-col">
            <div className="px-4 py-3 shrink-0 border-b border-border">
              <h2 className="text-base font-bold text-foreground">Detalhes do Contrato</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  ))}
                </div>
              ) : solicitacao ? (
                <div className="space-y-4">
                  {/* Imagem + codigo */}
                  <div className="flex items-center gap-3">
                    {solicitacao.commodity_imagem_url ? (
                      <img
                        src={solicitacao.commodity_imagem_url}
                        alt={solicitacao.commodity_nome}
                        className="w-12 h-12 rounded-[var(--radius-md)] object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-[var(--radius-md)] bg-muted flex items-center justify-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase">
                          {solicitacao.commodity_codigo.slice(0, 3)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {solicitacao.commodity_codigo}
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {solicitacao.commodity_moeda}{" "}
                        {Number(solicitacao.preco_mercado_atual).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          {solicitacao.commodity_unidade}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Detalhes em linha */}
                  {[
                    { label: "Commodity", value: solicitacao.commodity_nome },
                    { label: "Tipo de Derivativo", value: solicitacao.tipo_derivativo_nome },
                    { label: "Rotulo", value: solicitacao.tipo_derivativo_rotulo },
                    ...(mesLabel ? [{ label: "Mes do Contrato", value: mesLabel }] : []),
                    ...(solicitacao.posicao ? [{ label: "Posicao", value: solicitacao.posicao === "comprador" ? "Comprador" : "Vendedor" }] : []),
                    ...(solicitacao.nivel_barreira !== null && solicitacao.nivel_barreira !== undefined
                      ? [{ label: "Nivel de Barreira", value: String(solicitacao.nivel_barreira) }]
                      : []),
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                        {label}
                      </p>
                      <p className="text-sm font-semibold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* Placeholder inferior */}
          <div
            className="rounded-[var(--radius-2xl)] border border-border bg-card shrink-0"
            style={{ height: "calc((100vh - 120px) / 3 - 10px)" }}
          />
        </div>
      </div>
    </div>
  );
}
