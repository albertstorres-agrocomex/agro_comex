"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { TopMenu } from "@/components/system/layout/TopMenu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/config/apiConfig"
import { apiFetch } from "@/services/authService"
import { Search, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react"
import { CommodityImageCard } from "@/components/system/commodity/CommodityImageCard"

interface Commodity {
  id: number
  nome: string
  bolsa: string
  moeda: string
  ncm?: string
  imagem_url?: string | null
}

interface CommoditiesResponse {
  count: number
  next: string | null
  previous: string | null
  results: Commodity[]
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onChange(!checked)
      }}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        checked ? "bg-primary" : "bg-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )
}

const PAGE_SIZE = 10

export default function CommoditiesPage() {
  const { isAuthenticated, isLoading, logout } = useAuth()
  const router = useRouter()

  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const [isFetching, setIsFetching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const isDirty =
    selectedIds.size !== savedIds.size ||
    [...selectedIds].some((id) => !savedIds.has(id))

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search])

  useEffect(() => {
    if (!isAuthenticated) return
    apiFetch(`${API_BASE_URL}/api/v1/usuario/commodities/`)
      .then((r) => r.json())
      .then((data) => {
        const ids = new Set<number>((data.commodities ?? []).map((c: { id: number }) => c.id))
        setSelectedIds(ids)
        setSavedIds(new Set(ids))
      })
      .finally(() => setInitLoading(false))
  }, [isAuthenticated])

  const loadCommodities = useCallback(() => {
    if (!isAuthenticated) return
    setIsFetching(true)
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(PAGE_SIZE),
    })
    if (debouncedSearch) params.set("search", debouncedSearch)
    apiFetch(`${API_BASE_URL}/api/v1/commodities/?${params}`)
      .then((r) => r.json())
      .then((data: CommoditiesResponse) => {
        setCommodities(data.results ?? [])
        setTotalCount(data.count ?? 0)
      })
      .finally(() => setIsFetching(false))
  }, [isAuthenticated, page, debouncedSearch])

  useEffect(() => {
    loadCommodities()
  }, [loadCommodities])

  function toggleCommodity(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleLogout() {
    await logout()
    router.push("/")
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/v1/usuario/commodities/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commodity_ids: [...selectedIds] }),
      })
      if (res.ok) {
        setSavedIds(new Set(selectedIds))
        setSaveSuccess(true)
        setTimeout(() => router.push("/dashboard"), 1500)
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || initLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-foreground/60">Carregando...</p>
      </main>
    )
  }

  if (!isAuthenticated) return null

  const startItem = (page - 1) * PAGE_SIZE + 1
  const endItem = Math.min(page * PAGE_SIZE, totalCount)

  return (
    <div className="min-h-screen bg-background">
      <TopMenu onLogout={handleLogout} />

      <main className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            Configuracoes
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            Commodities de interesse
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Selecione as commodities que deseja acompanhar no dashboard.
          </p>
        </div>

        {/* Alert: sucesso ao salvar */}
        {saveSuccess && (
          <Alert className="mb-6 border-success/40 bg-success/10">
            <CheckCircle2 className="h-4 w-4" style={{ color: "var(--success-foreground)" }} />
            <AlertDescription className="text-sm" style={{ color: "var(--success-foreground)" }}>
              Selecao salva com sucesso. Redirecionando para o dashboard...
            </AlertDescription>
          </Alert>
        )}

        {/* Alert: nenhuma selecionada */}
        {!saveSuccess && selectedIds.size === 0 && (
          <Alert className="mb-6 border-warning/40 bg-warning/10">
            <AlertCircle className="h-4 w-4" style={{ color: "var(--warning-foreground)" }} />
            <AlertDescription className="text-sm" style={{ color: "var(--warning-foreground)" }}>
              Selecione ao menos uma commodity para continuar para o dashboard.
            </AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar por nome ou bolsa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full pl-9 pr-4 py-2.5 text-sm rounded-[var(--radius-lg)]",
              "bg-card border border-border text-foreground",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
              "transition-colors"
            )}
          />
        </div>

        {/* Result count */}
        {!isFetching && (
          <p className="text-xs text-muted-foreground mb-4">
            {totalCount === 0
              ? "Nenhuma commodity encontrada"
              : `Mostrando ${startItem}–${endItem} de ${totalCount} commodities`}
          </p>
        )}

        {/* Grid */}
        {isFetching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-[var(--radius-xl)] bg-card border border-border animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {commodities.map((commodity) => {
              const isSelected = selectedIds.has(commodity.id)
              return (
                <Card
                  key={commodity.id}
                  className={cn(
                    "transition-all duration-150 cursor-pointer select-none",
                    "border",
                    isSelected
                      ? "border-primary/30"
                      : "border-border"
                  )}
                  onClick={() => toggleCommodity(commodity.id)}
                >
                  <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      {commodity.imagem_url && (
                        <CommodityImageCard
                          src={commodity.imagem_url}
                          alt={commodity.nome}
                          size="sm"
                          className="shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-semibold text-foreground truncate">
                          {commodity.nome}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {commodity.bolsa}
                          {commodity.moeda ? ` · ${commodity.moeda}` : ""}
                        </p>
                      </div>
                    </div>
                    <ToggleSwitch
                      checked={isSelected}
                      onChange={() => toggleCommodity(commodity.id)}
                      label={`Selecionar ${commodity.nome}`}
                    />
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-wrap gap-1.5">
                    {commodity.ncm && (
                      <Badge variant="outline" className="text-xs font-mono">
                        NCM {commodity.ncm}
                      </Badge>
                    )}
                    {isSelected && (
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: "var(--success)",
                          color: "var(--success-foreground)",
                        }}
                      >
                        Ativa
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Pagina anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
              )
              .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                  acc.push("ellipsis")
                acc.push(p)
                return acc
              }, [])
              .map((item, i) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="text-muted-foreground text-sm px-1"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={page === item ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(item as number)}
                    className="w-8 h-8 p-0 text-xs"
                  >
                    {item}
                  </Button>
                )
              )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Proxima pagina"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Save row */}
        <div className="mt-8 flex items-center justify-between gap-4 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            {isDirty
              ? `${selectedIds.size} commodit${selectedIds.size === 1 ? "y ativa" : "ies ativas"} · alteracoes nao salvas`
              : `${selectedIds.size} commodit${selectedIds.size === 1 ? "y ativa" : "ies ativas"}`}
          </p>
          <Button
            onClick={handleSave}
            disabled={selectedIds.size === 0 || isSaving}
            className="bg-primary text-primary-foreground hover:brightness-110"
          >
            {isSaving ? "Salvando..." : "Salvar selecao"}
          </Button>
        </div>
      </main>
    </div>
  )
}
