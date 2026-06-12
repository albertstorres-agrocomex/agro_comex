"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { TopMenu } from "@/components/system/layout/TopMenu";
import { AnaliseCard } from "@/components/system/analise/AnaliseCard";
import { AnaliseStatusPieChart } from "@/components/system/analise/AnaliseStatusPieChart";
import { NovaAnaliseModal } from "@/components/system/analise/NovaAnaliseModal";
import {
  fetchSolicitacoes,
  fetchSolicitacaoStatusCount,
  type SolicitacaoAnaliseData,
  type SolicitacaoStatus,
  type SolicitacaoStatusCount,
} from "@/services/analiseService";
import { apiFetch } from "@/services/authService";

const STATUS_TABS: { key: "todos" | SolicitacaoStatus; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "aguardando", label: "Aguardando" },
  { key: "processando", label: "Processando" },
  { key: "concluido", label: "Concluido" },
  { key: "erro", label: "Erro" },
];

interface CommodityOption {
  id: number;
  codigo: string;
  nome: string;
  preco_atual?: string | null;
  moeda: string;
  unidade: string;
}

export default function AnalisesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();

  const [analises, setAnalises] = useState<SolicitacaoAnaliseData[]>([]);
  const [statusCount, setStatusCount] = useState<SolicitacaoStatusCount | null>(null);
  const [commodities, setCommodities] = useState<CommodityOption[]>([]);
  const [activeTab, setActiveTab] = useState<"todos" | SolicitacaoStatus>("todos");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const PAGE_SIZE = 6;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  const loadAnalises = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchSolicitacoes(page, activeTab);
      setAnalises(data.results);
      setTotalCount(data.count);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Erro ao carregar analises");
    } finally {
      setLoading(false);
    }
  }, [page, activeTab]);

  const loadStatusCount = useCallback(async () => {
    try {
      const data = await fetchSolicitacaoStatusCount();
      setStatusCount(data);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
      return;
    }
    if (!isAuthenticated) return;
    loadAnalises();
    loadStatusCount();
  }, [isLoading, isAuthenticated, router, loadAnalises, loadStatusCount]);

  useEffect(() => {
    if (!isAuthenticated) return;
    apiFetch("/api/v1/usuario/commodities/")
      .then((r) => r.json())
      .then((data) => setCommodities(data.commodities ?? data))
      .catch(() => {});
  }, [isAuthenticated]);

  function handleTabChange(tab: "todos" | SolicitacaoStatus) {
    setActiveTab(tab);
    setPage(1);
  }

  function handleCreated() {
    setPage(1);
    loadAnalises();
    loadStatusCount();
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-foreground/60">Carregando...</p>
      </main>
    );
  }

  if (!isAuthenticated) return null;

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
        {/* Coluna esquerda */}
        <div className="flex flex-col min-h-0 rounded-[var(--radius-2xl)] bg-background overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <h1 className="text-base font-bold text-foreground">Suas Analises</h1>
            {loadError && (
              <span className="text-xs text-destructive font-medium">{loadError}</span>
            )}
            <button
              onClick={() => setModalOpen(true)}
              className="bg-info text-info-foreground px-4 py-2 rounded-full text-sm font-semibold hover:brightness-105 transition-all"
            >
              + Nova Analise
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 py-2 shrink-0 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                  activeTab === tab.key
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto px-3">
            {loading ? (
              <p className="text-sm text-muted-foreground px-1 py-4">Carregando...</p>
            ) : analises.length === 0 ? (
              <p className="text-sm text-muted-foreground px-1 py-4">Nenhuma analise encontrada.</p>
            ) : (
              analises.map((a) => <AnaliseCard key={a.id} analise={a} />)
            )}
          </div>

          {/* Paginacao */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 shrink-0 border-t border-border">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-opacity"
              >
                Anterior
              </button>
              <span className="text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-opacity"
              >
                Proxima
              </button>
            </div>
          )}
        </div>

        {/* Coluna direita */}
        <div className="flex flex-col gap-2.5 min-h-0">
          {/* Grafico de status */}
          <div className="flex-1 rounded-[var(--radius-2xl)] bg-background overflow-hidden flex flex-col">
            <div className="px-4 py-3 shrink-0">
              <h2 className="text-base font-bold text-foreground">Distribuicao</h2>
            </div>
            <div className="flex-1 p-4">
              {statusCount ? (
                <AnaliseStatusPieChart counts={statusCount} />
              ) : (
                <div className="h-full animate-pulse bg-muted rounded-[var(--radius-xl)]" />
              )}
            </div>
          </div>

          {/* Placeholder inferior */}
          <div
            className="rounded-[var(--radius-2xl)] bg-background shrink-0"
            style={{ height: "calc((100vh - 120px) / 3 - 10px)" }}
          />
        </div>
      </div>

      <NovaAnaliseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
        commodities={commodities}
      />
    </div>
  );
}
