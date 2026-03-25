import { PieChartComex, type PieChartDataItem } from "@/components/PieChartComex";
import type { ChartConfig } from "@/components/ui/chart";
import type { AnaliseStatusCount } from "@/services/analiseService";

interface Props {
  counts: AnaliseStatusCount;
}

const config: ChartConfig = {
  pendente: { label: "Pendente", color: "var(--chart-3)" },
  em_analise: { label: "Em Analise", color: "var(--chart-4)" },
  aprovado: { label: "Aprovado", color: "var(--success)" },
  rejeitado: { label: "Rejeitado", color: "var(--destructive)" },
};

export function AnaliseStatusPieChart({ counts }: Props) {
  const data: PieChartDataItem[] = [
    { label: "Pendente", value: counts.pendente, colorKey: "pendente" },
    { label: "Em Analise", value: counts.em_analise, colorKey: "em_analise" },
    { label: "Aprovado", value: counts.aprovado, colorKey: "aprovado" },
    { label: "Rejeitado", value: counts.rejeitado, colorKey: "rejeitado" },
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
