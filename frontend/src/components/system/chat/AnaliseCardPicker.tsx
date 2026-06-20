"use client";

import type { AnaliseCard } from "@/services/chatService";
import { Card } from "@/components/ui/card";

export function AnaliseCardPicker({
  analises,
  onSelecionar,
}: {
  analises: AnaliseCard[];
  onSelecionar: (id: number) => void;
}) {
  if (analises.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {analises.map((a) => (
        <button key={a.id} type="button" onClick={() => onSelecionar(a.id)} className="text-left">
          <Card className="cursor-pointer p-3 transition-colors hover:border-accent">
            <p className="text-sm font-bold">{a.commodity}</p>
            <p className="text-xs text-muted-foreground">{a.tipo}</p>
            <p className="text-xs text-muted-foreground">{a.status}</p>
          </Card>
        </button>
      ))}
    </div>
  );
}
