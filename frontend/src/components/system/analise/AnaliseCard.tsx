"use client";

import Link from "next/link";
import { ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { AnaliseData } from "@/services/analiseService";

const STATUS_CONFIG = {
  aprovado: {
    label: "Aprovado",
    style: { background: "var(--success)", color: "var(--success-foreground)" },
  },
  pendente: {
    label: "Pendente",
    style: { background: "var(--warning)", color: "var(--warning-foreground)" },
  },
  rejeitado: {
    label: "Rejeitado",
    style: {
      background: "var(--destructive)",
      color: "var(--destructive-foreground)",
    },
  },
  em_analise: {
    label: "Em Analise",
    style: { background: "var(--info)", color: "var(--info-foreground)" },
  },
};

interface Props {
  analise: AnaliseData;
}

export function AnaliseCard({ analise }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const cfg = STATUS_CONFIG[analise.status];

  return (
    <div className="border-b border-border last:border-b-0 px-1 py-3">
      <div className="flex items-start gap-3">
        {/* Imagem / placeholder */}
        <div className="shrink-0">
          {analise.commodity_image_url ? (
            <img
              src={analise.commodity_image_url}
              alt={analise.commodity_code}
              className="w-10 h-10 rounded-[var(--radius-md)] object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-muted flex items-center justify-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                {analise.commodity_code.slice(0, 3)}
              </span>
            </div>
          )}
        </div>

        {/* Conteudo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link
                href={`/analises/${analise.id}`}
                className="text-sm font-bold text-foreground leading-tight truncate block hover:underline"
              >
                {analise.title}
              </Link>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-[18px] font-semibold mt-1"
                style={cfg.style}
              >
                {cfg.label}
              </Badge>
              <p className="text-sm font-semibold text-foreground mt-1.5 tabular-nums">
                {analise.sale_price_currency}{" "}
                {Number(analise.sale_price).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
                <span className="text-[11px] font-normal text-muted-foreground ml-1">
                  {analise.sale_price_unit}
                </span>
              </p>
            </div>

            {/* Botao expandir */}
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center transition-opacity hover:opacity-80"
              style={{
                background: "oklch(0.785 0.016 88 / 0.15)",
              }}
              aria-label={isOpen ? "Recolher" : "Expandir"}
            >
              {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Detalhes expandidos */}
          {isOpen && (
            <div className="mt-1.5">
              <div className="flex gap-[2px] flex-wrap mb-1">
                <Badge
                  variant="secondary"
                  className="text-[9px] px-1.5 py-0 h-[18px]"
                >
                  {analise.contract_type}
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-[9px] px-1.5 py-0 h-[18px]"
                >
                  {analise.expiry_year}
                </Badge>
              </div>
              {analise.quantidade_toneladas && (
                <p className="text-xs text-muted-foreground leading-snug">
                  {Number(analise.quantidade_toneladas).toLocaleString("pt-BR")}{" "}
                  t &middot; Total: {analise.total_contract_value}
                </p>
              )}
              <div className="flex items-center gap-[10px] mt-1">
                <MapPin size={11} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground">
                  {analise.country}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {analise.time_ago}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
