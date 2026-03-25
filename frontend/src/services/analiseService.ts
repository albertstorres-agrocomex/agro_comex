import { apiFetch } from "./authService";

export type SolicitacaoStatus = "aguardando" | "processando" | "concluido" | "erro";

export interface SolicitacaoAnaliseData {
  id: number;
  status: SolicitacaoStatus;
  preco_mercado_atual: number;
  posicao: "comprador" | "vendedor" | null;
  nivel_barreira: number | null;
  id_tarefa_worker: string | null;
  criado_em: string;
  // commodity
  commodity: number;
  commodity_nome: string;
  commodity_codigo: string;
  commodity_moeda: string;
  commodity_unidade: string;
  commodity_imagem_url: string | null;
  // tipo derivativo
  tipo_derivativo: number;
  tipo_derivativo_nome: string;
  tipo_derivativo_rotulo: string;
  // mes contrato
  mes_contrato: number | null;
  mes_contrato_codigo: string | null;
  mes_contrato_ano: number | null;
  mes_contrato_vencimento: string | null;
  mes_contrato_ticket: string | null;
  // resultado (presente apenas quando status=concluido)
  resultado?: ResultadoAnaliseData;
}

export interface ResultadoAnaliseData {
  id: number;
  nivel_acumulacao: number | null;
  volatilidade_utilizada: string | null;
  taxa_juros_utilizada: string | null;
  dados_brutos: Record<string, unknown> | null;
  calculado_em: string;
}

export interface SolicitacaoPaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SolicitacaoAnaliseData[];
}

export interface SolicitacaoStatusCount {
  aguardando: number;
  processando: number;
  concluido: number;
  erro: number;
  total: number;
}

export interface TipoDerivativo {
  id: number;
  nome: string;
  rotulo: string;
  descricao: string | null;
  requer_barreira: boolean;
  requer_posicao: boolean;
  posicao_implicita: "comprador" | "vendedor" | null;
}

export interface MesContrato {
  id: number;
  commodity: number;
  codigo_mes: string;
  ano: number;
  data_vencimento: string;
  ticket_completo: string | null;
  ativo: boolean;
}

export interface SolicitacaoCreatePayload {
  commodity: number;
  tipo_derivativo: number;
  mes_contrato?: number | null;
  posicao?: "comprador" | "vendedor" | null;
  nivel_barreira?: number | null;
}

const BASE = "/api/v1";

export async function fetchSolicitacoes(
  page = 1,
  status?: SolicitacaoStatus | "todos"
): Promise<SolicitacaoPaginatedResponse> {
  const params = new URLSearchParams({ page: String(page) });
  if (status && status !== "todos") params.set("status", status);
  const res = await apiFetch(`${BASE}/solicitacao_analise/?${params}`);
  if (!res.ok) throw new Error("Erro ao buscar solicitacoes");
  return res.json();
}

export async function fetchSolicitacao(id: number): Promise<SolicitacaoAnaliseData> {
  const res = await apiFetch(`${BASE}/solicitacao_analise/${id}/`);
  if (!res.ok) throw new Error("Solicitacao nao encontrada");
  return res.json();
}

export async function fetchSolicitacaoStatusCount(): Promise<SolicitacaoStatusCount> {
  const res = await apiFetch(`${BASE}/solicitacao_analise/status-count/`);
  if (!res.ok) throw new Error("Erro ao buscar contagem de status");
  return res.json();
}

export async function createSolicitacao(
  payload: SolicitacaoCreatePayload
): Promise<SolicitacaoAnaliseData> {
  const res = await apiFetch(`${BASE}/solicitacao_analise/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error("Erro ao criar solicitacao"), { detail: err });
  }
  return res.json();
}

export async function fetchTiposDerivativo(): Promise<TipoDerivativo[]> {
  const res = await apiFetch(`${BASE}/tipos_derivativo/`);
  if (!res.ok) throw new Error("Erro ao buscar tipos de derivativo");
  const data = await res.json();
  return data.results ?? data;
}

export async function fetchMesesContrato(commodityId: number): Promise<MesContrato[]> {
  const res = await apiFetch(`${BASE}/meses_contrato_futuro/?commodity_id=${commodityId}`);
  if (!res.ok) throw new Error("Erro ao buscar meses de contrato");
  const data = await res.json();
  return data.results ?? data;
}
