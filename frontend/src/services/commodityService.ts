import { apiFetch } from "@/services/authService"
import { API_BASE_URL } from "@/config/apiConfig"

export interface ExportIndexSeries {
  commodity_id: number
  nome: string
  codigo: string
  data_key: string
  color_key: string
  imagem_url?: string | null
}

export interface ExportIndexStat {
  label: string
  value: string
  variant: "success" | "destructive" | "default"
}

export interface ExportIndexData {
  chart_data: Array<Record<string, string | number | null>>
  series: ExportIndexSeries[]
  stats: ExportIndexStat[]
}

export interface UserCommodity {
  id: number
  codigo: string
  nome: string
  moeda: string
  unidade: string
  preco_atual: number | null
  data_preco_atual: string | null
  qualidade_preco_atual: string | null
}

export async function fetchIndiceExportacao(): Promise<ExportIndexData> {
  const res = await apiFetch(`${API_BASE_URL}/api/v1/dados/indice_exportacao/`)
  if (!res.ok) throw new Error("Falha ao buscar indice de exportacao")
  return res.json()
}
