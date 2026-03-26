import { PieChartComex, type PieChartDataItem } from "@/components/PieChartComex";
import type { ChartConfig } from "@/components/ui/chart";
import type { SolicitacaoStatusCount } from "@/services/analiseService";

interface Props {
  counts: SolicitacaoStatusCount;
}

const config: ChartConfig = {
  avaliacao: { label: "Avaliacao", color: "var(--info)" },
  aprovado:  { label: "Aprovado",  color: "var(--success)" },
  rejeitado: { label: "Rejeitado", color: "var(--destructive)" },
};

export function AnaliseStatusPieChart({ counts }: Props) {
  const data: PieChartDataItem[] = [
    { label: "Avaliacao", value: counts.avaliacao, colorKey: "avaliacao" },
    { label: "Aprovado",  value: counts.aprovado,  colorKey: "aprovado" },
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
      title="Distribuicao"
      totalValue={String(counts.total)}
      totalLabel="Total"
      valueFormatter={(v) => String(v)}
    />
  );
}
