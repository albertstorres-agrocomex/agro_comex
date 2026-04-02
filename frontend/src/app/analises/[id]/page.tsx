"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { TopMenu } from "@/components/system/layout/TopMenu";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  TrendingUp,
  Star,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  fetchSolicitacao,
  avaliarSolicitacao,
  escolherCenario,
  type SolicitacaoAnaliseData,
  type CenarioAnaliseData,
} from "@/services/analiseService";

// --- Status config ---
const STATUS_CONFIG = {
  aguardando: { label: "Aguardando", bg: "var(--warning)", fg: "var(--warning-foreground)" },
  processando: { label: "Processando", bg: "var(--info)", fg: "var(--info-foreground)" },
  concluido: { label: "Concluido", bg: "var(--success)", fg: "var(--success-foreground)" },
  erro: { label: "Erro", bg: "var(--destructive)", fg: "var(--destructive-foreground)" },
  aprovado: { label: "Aprovado", bg: "var(--success)", fg: "var(--success-foreground)" },
  rejeitado: { label: "Rejeitado", bg: "var(--destructive)", fg: "var(--destructive-foreground)" },
};

// --- Scenario visual config ---
const CENARIO_CONFIG = {
  conservador: {
    label: "Conservador",
    riskLabel: "Baixo Risco",
    headerBg: "var(--success)",
    headerFg: "var(--success-foreground)",
    chartStroke: "#2d7a42",
    borderFocus: "var(--success)",
  },
  moderado: {
    label: "Moderado",
    riskLabel: "Medio Risco",
    headerBg: "var(--warning)",
    headerFg: "var(--warning-foreground)",
    chartStroke: "#b87a10",
    borderFocus: "var(--warning)",
  },
  agressivo: {
    label: "Agressivo",
    riskLabel: "Alto Risco",
    headerBg: "var(--chart-4)",
    headerFg: "#fff",
    chartStroke: "#6d30c7",
    borderFocus: "var(--chart-4)",
  },
} as const;

