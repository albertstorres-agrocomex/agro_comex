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
import { createAnalise, type AnaliseCreatePayload } from "@/services/analiseService";

interface CommodityOption {
  codigo: string;
  nome: string;
  preco_atual?: string;
  moeda: string;
  unidade: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  commodities: CommodityOption[];
}

const CONTRACT_TYPES = ["Futuro", "Opcao de Compra", "Opcao de Venda", "Swap"];

const CURRENT_YEAR = new Date().getFullYear();
const EXPIRY_YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR + i);

const COUNTRIES = [
  "Brasil",
  "Estados Unidos",
  "Argentina",
  "China",
  "Europa",
  "Outros",
];

export function NovaAnaliseModal({ open, onClose, onCreated, commodities }: Props) {
  const [selectedCommodity, setSelectedCommodity] = useState("");
  const [contractType, setContractType] = useState("");
  const [expiryYear, setExpiryYear] = useState(String(CURRENT_YEAR));
  const [quantity, setQuantity] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const commodity = commodities.find((c) => c.codigo === selectedCommodity);
  const salePrice = commodity?.preco_atual ?? "0";
  const totalValue = commodity && quantity
    ? (Number(salePrice) * Number(quantity)).toFixed(2)
    : "";

  useEffect(() => {
    if (!open) {
      setSelectedCommodity("");
      setContractType("");
      setExpiryYear(String(CURRENT_YEAR));
      setQuantity("");
      setCountry("");
      setError("");
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCommodity || !contractType || !quantity || !country) {
      setError("Preencha todos os campos obrigatorios.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload: AnaliseCreatePayload = {
        commodity_code: selectedCommodity,
        title: `Analise ${commodity?.nome ?? selectedCommodity} - ${contractType} ${expiryYear}`,
        sale_price: salePrice,
        sale_price_currency: commodity?.moeda ?? "USD",
        sale_price_unit: `/${commodity?.unidade ?? "ton"}`,
        contract_type: contractType,
        expiry_year: Number(expiryYear),
        total_contract_value: `${commodity?.moeda ?? "USD"} ${Number(totalValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        quantidade_toneladas: quantity,
        country,
      };
      await createAnalise(payload);
      onCreated();
      onClose();
    } catch {
      setError("Erro ao criar analise. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">Nova Analise</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Commodity */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Commodity</Label>
            <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {commodities.map((c) => (
                  <SelectItem key={c.codigo} value={c.codigo}>
                    {c.nome} ({c.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de contrato */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Tipo de Contrato</Label>
            <Select value={contractType} onValueChange={setContractType}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ano de vencimento */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Ano de Vencimento</Label>
            <Select value={expiryYear} onValueChange={setExpiryYear}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRY_YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preco atual (readonly) */}
          {commodity && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Preco Atual</Label>
              <Input
                value={`${commodity.moeda} ${Number(salePrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} /${commodity.unidade}`}
                readOnly
                className="h-9 text-sm bg-muted cursor-default"
              />
            </div>
          )}

          {/* Quantidade em toneladas */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Quantidade (toneladas)</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Ex: 500"
              className="h-9 text-sm"
            />
          </div>

          {/* Valor total calculado (readonly) */}
          {totalValue && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Valor Total do Contrato</Label>
              <Input
                value={`${commodity?.moeda ?? "USD"} ${Number(totalValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                readOnly
                className="h-9 text-sm bg-muted cursor-default"
              />
            </div>
          )}

          {/* Pais */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Pais de Referencia</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              disabled={loading}
              className="bg-accent text-accent-foreground hover:brightness-105 rounded-full px-4"
            >
              {loading ? "Enviando..." : "Solicitar Analise"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
