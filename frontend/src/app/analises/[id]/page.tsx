"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { TopMenu } from "@/components/system/layout/TopMenu";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CardSelecaoCenarioAnalise,
  CENARIOS_PADRAO,
  type CenarioConfig,
} from "@/components/CardSelecaoCenarioAnalise";
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

// --- Scenario chart stroke colors ---
const CENARIO_CHART_STROKE: Record<string, string> = {
  conservador: "#2d7a42",
  moderado: "#b87a10",
  agressivo: "#6d30c7",
  proposto: "var(--accent)",
};

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

// --- Map API cenario to CenarioConfig ---
function mapCenarioToConfig(
  c: CenarioAnaliseData,
  moeda: string,
  precoMercado: number
): CenarioConfig {
  const base = CENARIOS_PADRAO.find((p) => p.id === c.nome);
  const varPct = ((c.preco_exercicio - precoMercado) / precoMercado) * 100;
  const premPct = (c.premio / c.preco_exercicio) * 100;
  const maxGanho =
    c.pontos_curva.length > 0
      ? Math.max(...c.pontos_curva.map((p) => p.resultado))
      : null;

  const itens: string[] = [
    `Preco de exercicio: ${fmtMoeda(c.preco_exercicio, moeda)} (${fmtPct(varPct)} vs mercado)`,
    `Premio: ${fmtMoeda(c.premio, moeda)} (${premPct.toFixed(2)}% do exercicio)`,
    `Ponto de equilibrio: ${fmtMoeda(c.ponto_equilibrio, moeda)}`,
    ...(c.valor_total !== null
      ? [`Custo total: ${fmtMoeda(c.valor_total, moeda)}`]
      : []),
    ...(maxGanho !== null && maxGanho > 0
      ? [`Ganho max estimado: ${fmtMoeda(maxGanho, moeda)}`]
      : []),
    ...(c.fator != null ? [`Fator: ${c.fator}`] : []),
  ];

  const badge = c.escolhido_pelo_usuario
    ? "Escolhido"
    : c.e_recomendado
    ? "Recomendado"
    : undefined;

  return {
    id: c.nome,
    label: base?.label ?? c.nome.charAt(0).toUpperCase() + c.nome.slice(1),
    icon: base?.icon,
    subtitulo: base?.subtitulo ?? "Cenario calculado pelo modelo Black-Scholes",
    metricaLabel: "Preco de Exercicio",
    metricaValor: fmtMoeda(c.preco_exercicio, moeda),
    itens,
    featured: c.e_recomendado,
    badge,
  };
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
  const [escolhendo, setEscolhendo] = useState<number | null>(null);
  const [activeCenarios, setActiveCenarios] = useState<Set<string>>(
    () => new Set(["conservador", "moderado", "agressivo", "proposto"])
  );

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

  const cenarios = useMemo(
    () => [...(solicitacao?.resultado?.cenarios ?? [])].sort(
      (a, b) => a.preco_exercicio - b.preco_exercicio
    ),
    [solicitacao?.resultado?.cenarios]
  );

  const configuredCenarios = useMemo(
    () =>
      cenarios.map((c) =>
        mapCenarioToConfig(
          c,
          solicitacao?.commodity_moeda ?? "R$",
          solicitacao?.preco_mercado_atual ?? 0
        )
      ),
    [cenarios, solicitacao?.commodity_moeda, solicitacao?.preco_mercado_atual]
  );

  const cenarioEscolhidoNome = useMemo(
    () => cenarios.find((c) => c.escolhido_pelo_usuario)?.nome,
    [cenarios]
  );

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  const statusCfg = solicitacao ? STATUS_CONFIG[solicitacao.status] : null;
  const resultado = solicitacao?.resultado;
  const moeda = solicitacao?.commodity_moeda ?? "R$";
  const podeEscolher = solicitacao?.status === "concluido";

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/chat?analise_id=${params.id}`)}
                className="gap-2 shrink-0"
              >
                <MessageSquare className="h-4 w-4" />
                Discutir no chat
              </Button>
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
            <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: "1fr 280px" }}>
              {/* Coluna esquerda: cards de cenario */}
              <div className="min-w-0">
                <div className="rounded-[var(--radius-2xl)] mb-4 bg-background pt-6">
                  <CardSelecaoCenarioAnalise
                    key={`${solicitacao.id}-${cenarioEscolhidoNome ?? "none"}`}
                    cenarios={configuredCenarios}
                    defaultSelected={cenarioEscolhidoNome}
                    onCenarioChange={(nome) => {
                      const c = cenarios.find((x) => x.nome === nome);
                      if (c && podeEscolher && !escolhendo) handleEscolherCenario(c.id);
                    }}
                    className="p-6"
                  />
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
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                          dataKey="preco"
                          tickFormatter={(v) =>
                            Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 })
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
                        <ReferenceLine y={0} stroke="var(--foreground)" strokeDasharray="4 4" strokeWidth={1} />
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
                            name === "proposto" ? "Seu Cenario" : (CENARIOS_PADRAO.find((c) => c.id === name)?.label ?? name),
                          ]}
                          labelFormatter={(v) => `Preco: ${fmtMoeda(Number(v), moeda)}`}
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            fontSize: 12,
                            color: "var(--foreground)",
                          }}
                        />
                        {cenarios.map((c) => (
                          activeCenarios.has(c.nome) && (
                            <Line
                              key={c.nome}
                              type="monotone"
                              dataKey={c.nome}
                              stroke={CENARIO_CHART_STROKE[c.nome] ?? "var(--muted-foreground)"}
                              strokeWidth={2}
                              strokeDasharray={c.nome === "proposto" ? "5 3" : undefined}
                              dot={false}
                              activeDot={{ r: 4 }}
                            />
                          )
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                    {/* Legenda interativa */}
                    <div className="flex flex-wrap gap-2 justify-center mt-3">
                      {cenarios.map((c) => {
                        const label =
                          c.nome === "proposto"
                            ? "Seu Cenario"
                            : (CENARIOS_PADRAO.find((p) => p.id === c.nome)?.label ?? c.nome);
                        const stroke = CENARIO_CHART_STROKE[c.nome] ?? "var(--muted-foreground)";
                        const isActive = activeCenarios.has(c.nome);
                        return (
                          <button
                            key={c.nome}
                            onClick={() =>
                              setActiveCenarios((prev) => {
                                const next = new Set(prev);
                                if (next.has(c.nome)) {
                                  next.delete(c.nome);
                                } else {
                                  next.add(c.nome);
                                }
                                return next;
                              })
                            }
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-sm)] text-[11px] font-semibold transition-opacity"
                            style={{
                              border: `1.5px solid ${stroke}`,
                              color: isActive ? stroke : "var(--muted-foreground)",
                              background: isActive ? `color-mix(in srgb, ${stroke} 12%, transparent)` : "transparent",
                              opacity: isActive ? 1 : 0.5,
                              cursor: "pointer",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-block",
                                width: 20,
                                height: 2,
                                background: isActive ? stroke : "var(--muted-foreground)",
                                borderRadius: 1,
                                ...(c.nome === "proposto"
                                  ? { backgroundImage: `repeating-linear-gradient(to right, ${stroke} 0, ${stroke} 4px, transparent 4px, transparent 7px)`, background: "none" }
                                  : {}),
                              }}
                            />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

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

          </>
        )}
      </div>
    </div>
  );
}
