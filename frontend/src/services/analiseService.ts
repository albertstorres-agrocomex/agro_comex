import { apiFetch } from "./authService";

export type SolicitacaoStatus = "aguardando" | "processando" | "concluido" | "erro" | "aprovado" | "rejeitado";

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

export interface CenarioAnaliseData {
  id: number;
  nome: "conservador" | "moderado" | "agressivo" | "proposto";
  fator: string | null;
  preco_exercicio: number;
  premio: number;
  valor_total: number | null;
  ponto_equilibrio: number;
  nivel_risco: "baixo" | "medio" | "alto" | null;
  e_recomendado: boolean;
  escolhido_pelo_usuario: boolean;
  escolhido_em: string | null;
  pontos_curva: { preco: number; resultado: number }[];
}

export interface ResultadoAnaliseData {
  id: number;
  solicitacao: number;
  premio_calculado: number | null;
  percentual_premio: string | null;
  valor_total_contrato: number | null;
  lucro_maximo: number | null;
  volatilidade_utilizada: string | null;
  taxa_juros_utilizada: string | null;
  d1: string | null;
  d2: string | null;
  calculado_em: string;
  cenarios: CenarioAnaliseData[];
}

export interface SolicitacaoPaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SolicitacaoAnaliseData[];
}

export interface SolicitacaoStatusCount {
  avaliacao: number;
  aprovado: number;
  rejeitado: number;
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
  mes_contrato: number;
  preco_exercicio: number;
  quantidade: number;
  unidade_quantidade: "sacas" | "toneladas";
  posicao?: "comprador" | "vendedor" | null;
  nivel_barreira?: number | null;
  barreira_tipo?: "knock_in" | "knock_out" | null;
}

const BASE = "/api/v1";

export async function fetchSolicitacoes(
  page = 1,
  status?: SolicitacaoStatus | "todos"
): Promise<SolicitacaoPaginatedResponse> {
  const params = new URLSearchParams({ page: String(page) });
  if (status && status !== "todos") params.set("status", status);
  const res = await apiFetch(`${BASE}/solicitacao_analise/?${params}`);
  if (!res.ok) throw new Error(`Erro ao buscar solicitacoes (${res.status})`);
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

export async function escolherCenario(cenarioId: number): Promise<CenarioAnaliseData> {
  const res = await apiFetch(`${BASE}/cenarios/${cenarioId}/escolher/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ escolhido_pelo_usuario: true }),
  });
  if (!res.ok) throw new Error("Erro ao escolher cenario");
  return res.json();
}

export async function avaliarSolicitacao(
  id: number,
  novoStatus: "aprovado" | "rejeitado"
): Promise<SolicitacaoAnaliseData> {
  const res = await apiFetch(`${BASE}/solicitacao_analise/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: novoStatus }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error("Erro ao avaliar solicitacao"), { detail: err });
  }
  return res.json();
}
