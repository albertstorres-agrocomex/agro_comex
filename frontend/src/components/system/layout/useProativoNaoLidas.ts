"use client";

import { useEffect, useState } from "react";
import { getProativoNaoLidas } from "@/services/chatService";

export function useProativoNaoLidas(intervaloMs = 45000): number {
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    let ativo = true;
    const consultar = async () => {
      try {
        const { nao_lidas } = await getProativoNaoLidas();
        if (ativo) setNaoLidas(nao_lidas);
      } catch {
        // silencioso: nao quebrar a navbar por falha de polling
      }
    };
    consultar();
    const id = setInterval(consultar, intervaloMs);
    return () => {
      ativo = false;
      clearInterval(id);
    };
  }, [intervaloMs]);

  return naoLidas;
}
