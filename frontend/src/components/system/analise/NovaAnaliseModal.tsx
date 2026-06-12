"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createSolicitacao,
  fetchTiposDerivativo,
  fetchMesesContrato,
  type TipoDerivativo,
  type MesContrato,
} from "@/services/analiseService";

interface CommodityOption {
  id: number;
  codigo: string;
  nome: string;
  preco_atual?: string | null;
  moeda: string;
  unidade: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  commodities: CommodityOption[];
}

export function NovaAnaliseModal({ open, onClose, onCreated, commodities }: Props) {
  const [commodityId, setCommodityId] = useState<string>("");
  const [tipoId, setTipoId] = useState<string>("");
  const [mesId, setMesId] = useState<string>("");
  const [posicao, setPosicao] = useState<"comprador" | "vendedor" | "">("");
  const [nivelBarreira, setNivelBarreira] = useState<string>("");
  const [precoExercicio, setPrecoExercicio] = useState<string>("");
  const [quantidade, setQuantidade] = useState<string>("");
  const [unidadeQuantidade, setUnidadeQuantidade] = useState<"sacas" | "toneladas" | "">("");

  const [tipos, setTipos] = useState<TipoDerivativo[]>([]);
  const [meses, setMeses] = useState<MesContrato[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [loadingMeses, setLoadingMeses] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const commodity = commodities.find((c) => String(c.id) === commodityId);
  const tipo = tipos.find((t) => String(t.id) === tipoId);

  useEffect(() => {
    if (!open) return;
    setLoadingTipos(true);
    fetchTiposDerivativo()
      .then(setTipos)
      .catch(() => {})
      .finally(() => setLoadingTipos(false));
  }, [open]);

  useEffect(() => {
    if (!commodityId) {
      setMeses([]);
      setMesId("");
      return;
    }
    setLoadingMeses(true);
    fetchMesesContrato(Number(commodityId))
      .then(setMeses)
      .catch(() => {})
      .finally(() => setLoadingMeses(false));
  }, [commodityId]);

  useEffect(() => {
    if (!open) {
      setCommodityId("");
      setTipoId("");
      setMesId("");
      setPosicao("");
      setNivelBarreira("");
      setPrecoExercicio("");
      setQuantidade("");
      setUnidadeQuantidade("");
      setMeses([]);
      setError("");
    }
  }, [open]);

  useEffect(() => {
    setPosicao("");
    setNivelBarreira("");
  }, [tipoId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!commodityId || !tipoId) {
      setError("Selecione a commodity e o tipo de derivativo.");
      return;
    }
    if (!mesId) {
      setError("Selecione o mes do contrato.");
      return;
    }
    if (!precoExercicio) {
      setError("Informe o preco de exercicio.");
      return;
    }
    const parsedPreco = parseFloat(precoExercicio);
    if (isNaN(parsedPreco) || parsedPreco <= 0) {
      setError("Informe um preco de exercicio valido.");
      return;
    }
    if (!quantidade || !unidadeQuantidade) {
      setError("Informe a quantidade e a unidade.");
      return;
    }
    if (tipo?.requer_posicao && !tipo?.posicao_implicita && !posicao) {
      setError("Selecione a posicao (comprador ou vendedor).");
      return;
    }
    if (tipo?.requer_barreira && !nivelBarreira) {
      setError("Informe o nivel de barreira.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await createSolicitacao({
        commodity: Number(commodityId),
        tipo_derivativo: Number(tipoId),
        mes_contrato: Number(mesId),
        preco_exercicio: Math.round((parsedPreco + Number.EPSILON) * 100),
        quantidade: Number(quantidade),
        unidade_quantidade: unidadeQuantidade as "sacas" | "toneladas",
        posicao: posicao || null,
        nivel_barreira: nivelBarreira ? Number(nivelBarreira) : null,
      });
      onCreated();
      onClose();
    } catch {
      setError("Erro ao criar solicitacao. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Nova Solicitacao de Analise</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Commodity */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Commodity</Label>
            <Select value={commodityId} onValueChange={setCommodityId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {commodities.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nome} ({c.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preco atual (readonly) */}
          {commodity && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Preco Atual</Label>
              <Input
                value={
                  commodity.preco_atual
                    ? `${commodity.moeda} ${Number(commodity.preco_atual).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} /${commodity.unidade}`
                    : "Sem preco disponivel"
                }
                readOnly
                className="h-9 text-sm bg-muted cursor-default"
              />
            </div>
          )}

          {/* Tipo de derivativo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Tipo de Derivativo</Label>
            <Select value={tipoId} onValueChange={setTipoId} disabled={loadingTipos}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={loadingTipos ? "Carregando..." : "Selecione..."} />
              </SelectTrigger>
              <SelectContent>
                {tipos.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mes do contrato */}
          {commodityId && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mes do Contrato</Label>
              <Select
                value={mesId}
                onValueChange={setMesId}
                disabled={loadingMeses || meses.length === 0}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue
                    placeholder={
                      loadingMeses
                        ? "Carregando..."
                        : meses.length === 0
                        ? "Nenhum mes disponivel"
                        : "Selecione..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {meses.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.ticket_completo ?? `${m.codigo_mes}${m.ano}`} — venc.{" "}
                      {new Date(m.data_vencimento).toLocaleDateString("pt-BR")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Valor do contrato */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Preco de Exercicio</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                {commodity?.moeda ?? ""}
              </span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={precoExercicio}
                onChange={(e) => setPrecoExercicio(e.target.value)}
                placeholder="Ex: 450.50"
                className="h-9 text-sm pl-10"
              />
            </div>
          </div>

          {/* Quantidade e unidade */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Quantidade</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="Ex: 1000"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Unidade</Label>
              <Select
                value={unidadeQuantidade}
                onValueChange={(v) => setUnidadeQuantidade(v as "sacas" | "toneladas")}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sacas">Sacas</SelectItem>
                  <SelectItem value="toneladas">Toneladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Posicao — apenas quando requerida E nao implicita no tipo */}
          {tipo?.requer_posicao && !tipo?.posicao_implicita && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Posicao</Label>
              <Select
                value={posicao}
                onValueChange={(v) => setPosicao(v as "comprador" | "vendedor")}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprador">Comprador</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Nivel de barreira — condicional */}
          {tipo?.requer_barreira && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nivel de Barreira</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={nivelBarreira}
                onChange={(e) => setNivelBarreira(e.target.value)}
                placeholder="Ex: 5.90"
                className="h-9 text-sm"
              />
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || loadingMeses}
              className="bg-info text-info-foreground hover:brightness-105 rounded-full px-4"
            >
              {loading ? "Enviando..." : "Solicitar Analise"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
