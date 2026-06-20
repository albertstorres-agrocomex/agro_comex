"use client";

import { useProativoNaoLidas } from "./useProativoNaoLidas";

export function NaoLidasBadge() {
  const naoLidas = useProativoNaoLidas();
  if (naoLidas <= 0) return null;
  return (
    <span
      aria-label={`${naoLidas} mensagens nao lidas`}
      className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-accent-foreground"
    >
      {naoLidas > 9 ? "9+" : naoLidas}
    </span>
  );
}
