import { apiFetch } from "./authService";

export type AnaliseStatus = "pendente" | "em_analise" | "aprovado" | "rejeitado";

export interface AnaliseData {
  id: number;
  commodity_code: string;
  title: string;
  status: AnaliseStatus;
  sale_price: string;
  sale_price_currency: string;
  sale_price_unit: string;
  contract_type: string;
  expiry_year: number;
  total_contract_value: string;
  quantidade_toneladas: string | null;
  country: string;
  resultado: string;
  time_ago: string;
  commodity_image_url: string | null;
  created_at?: string;
}

export interface AnalisePaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AnaliseData[];
}

export interface AnaliseStatusCount {
  pendente: number;
  em_analise: number;
  aprovado: number;
  rejeitado: number;
  total: number;
}

export interface AnaliseCreatePayload {
  commodity_code: string;
  title: string;
  sale_price: string;
  sale_price_currency: string;
  sale_price_unit: string;
  contract_type: string;
  expiry_year: number;
  total_contract_value: string;
  quantidade_toneladas: string;
  country: string;
}

const BASE = "/api/v1/dados";

export async function fetchAnalises(
  page = 1,
  status?: AnaliseStatus | "todos"
): Promise<AnalisePaginatedResponse> {
  const params = new URLSearchParams({ page: String(page) });
  if (status && status !== "todos") params.set("status", status);
  const res = await apiFetch(`${BASE}/analises/?${params}`);
  if (!res.ok) throw new Error("Erro ao buscar analises");
  return res.json();
}

export async function fetchAnalise(id: number): Promise<AnaliseData> {
  const res = await apiFetch(`${BASE}/analises/${id}/`);
  if (!res.ok) throw new Error("Analise nao encontrada");
  return res.json();
}

export async function fetchAnaliseStatusCount(): Promise<AnaliseStatusCount> {
  const res = await apiFetch(`${BASE}/analises/status-count/`);
  if (!res.ok) throw new Error("Erro ao buscar contagem de status");
  return res.json();
}

export async function createAnalise(
  payload: AnaliseCreatePayload
): Promise<AnaliseData> {
  const res = await apiFetch(`${BASE}/analises/create/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Erro ao criar analise");
  return res.json();
}

export async function aprovarAnalise(id: number): Promise<AnaliseData> {
  const res = await apiFetch(`${BASE}/analises/${id}/aprovar/`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Erro ao aprovar analise");
  return res.json();
}

export async function reprovarAnalise(id: number): Promise<AnaliseData> {
  const res = await apiFetch(`${BASE}/analises/${id}/reprovar/`, {
    method: "PATCH",
  });
  if (!res.ok) throw new Error("Erro ao reprovar analise");
  return res.json();
}
