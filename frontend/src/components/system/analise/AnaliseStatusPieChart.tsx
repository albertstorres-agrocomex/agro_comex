import { PieChartComex, type PieChartDataItem } from "@/components/PieChartComex";
import type { ChartConfig } from "@/components/ui/chart";
import type { SolicitacaoStatusCount } from "@/services/analiseService";

interface Props {
  counts: SolicitacaoStatusCount;
}

const config: ChartConfig = {
  aguardando: { label: "Aguardando", color: "var(--chart-3)" },
  processando: { label: "Processando", color: "var(--chart-4)" },
  concluido: { label: "Concluido", color: "var(--success)" },
  erro: { label: "Erro", color: "var(--destructive)" },
};

export function AnaliseStatusPieChart({ counts }: Props) {
  const data: PieChartDataItem[] = [
    { label: "Aguardando", value: counts.aguardando, colorKey: "aguardando" },
    { label: "Processando", value: counts.processando, colorKey: "processando" },
    { label: "Concluido", value: counts.concluido, colorKey: "concluido" },
    { label: "Erro", value: counts.erro, colorKey: "erro" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Nenhuma analise ainda.</p>
      </div>
    );
  }

  return (
    <PieChartComex
      data={data}
      config={config}
      title="Analises por Status"
      totalValue={String(counts.total)}
      totalLabel="Total"
      valueFormatter={(v) => String(v)}
    />
  );
}
