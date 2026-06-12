"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SolicitacaoAnaliseData } from "@/services/analiseService";

const BADGE_STYLE: React.CSSProperties = {
  background: "var(--muted)",
  color: "var(--muted-foreground)",
};

const STATUS_CONFIG: Record<string, { label: string; style: React.CSSProperties }> = {
  aguardando:  { label: "Aguardando",  style: BADGE_STYLE },
  processando: { label: "Processando", style: BADGE_STYLE },
  concluido:   { label: "Concluido",   style: BADGE_STYLE },
  aprovado:    { label: "Aprovado",    style: BADGE_STYLE },
  rejeitado:   { label: "Rejeitado",   style: BADGE_STYLE },
  erro:        { label: "Erro",        style: BADGE_STYLE },
};

interface Props {
  analise: SolicitacaoAnaliseData;
}

export function AnaliseCard({ analise }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const cfg = STATUS_CONFIG[analise.status] ?? {
    label: analise.status,
    style: { background: "var(--muted)", color: "var(--muted-foreground)" },
  };

  const mesLabel =
    analise.mes_contrato_ticket ??
    (analise.mes_contrato_codigo && analise.mes_contrato_ano
      ? `${analise.mes_contrato_codigo}/${analise.mes_contrato_ano}`
      : null);

  const title = `${analise.commodity_nome} — ${analise.tipo_derivativo_rotulo}${mesLabel ? ` (${mesLabel})` : ""}`;

  const dataFormatada = new Date(analise.criado_em).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="border-b border-border last:border-b-0 px-1 py-3">
      <div className="flex items-start gap-3">
        {/* Imagem / placeholder */}
        <div className="shrink-0">
          {analise.commodity_imagem_url ? (
            <img
              src={analise.commodity_imagem_url}
              alt={analise.commodity_nome}
              className="w-10 h-10 rounded-[var(--radius-md)] object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-muted flex items-center justify-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">
                {analise.commodity_codigo.slice(0, 3)}
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
                {title}
              </Link>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-[18px] font-semibold mt-1"
                style={cfg.style}
              >
                {cfg.label}
              </Badge>
              <p className="text-sm font-semibold text-foreground mt-1.5 tabular-nums">
                {analise.commodity_moeda}{" "}
                {Number(analise.preco_mercado_atual).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
                <span className="text-[11px] font-normal text-muted-foreground ml-1">
                  {analise.commodity_unidade}
                </span>
              </p>
            </div>

            {/* Botao expandir */}
            <button
              onClick={() => setIsOpen((v) => !v)}
              className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center transition-opacity hover:opacity-80"
              style={cfg.style}
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
                  {analise.tipo_derivativo_rotulo}
                </Badge>
                {mesLabel && (
                  <Badge
                    variant="secondary"
                    className="text-[9px] px-1.5 py-0 h-[18px]"
                  >
                    {mesLabel}
                  </Badge>
                )}
                {analise.posicao && (
                  <Badge
                    variant="secondary"
                    className="text-[9px] px-1.5 py-0 h-[18px]"
                  >
                    {analise.posicao === "comprador" ? "Comprador" : "Vendedor"}
                  </Badge>
                )}
              </div>
              {analise.nivel_barreira !== null && analise.nivel_barreira !== undefined && (
                <p className="text-xs text-muted-foreground leading-snug">
                  Barreira: {analise.nivel_barreira}
                </p>
              )}
              <div className="flex items-center gap-[10px] mt-1">
                <span className="text-xs text-muted-foreground ml-auto">
                  {dataFormatada}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
