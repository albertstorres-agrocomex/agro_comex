"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { TopMenu } from "@/components/system/layout/TopMenu";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  fetchAnalise,
  aprovarAnalise,
  reprovarAnalise,
  type AnaliseData,
} from "@/services/analiseService";

const STATUS_CONFIG = {
  aprovado: { label: "Aprovado", variant: "success" as const },
  pendente: { label: "Pendente", variant: "warning" as const },
  rejeitado: { label: "Rejeitado", variant: "destructive" as const },
  em_analise: { label: "Em Analise", variant: "info" as const },
};

export default function AnaliseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading, logout } = useAuth();

  const [analise, setAnalise] = useState<AnaliseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
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
    fetchAnalise(id)
      .then(setAnalise)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [isAuthenticated, isLoading, router, params.id]);

  async function handleAprovar() {
    if (!analise) return;
    setActionLoading(true);
    try {
      const updated = await aprovarAnalise(analise.id);
      setAnalise(updated);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReprovar() {
    if (!analise) return;
    setActionLoading(true);
    try {
      const updated = await reprovarAnalise(analise.id);
      setAnalise(updated);
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  const cfg = analise ? STATUS_CONFIG[analise.status] : null;

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
            ) : analise ? (
              <>
                <h1 className="text-base font-bold text-foreground truncate flex-1">
                  {analise.title}
                </h1>
                {cfg && (
                  <Badge
                    variant="secondary"
                    style={{
                      background: `var(--${analise.status === "aprovado" ? "success" : analise.status === "rejeitado" ? "destructive" : analise.status === "em_analise" ? "info" : "warning"})`,
                      color: `var(--${analise.status === "aprovado" ? "success" : analise.status === "rejeitado" ? "destructive" : analise.status === "em_analise" ? "info" : "warning"}-foreground)`,
                    }}
                    className="text-[10px] px-1.5 py-0 h-[18px] font-semibold shrink-0"
                  >
                    {cfg.label}
                  </Badge>
                )}
              </>
            ) : (
              <h1 className="text-base font-bold text-foreground">Analise nao encontrada</h1>
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
              <p className="text-sm text-muted-foreground">Analise nao encontrada.</p>
            ) : analise ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Solicitada {analise.time_ago} atras
                </p>

                {analise.resultado ? (
                  <div className="rounded-[var(--radius-xl)] border border-border bg-background p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Resultado da Analise</h3>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {analise.resultado}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[var(--radius-xl)] border border-border bg-muted/40 p-4">
                    <p className="text-sm text-muted-foreground">
                      Aguardando processamento...
                    </p>
                  </div>
                )}

                {/* Botoes de acao */}
                {analise.status === "em_analise" && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleAprovar}
                      disabled={actionLoading}
                      className="bg-accent text-accent-foreground px-5 py-2 rounded-full text-sm font-semibold hover:brightness-105 transition-all disabled:opacity-50"
                    >
                      {actionLoading ? "Aguarde..." : "Aprovar"}
                    </button>
                    <button
                      onClick={handleReprovar}
                      disabled={actionLoading}
                      className="bg-destructive text-destructive-foreground px-5 py-2 rounded-full text-sm font-semibold hover:brightness-105 transition-all disabled:opacity-50"
                    >
                      {actionLoading ? "Aguarde..." : "Reprovar"}
                    </button>
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
              ) : analise ? (
                <div className="space-y-4">
                  {/* Imagem + codigo */}
                  <div className="flex items-center gap-3">
                    {analise.commodity_image_url ? (
                      <img
                        src={analise.commodity_image_url}
                        alt={analise.commodity_code}
                        className="w-12 h-12 rounded-[var(--radius-md)] object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-[var(--radius-md)] bg-muted flex items-center justify-center">
                        <span className="text-xs font-bold text-muted-foreground uppercase">
                          {analise.commodity_code.slice(0, 3)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {analise.commodity_code}
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {analise.sale_price_currency}{" "}
                        {Number(analise.sale_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          {analise.sale_price_unit}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Detalhes em linha */}
                  {[
                    { label: "Tipo de Contrato", value: analise.contract_type },
                    { label: "Ano de Vencimento", value: String(analise.expiry_year) },
                    {
                      label: "Quantidade",
                      value: analise.quantidade_toneladas
                        ? `${Number(analise.quantidade_toneladas).toLocaleString("pt-BR")} t`
                        : "—",
                    },
                    { label: "Valor Total", value: analise.total_contract_value || "—" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                        {label}
                      </p>
                      <p className="text-sm font-semibold text-foreground">{value}</p>
                    </div>
                  ))}

                  {/* Pais */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                      Pais de Referencia
                    </p>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">{analise.country}</p>
                    </div>
                  </div>
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