// --- Formatters ---
function fmtMoeda(value: number, moeda = "R$", decimals = 2) {
  return `${moeda} ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function fmtPct(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

// --- MetricStat: card de metrica no strip superior ---
function MetricStat({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-border bg-card px-4 py-3 flex-1 min-w-[140px]">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </p>
      <p
        className="text-base font-bold text-foreground truncate"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      )}
    </div>
  );
}

// --- MetricRow: linha de dado dentro de card ---
function MetricRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
        {label}
      </p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

// --- CenarioCard ---
function CenarioCard({
  cenario,
  precoMercado,
  moeda,
  podeEscolher,
  escolhendo,
  onEscolher,
  configOverride,
}: {
  cenario: CenarioAnaliseData;
  precoMercado: number;
  moeda: string;
  podeEscolher: boolean;
  escolhendo: number | null;
  onEscolher: (id: number) => void;
  configOverride?: (typeof CENARIO_CONFIG)[keyof typeof CENARIO_CONFIG];
}) {
  const cfg =
    configOverride ?? CENARIO_CONFIG[cenario.nome as keyof typeof CENARIO_CONFIG];
  const varPct = ((cenario.preco_exercicio - precoMercado) / precoMercado) * 100;
  const premPct = (cenario.premio / cenario.preco_exercicio) * 100;
  const maxGanho =
    cenario.pontos_curva.length > 0
      ? Math.max(...cenario.pontos_curva.map((p) => p.resultado))
      : null;
  const isChosen = cenario.escolhido_pelo_usuario;

  const outlineStyle = isChosen
    ? { outline: "2px solid var(--accent)", outlineOffset: "2px" }
    : cenario.e_recomendado
    ? { outline: "1.5px solid var(--success)", outlineOffset: "1px" }
    : {};

  return (
    <div
      className="rounded-[var(--radius-2xl)] border border-border bg-card overflow-hidden flex flex-col"
      style={outlineStyle}
    >
      {/* Header colorido */}
      <div
        style={{ background: cfg.headerBg, color: cfg.headerFg }}
        className={`px-4 py-3${cenario.nome === "proposto" ? " opacity-80" : ""}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-bold">{cfg.label}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70 mt-0.5">
              {cfg.riskLabel}
              {cenario.fator ? ` · Fator ${cenario.fator}` : ""}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {cenario.e_recomendado && (
              <span
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.25)" }}
              >
                <Star size={10} />
                Recomendado
              </span>
            )}
            {cenario.nome === "proposto" && (
              <span
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.25)" }}
              >
                Seu Cenario
              </span>
            )}
            {isChosen && (
              <span
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: "var(--accent)",
                  color: "var(--accent-foreground)",
                }}
              >
                <CheckCircle size={10} />
                Escolhido
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metricas */}
      <div className="p-4 flex-1 space-y-3.5">
        <MetricRow
          label="Preco de Exercicio"
          value={fmtMoeda(cenario.preco_exercicio, moeda)}
          sub={`${fmtPct(varPct)} em relacao ao preco de mercado`}
        />
        <MetricRow
          label="Premio por Saca"
          value={fmtMoeda(cenario.premio, moeda)}
          sub={`${premPct.toFixed(2)}% do preco de exercicio`}
        />
        {cenario.valor_total !== null && (
          <MetricRow
            label="Custo Total do Hedging"
            value={fmtMoeda(cenario.valor_total, moeda)}
          />
        )}
        <MetricRow
          label="Ponto de Equilibrio"
          value={fmtMoeda(cenario.ponto_equilibrio, moeda)}
          sub="Preco a partir do qual ha ganho liquido"
        />

        {/* Ganho maximo estimado da curva */}
        {maxGanho !== null && maxGanho > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 mb-0.5">
              <TrendingUp size={12} style={{ color: "var(--success)" }} />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Ganho Maximo Estimado
              </p>
            </div>
            <p
              className="text-sm font-bold"
              style={{ color: "var(--success)" }}
            >
              {fmtMoeda(maxGanho, moeda)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Resultado liquido no vencimento do contrato
            </p>
          </div>
        )}
      </div>

      {/* Acao */}
      <div className="px-4 pb-4">
        {isChosen ? (
          <div
            className="w-full text-center text-sm font-bold py-2.5 rounded-[var(--radius-md)]"
            style={{
              background: "var(--accent)",
              color: "var(--accent-foreground)",
            }}
          >
            Cenario Selecionado
          </div>
        ) : podeEscolher ? (
          <button
            onClick={() => onEscolher(cenario.id)}
            disabled={!!escolhendo}
            className="w-full text-sm font-bold py-2.5 rounded-[var(--radius-md)] transition-opacity"
            style={{
              background: cfg.headerBg,
              color: cfg.headerFg,
              opacity: escolhendo ? 0.55 : 1,
              cursor: escolhendo ? "not-allowed" : "pointer",
            }}
          >
            {escolhendo === cenario.id
              ? "Processando..."
              : "Selecionar este cenario"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

// --- Pagina principal ---
export default function AnaliseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading, logout } = useAuth();

  const [solicitacao, setSolicitacao] =
    useState<SolicitacaoAnaliseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [avaliando, setAvaliando] = useState<"aprovado" | "rejeitado" | null>(
    null
  );
  const [escolhendo, setEscolhendo] = useState<number | null>(null);

  async function handleAvaliar(novoStatus: "aprovado" | "rejeitado") {
    if (!solicitacao || avaliando) return;
    setAvaliando(novoStatus);
    try {
      const updated = await avaliarSolicitacao(solicitacao.id, novoStatus);
      setSolicitacao(updated);
    } finally {
      setAvaliando(null);
    }
  }

  async function handleEscolherCenario(cenarioId: number) {
    if (!solicitacao || escolhendo) return;
    setEscolhendo(cenarioId);
    try {
      await escolherCenario(cenarioId);
      const updated = await fetchSolicitacao(solicitacao.id);
      setSolicitacao(updated);
    } finally {
      setEscolhendo(null);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push("/");
      return;
    }
    const id = Number(params.id);
    if (isNaN(id)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    fetchSolicitacao(id)
      .then(setSolicitacao)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [isAuthenticated, isLoading, router, params.id]);

  // Monta dados da curva P&L unificada para o grafico
  const chartData = useMemo(() => {
    const cenarios = solicitacao?.resultado?.cenarios;
    if (!cenarios?.length) return [];
    const base = cenarios[0].pontos_curva;
    return base.map((_, i) => {
      const row: Record<string, number> = {};
      for (const c of cenarios) {
        const pt = c.pontos_curva[i];
        if (pt) {
          row.preco = pt.preco;
          row[c.nome] = pt.resultado;
        }
      }
      return row;
    });
  }, [solicitacao?.resultado]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  const statusCfg = solicitacao ? STATUS_CONFIG[solicitacao.status] : null;
  const resultado = solicitacao?.resultado;
  const cenarios = useMemo(
    () => [...(resultado?.cenarios ?? [])].sort(
      (a, b) => a.preco_exercicio - b.preco_exercicio
    ),
    [resultado?.cenarios]
  );
  const moeda = solicitacao?.commodity_moeda ?? "R$";
  const podeEscolher = solicitacao?.status === "concluido";

  const propostoCfg = useMemo(() => {
    const proposto = cenarios.find((c) => c.nome === "proposto");
    if (!proposto) return null;
    const fixos = cenarios.filter((c) => c.nome !== "proposto");
    if (fixos.length === 0) return null;
    const closest = fixos.reduce((prev, curr) =>
      Math.abs(curr.preco_exercicio - proposto.preco_exercicio) <
      Math.abs(prev.preco_exercicio - proposto.preco_exercicio)
        ? curr
        : prev
    );
    return CENARIO_CONFIG[closest.nome as keyof typeof CENARIO_CONFIG];
  }, [cenarios]);

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
    <div className="min-h-screen bg-background">
      <TopMenu onLogout={handleLogout} />

      <div
        className="px-5 pb-8"
        style={{ paddingTop: "calc(80px + 20px)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Link
            href="/analises"
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft size={16} />
          </Link>

          {loading ? (
            <div className="h-6 w-64 bg-muted rounded animate-pulse" />
          ) : solicitacao ? (
            <>
              <h1 className="text-lg font-bold text-foreground flex-1 truncate">
                {title}
              </h1>
              {statusCfg && (
                <Badge
                  variant="secondary"
                  style={{
                    background: statusCfg.bg,
                    color: statusCfg.fg,
                  }}
                  className="text-[10px] px-2 py-0.5 font-semibold shrink-0"
                >
                  {statusCfg.label}
                </Badge>
              )}
              {solicitacao.status === "concluido" && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAvaliar("aprovado")}
                    disabled={!!avaliando}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-[var(--radius-sm)] transition-opacity"
                    style={{
                      background: "var(--success)",
                      color: "var(--success-foreground)",
                      opacity: avaliando ? 0.6 : 1,
                      cursor: avaliando ? "not-allowed" : "pointer",
                    }}
                  >
                    <CheckCircle size={12} />
                    {avaliando === "aprovado" ? "Aprovando..." : "Aprovar"}
                  </button>
                  <button
                    onClick={() => handleAvaliar("rejeitado")}
                    disabled={!!avaliando}
                    className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-[var(--radius-sm)] transition-opacity"
                    style={{
                      background: "var(--destructive)",
                      color: "var(--destructive-foreground)",
                      opacity: avaliando ? 0.6 : 1,
                      cursor: avaliando ? "not-allowed" : "pointer",
                    }}
                  >
                    <XCircle size={12} />
                    {avaliando === "rejeitado" ? "Rejeitando..." : "Rejeitar"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <h1 className="text-lg font-bold text-foreground">
              Solicitacao nao encontrada
            </h1>
          )}
        </div>

        {/* Strip de metricas de contexto */}
        {resultado && solicitacao && (
          <div className="flex gap-3 mb-5 overflow-x-auto pb-1">
            <MetricStat
              label="Preco de Mercado"
              value={fmtMoeda(solicitacao.preco_mercado_atual, moeda)}
              sub={`${solicitacao.commodity_unidade}`}
            />
            {resultado.volatilidade_utilizada && (
              <MetricStat
                label="Volatilidade Historica"
                value={resultado.volatilidade_utilizada}
                sub="Anualizada — base do calculo"
              />
            )}
            {resultado.taxa_juros_utilizada && (
              <MetricStat
                label="Taxa SELIC"
                value={resultado.taxa_juros_utilizada}
                sub="Taxa de juros livre de risco"
              />
            )}
            {resultado.valor_total_contrato !== null && (
              <MetricStat
                label="Valor Total do Contrato"
                value={fmtMoeda(resultado.valor_total_contrato, moeda)}
              />
            )}
            {resultado.lucro_maximo !== null && (
              <MetricStat
                label="Lucro Maximo"
                value={fmtMoeda(resultado.lucro_maximo, moeda)}
                valueColor="var(--success)"
              />
            )}
            {resultado.percentual_premio && (
              <MetricStat
                label="Percentual do Premio"
                value={resultado.percentual_premio}
                sub="Premio sobre preco de exercicio"
              />
            )}
          </div>
        )}

        {/* Estado de carregamento */}
        {loading && (
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 280px" }}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 rounded-[var(--radius-2xl)] bg-muted animate-pulse"
              />
            ))}
            <div className="h-80 rounded-[var(--radius-2xl)] bg-muted animate-pulse" />
          </div>
        )}

        {/* Nao encontrado */}
        {notFound && (
          <p className="text-sm text-muted-foreground">
            Solicitacao nao encontrada.
          </p>
        )}

        {/* Status sem resultado ainda */}
        {solicitacao && !resultado && !loading && (
          <div className="rounded-[var(--radius-2xl)] border border-border bg-card p-10 text-center">
            <p className="text-sm text-muted-foreground">
              {solicitacao.status === "aguardando" &&
                "Aguardando processamento da analise..."}
              {solicitacao.status === "processando" &&
                "Calculando cenarios com o modelo Black-Scholes..."}
              {solicitacao.status === "erro" &&
                "Ocorreu um erro ao processar esta analise."}
              {solicitacao.status === "rejeitado" &&
                "Esta analise foi rejeitada."}
            </p>
          </div>
        )}

        {/* Conteudo principal: cenarios + detalhes do contrato */}
        {solicitacao && resultado && !loading && (
          <>
            <div
              className="grid gap-4 mb-5"
              style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 280px" }}
            >
              {/* Cards dos 3 cenarios */}
              {cenarios.map((cenario) => (
                <CenarioCard
                  key={cenario.id}
                  cenario={cenario}
                  precoMercado={solicitacao.preco_mercado_atual}
                  moeda={moeda}
                  podeEscolher={podeEscolher}
                  escolhendo={escolhendo}
                  onEscolher={handleEscolherCenario}
                  configOverride={
                    cenario.nome === "proposto" ? propostoCfg ?? undefined : undefined
                  }
                />
              ))}

              {/* Sidebar: detalhes do contrato */}
              <div className="rounded-[var(--radius-2xl)] border border-border bg-card overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-border shrink-0">
                  <h2 className="text-sm font-bold text-foreground">
                    Detalhes do Contrato
                  </h2>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                  <div className="flex items-center gap-3">
                    {solicitacao.commodity_imagem_url ? (
                      <img
                        src={solicitacao.commodity_imagem_url}
                        alt={solicitacao.commodity_nome}
                        className="w-12 h-12 rounded-[var(--radius-md)] object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-[var(--radius-md)] bg-muted flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-muted-foreground uppercase">
                          {solicitacao.commodity_codigo.slice(0, 3)}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {solicitacao.commodity_codigo}
                      </p>
                      <p className="text-sm font-bold text-foreground">
                        {fmtMoeda(solicitacao.preco_mercado_atual, moeda)}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          {solicitacao.commodity_unidade}
                        </span>
                      </p>
                    </div>
                  </div>

                  {[
                    {
                      label: "Commodity",
                      value: solicitacao.commodity_nome,
                    },
                    {
                      label: "Tipo de Derivativo",
                      value: solicitacao.tipo_derivativo_nome,
                    },
                    {
                      label: "Rotulo",
                      value: solicitacao.tipo_derivativo_rotulo,
                    },
                    ...(mesLabel
                      ? [{ label: "Mes do Contrato", value: mesLabel }]
                      : []),
                    ...(solicitacao.mes_contrato_vencimento
                      ? [
                          {
                            label: "Vencimento",
                            value: new Date(
                              solicitacao.mes_contrato_vencimento
                            ).toLocaleDateString("pt-BR"),
                          },
                        ]
                      : []),
                    ...(solicitacao.posicao
                      ? [
                          {
                            label: "Posicao",
                            value:
                              solicitacao.posicao === "comprador"
                                ? "Comprador"
                                : "Vendedor",
                          },
                        ]
                      : []),
                    ...(solicitacao.nivel_barreira != null
                      ? [
                          {
                            label: "Nivel de Barreira",
                            value: String(solicitacao.nivel_barreira),
                          },
                        ]
                      : []),
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                        {label}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {value}
                      </p>
                    </div>
                  ))}

                  <div className="pt-3 border-t border-border">
                    <p className="text-[10px] text-muted-foreground">
                      Calculado em{" "}
                      {new Date(resultado.calculado_em).toLocaleDateString(
                        "pt-BR",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grafico: Curva de Resultado P&L */}
            {chartData.length > 0 && (
              <div className="rounded-[var(--radius-2xl)] border border-border bg-card p-5">
                <h3 className="text-sm font-bold text-foreground mb-1">
                  Curva de Resultado por Cenario
                </h3>
                <p className="text-[11px] text-muted-foreground mb-5">
                  Projecao de lucro/prejuizo por saca em funcao do preco de
                  mercado no vencimento. Linha tracejada vertical = preco atual
                  de mercado. Linha tracejada horizontal = ponto zero (sem
                  ganho/perda).
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={chartData}
                    margin={{ top: 4, right: 20, bottom: 4, left: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="preco"
                      tickFormatter={(v) =>
                        Number(v).toLocaleString("pt-BR", {
                          maximumFractionDigits: 0,
                        })
                      }
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    />
                    <YAxis
                      tickFormatter={(v) =>
                        Number(v).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      }
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                      width={72}
                    />
                    {/* Linha de break-even */}
                    <ReferenceLine
                      y={0}
                      stroke="var(--foreground)"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                    />
                    {/* Preco atual de mercado */}
                    <ReferenceLine
                      x={solicitacao.preco_mercado_atual}
                      stroke="var(--muted-foreground)"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      label={{
                        value: "Mercado",
                        position: "insideTopRight",
                        fontSize: 10,
                        fill: "var(--muted-foreground)",
                      }}
                    />
                    <RechartsTooltip
                      formatter={(value, name) => [
                        fmtMoeda(Number(value), moeda),
                        name === "proposto"
                          ? "Seu Cenario"
                          : (CENARIO_CONFIG[name as keyof typeof CENARIO_CONFIG]?.label ?? name),
                      ]}
                      labelFormatter={(v) =>
                        `Preco: ${fmtMoeda(Number(v), moeda)}`
                      }
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        fontSize: 12,
                        color: "var(--foreground)",
                      }}
                    />
                    <Legend
                      formatter={(name) =>
                        name === "proposto"
                          ? "Seu Cenario"
                          : (CENARIO_CONFIG[name as keyof typeof CENARIO_CONFIG]?.label ?? name)
                      }
                      wrapperStyle={{
                        fontSize: 12,
                        color: "var(--foreground)",
                        paddingTop: 8,
                      }}
                    />
                    {cenarios.map((c) => (
                      <Line
                        key={c.nome}
                        type="monotone"
                        dataKey={c.nome}
                        stroke={
                          c.nome === "proposto"
                            ? "var(--accent)"
                            : CENARIO_CONFIG[c.nome as keyof typeof CENARIO_CONFIG].chartStroke
                        }
                        strokeWidth={2}
                        strokeDasharray={c.nome === "proposto" ? "5 3" : undefined}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
