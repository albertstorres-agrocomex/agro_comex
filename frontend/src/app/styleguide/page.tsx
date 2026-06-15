import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LoginCard } from "@/components/system/auth/LoginCard";
import { CardSelecaoCenarioAnalise } from "@/components/CardSelecaoCenarioAnalise";
import { Sidebar } from "@/components/system/layout/Sidebar";
import { TopMenu } from "@/components/system/layout/TopMenu";
import { CommodityPriceCard } from "@/components/CommodityPriceCard";
import { RecentAnalysisCard } from "@/components/RecentAnalysisCard";
import type { RecentAnalysisData } from "@/components/RecentAnalysisCard";
import { CommodityImageCard } from "@/components/system/commodity/CommodityImageCard";
import type { CommodityImageSize } from "@/components/system/commodity/CommodityImageCard";
import { ChatMessage } from "@/components/system/chat/ChatMessage";

// ─── Color scales ──────────────────────────────────────────────────────────
// Primary = Verde Agro (#153A1E) — identidade visual do AgroComex
const primaryScale = [
  { name: "50",  hex: "#ECFDF4" },
  { name: "100", hex: "#D0FAE3" },
  { name: "200", hex: "#A2F2C6" },
  { name: "300", hex: "#64E4A0" },
  { name: "400", hex: "#2DCE78" },
  { name: "500", hex: "#14B25A" },
  { name: "600", hex: "#0A8E45" },
  { name: "700", hex: "#1B6B30" },
  { name: "800", hex: "#185426" },
  { name: "900", hex: "#153A1E" },  // brand token
  { name: "950", hex: "#081F0F" },
];

// Neutral = Creme quente — fundo do dashboard de referência
const neutralScale = [
  { name: "50",  hex: "#FAF8F5" },
  { name: "100", hex: "#F0EBE1" },
  { name: "200", hex: "#E5DDD0" },
  { name: "300", hex: "#D2C9B8" },
  { name: "400", hex: "#BAB0A0" },
  { name: "500", hex: "#9A9183" },
  { name: "600", hex: "#7A7268" },
  { name: "700", hex: "#5A544A" },
  { name: "800", hex: "#3C372E" },
  { name: "900", hex: "#221E17" },
  { name: "950", hex: "#121009" },
];

// ─── Sub-components ────────────────────────────────────────────────────────
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      {subtitle && <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>}
      {children}
    </section>
  );
}

function TokenSwatch({ label, cssVar }: { label: string; cssVar: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-14 rounded-lg border border-border/50 shadow-sm"
        style={{ background: `var(${cssVar})` }}
      />
      <p className="text-xs font-medium leading-tight">{label}</p>
      <p className="text-[10px] text-muted-foreground font-mono">{cssVar}</p>
    </div>
  );
}

function ColorScale({ label, scale }: { label: string; scale: typeof primaryScale }) {
  return (
    <div>
      <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
      <div className="flex gap-1 h-12">
        {scale.map((s) => (
          <div
            key={s.name}
            className="flex-1 rounded-md relative group"
            style={{ background: s.hex }}
            title={`${s.name} — ${s.hex}`}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span
                className="text-[9px] font-mono font-bold"
                style={{ color: parseInt(s.name) > 400 ? "#fff" : "#111" }}
              >
                {s.name}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">50</span>
        <span className="text-[10px] text-muted-foreground">950</span>
      </div>
    </div>
  );
}

function RadiusSample({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-16 h-16 bg-primary/15 border-2 border-primary/30 ${className}`} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function ShadowSample({ label, className }: { label: string; className: string }) {
  return (
    <div className={`bg-card border border-border px-4 py-3 rounded-lg ${className} flex flex-col gap-1`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">Superfície de card</p>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function StyleguidePage() {
  return (
    <div className="px-10 py-10 max-w-5xl">

      {/* Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          <div className="w-4 h-px bg-primary" />
          Foundation
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Design Tokens</h1>
        <p className="text-muted-foreground text-lg max-w-xl">
          Fundações visuais da plataforma AgroComex — inteligência analítica para
          exportadores de commodities brasileiras.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline">Plus Jakarta Sans</Badge>
          <Badge variant="outline">Tailwind CSS v4</Badge>
          <Badge variant="outline">Shadcn/ui</Badge>
          <Badge variant="outline">CESAR School 2026.1</Badge>
          <Badge style={{ background: "#153A1E", color: "#fff" }}>AgroComex Green</Badge>
          <Badge style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>
            Federated Learning
          </Badge>
        </div>
      </div>

      {/* ── CORES ── */}
      <Section title="Cores">

        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground mb-1">Tokens da Interface</p>
          <p className="text-xs text-muted-foreground mb-4">
            Variáveis CSS usadas em todos os componentes do AgroComex — dashboards, cards de commodity, alertas e sidebar.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            <TokenSwatch label="Background" cssVar="--background" />
            <TokenSwatch label="Foreground" cssVar="--foreground" />
            <TokenSwatch label="Card" cssVar="--card" />
            <TokenSwatch label="Primary" cssVar="--primary" />
            <TokenSwatch label="Accent (Lima)" cssVar="--accent" />
            <TokenSwatch label="Secondary" cssVar="--secondary" />
            <TokenSwatch label="Muted" cssVar="--muted" />
            <TokenSwatch label="Border" cssVar="--border" />
            <TokenSwatch label="Sidebar" cssVar="--sidebar" />
            <TokenSwatch label="Ring (foco)" cssVar="--ring" />
          </div>
        </div>

        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground mb-1">Cores Semânticas</p>
          <p className="text-xs text-muted-foreground mb-4">
            Usadas em alertas de preços, status de rodadas FL, erros de sincronização ComexStat e variações de VL_FOB.
          </p>
          <div className="grid grid-cols-4 gap-4">
            <TokenSwatch label="Success" cssVar="--success" />
            <TokenSwatch label="Warning" cssVar="--warning" />
            <TokenSwatch label="Info" cssVar="--info" />
            <TokenSwatch label="Destructive" cssVar="--destructive" />
          </div>
        </div>

        <div className="mb-8">
          <p className="text-sm font-medium text-muted-foreground mb-1">Cores de Gráficos</p>
          <p className="text-xs text-muted-foreground mb-4">
            Paleta do ComexMap e FedPredict — distinguem commodities (soja, milho, café, açúcar) e modelos FL (FedAvg, FedProx, Centralizado).
          </p>
          <div className="grid grid-cols-5 gap-4">
            <TokenSwatch label="Soja / FedAvg" cssVar="--chart-1" />
            <TokenSwatch label="Milho / Lima" cssVar="--chart-2" />
            <TokenSwatch label="Café / Âmbar" cssVar="--chart-3" />
            <TokenSwatch label="Açúcar / Violeta" cssVar="--chart-4" />
            <TokenSwatch label="Outros / Teal" cssVar="--chart-5" />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <ColorScale label="Escala Primária — Verde Agro (identidade AgroComex)" scale={primaryScale} />
          <ColorScale label="Escala Neutra — Creme Quente (fundo dos dashboards)" scale={neutralScale} />
        </div>
      </Section>

      {/* ── TIPOGRAFIA ── */}
      <Section title="Tipografia">
        <div className="p-6 bg-card rounded-xl border border-border space-y-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-4">
            Plus Jakarta Sans — 300 · 400 · 500 · 600 · 700
          </p>

          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-12 shrink-0">H1</span>
            <h1 className="text-4xl font-bold tracking-tight">AgroComex — Inteligência de Exportações</h1>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-12 shrink-0">H2</span>
            <h2 className="text-3xl font-semibold tracking-tight">ComexMap — Fluxos por UF e Destino</h2>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-12 shrink-0">H3</span>
            <h3 className="text-2xl font-semibold">FedPredict — Previsão com Federated Learning</h3>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-12 shrink-0">H4</span>
            <h4 className="text-xl font-medium">PriceStory — Narrativa Histórica de Preços</h4>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-12 shrink-0">H5</span>
            <h5 className="text-lg font-medium">AgroChat — Mauro, assistente contextual com IA generativa</h5>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-muted-foreground w-12 shrink-0">H6</span>
            <h6 className="text-base font-medium">Relatório VL_FOB — Soja (MT) · Mar/2025</h6>
          </div>

          <div className="border-t border-border pt-4 mt-2 space-y-2">
            <div className="flex gap-4">
              <span className="text-xs text-muted-foreground w-12 shrink-0">lg</span>
              <p className="text-lg">
                Plataforma que centraliza dados do ComexStat, aplica ML para previsão de volumes
                e valores, e entrega narrativas explicativas via IA Generativa.
              </p>
            </div>
            <div className="flex gap-4">
              <span className="text-xs text-muted-foreground w-12 shrink-0">base</span>
              <p className="text-base">
                O Federated Learning permite que cooperativas (Coamo, C.Vale, Cocamar) e tradings
                (Cargill, Bunge, ADM) contribuam para o modelo global sem expor dados sensíveis.
              </p>
            </div>
            <div className="flex gap-4">
              <span className="text-xs text-muted-foreground w-12 shrink-0">sm</span>
              <p className="text-sm text-muted-foreground">
                Rodada FL #47 convergida · FedAvg · 8 nós (UFs) · MAE: R$ 1.240/mês · RMSE: R$ 1.890
              </p>
            </div>
            <div className="flex gap-4">
              <span className="text-xs text-muted-foreground w-12 shrink-0">xs</span>
              <p className="text-xs text-muted-foreground">
                Atualizado há 3h · ComexStat/MDIC · NCM 1201 — Soja · VL_FOB USD 5.842.310
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-2">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">Pesos</p>
            <div className="flex flex-wrap gap-8">
              <span className="text-base font-light">Light 300</span>
              <span className="text-base font-normal">Regular 400</span>
              <span className="text-base font-medium">Medium 500</span>
              <span className="text-base font-semibold">SemiBold 600</span>
              <span className="text-base font-bold">Bold 700</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ── BORDER RADIUS ── */}
      <Section title="Border Radius">
        <div className="flex flex-wrap gap-8 items-end">
          <RadiusSample label="radius-sm" className="rounded-sm" />
          <RadiusSample label="radius-md" className="rounded-md" />
          <RadiusSample label="radius-lg" className="rounded-lg" />
          <RadiusSample label="radius-xl" className="rounded-xl" />
          <RadiusSample label="radius-2xl" className="rounded-2xl" />
          <RadiusSample label="radius-3xl" className="rounded-3xl" />
          <RadiusSample label="full" className="rounded-full" />
        </div>
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-xs font-mono text-muted-foreground">
            --radius: 0.75rem &nbsp;·&nbsp; sm: 0.375rem &nbsp;·&nbsp; md: 0.5rem &nbsp;·&nbsp;
            lg: 0.75rem &nbsp;·&nbsp; xl: 1rem &nbsp;·&nbsp; 2xl: 1.25rem
          </p>
        </div>
      </Section>

      {/* ── SOMBRAS ── */}
      <Section title="Sombras">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <ShadowSample label="shadow-sm" className="shadow-sm" />
          <ShadowSample label="shadow" className="shadow" />
          <ShadowSample label="shadow-md" className="shadow-md" />
          <ShadowSample label="shadow-lg" className="shadow-lg" />
        </div>
      </Section>

      {/* ── BOTÕES ── */}
      <Section title="Botões">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">Variantes</p>
            <div className="flex flex-wrap gap-3">
              <Button>Exportar Relatório</Button>
              <Button variant="secondary">Ver Histórico</Button>
              <Button variant="outline">Filtrar UF</Button>
              <Button variant="ghost">Limpar Filtros</Button>
              <Button variant="destructive">Cancelar Rodada FL</Button>
              <Button variant="link">Ver ComexStat</Button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">Tamanhos</p>
            <div className="flex flex-wrap gap-3 items-center">
              <Button size="lg">Executar FedPredict</Button>
              <Button size="default">Sincronizar Dados</Button>
              <Button size="sm">Detalhes NCM</Button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">Estados e Variações de Cor</p>
            <div className="flex flex-wrap gap-3">
              <Button disabled>Processando FL...</Button>
              <Button style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>
                AgroChat (Lima)
              </Button>
              <Button style={{ background: "var(--success)", color: "var(--success-foreground)" }}>
                Rodada Convergida
              </Button>
              <Button style={{ background: "var(--info)", color: "var(--info-foreground)" }}>
                Ver PriceStory
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ── BADGES ── */}
      <Section title="Badges">
        <p className="text-xs text-muted-foreground mb-4">
          Usados para rotular módulos, status de rodadas FL, fontes de dados e tipo de commodity.
        </p>
        <div className="flex flex-wrap gap-3">
          <Badge>ComexStat</Badge>
          <Badge variant="secondary">AgroStat / MAPA</Badge>
          <Badge variant="outline">CONAB</Badge>
          <Badge variant="outline">BCB / Câmbio</Badge>
          <Badge variant="destructive">Erro de Sync</Badge>
          <Badge style={{ background: "var(--success)", color: "var(--success-foreground)" }}>FL Convergido</Badge>
          <Badge style={{ background: "var(--warning)", color: "var(--warning-foreground)" }}>Alerta VL_FOB</Badge>
          <Badge style={{ background: "var(--info)", color: "var(--info-foreground)" }}>FedAvg</Badge>
          <Badge style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>FedProx</Badge>
          <Badge style={{ background: "#153A1E", color: "#fff" }}>MVP</Badge>
          <Badge style={{ background: "var(--chart-4)", color: "#fff" }}>Core FL</Badge>
          <Badge variant="outline">LGPD</Badge>
        </div>
      </Section>

      {/* ── CARDS ── */}
      <Section title="Cards">
        <p className="text-xs text-muted-foreground mb-4">
          Formato dos cards de commodity no ComexMap e dos resultados do FedPredict.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Soja — NCM 1201</CardTitle>
                <Badge style={{ background: "var(--success)", color: "var(--success-foreground)" }}>+3,2%</Badge>
              </div>
              <CardDescription>ComexStat · Mato Grosso · Mar/2025</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                R$ 132,50 <span className="text-sm font-normal text-muted-foreground">/ 60 kg</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">VL_FOB: USD 5.842.310 · KG_LÍQUIDO: 48.200 t</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Milho — NCM 1005</CardTitle>
                <Badge variant="destructive">−1,8%</Badge>
              </div>
              <CardDescription>ComexStat · Paraná · Mar/2025</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                R$ 68,40 <span className="text-sm font-normal text-muted-foreground">/ 60 kg</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">VL_FOB: USD 2.104.870 · KG_LÍQUIDO: 31.500 t</p>
            </CardContent>
          </Card>

          <Card className="border-primary/30" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-primary-foreground">FedPredict</CardTitle>
                <Badge className="bg-white/20 text-white border-0">FL · Rodada 47</Badge>
              </div>
              <CardDescription className="text-primary-foreground/70">
                Previsão próx. 6 meses · Soja (MT)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">R$ 138,20 / 60kg</p>
              <p className="text-xs text-primary-foreground/70 mt-1">
                MAE: R$ 1.240 · R²: 0.91 · FedAvg · 8 nós
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ── CARDS DE COMMODITY — COR DINAMICA ── */}
      <Section title="Cards de Commodity — Cor Dinamica">
        <p className="text-xs text-muted-foreground mb-4">
          Background de cada card assume a cor da linha correspondente no grafico (via <code className="font-mono bg-muted px-1 rounded">color_key</code> da serie).
          Cores claras (chart-2, chart-3) recebem texto escuro; cores escuras recebem texto branco.
          Escalavel para qualquer numero de commodities via <code className="font-mono bg-muted px-1 rounded">--chart-N</code>.
        </p>

        {/* Mock das 4 commodities atuais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 h-44">

          {/* Soja — chart-1 (verde escuro) */}
          <div className="rounded-[var(--radius-xl)] p-4 flex flex-col justify-between" style={{ background: "var(--chart-1)" }}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5 text-white/60">NCM 1201</p>
                <p className="text-sm font-bold leading-tight text-white">Soja</p>
              </div>
              <span className="shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-white/20 text-white">+3,2%</span>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums leading-none mb-1 text-white">132,4<span className="text-xs font-normal ml-1 text-white/60">pts</span></p>
              <p className="text-[11px] text-white/60">1T 2025</p>
            </div>
          </div>

          {/* Milho — chart-2 (lima) */}
          <div className="rounded-[var(--radius-xl)] p-4 flex flex-col justify-between" style={{ background: "var(--chart-2)" }}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5 text-black/50">NCM 1005</p>
                <p className="text-sm font-bold leading-tight text-black/85">Milho</p>
              </div>
              <span className="shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-black/12 text-black/75">-1,8%</span>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums leading-none mb-1 text-black/85">87,6<span className="text-xs font-normal ml-1 text-black/50">pts</span></p>
              <p className="text-[11px] text-black/50">1T 2025</p>
            </div>
          </div>

          {/* Cafe — chart-3 (ambar) */}
          <div className="rounded-[var(--radius-xl)] p-4 flex flex-col justify-between" style={{ background: "var(--chart-3)" }}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5 text-black/50">NCM 0901</p>
                <p className="text-sm font-bold leading-tight text-black/85">Cafe</p>
              </div>
              <span className="shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-black/12 text-black/75">+7,5%</span>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums leading-none mb-1 text-black/85">214,9<span className="text-xs font-normal ml-1 text-black/50">pts</span></p>
              <p className="text-[11px] text-black/50">1T 2025</p>
            </div>
          </div>

          {/* Acucar — chart-4 (violeta) */}
          <div className="rounded-[var(--radius-xl)] p-4 flex flex-col justify-between" style={{ background: "var(--chart-4)" }}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5 text-white/60">NCM 1701</p>
                <p className="text-sm font-bold leading-tight text-white">Acucar</p>
              </div>
              <span className="shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold bg-white/20 text-white">+2,1%</span>
            </div>
            <div>
              <p className="text-3xl font-bold tabular-nums leading-none mb-1 text-white">156,3<span className="text-xs font-normal ml-1 text-white/60">pts</span></p>
              <p className="text-[11px] text-white/60">1T 2025</p>
            </div>
          </div>

        </div>

        <div className="mt-3 p-3 bg-muted rounded-lg">
          <p className="text-xs font-mono text-muted-foreground">
            chart-1 (verde) → text-white &nbsp;·&nbsp;
            chart-2 (lima) → text-black/85 &nbsp;·&nbsp;
            chart-3 (ambar) → text-black/85 &nbsp;·&nbsp;
            chart-4 (violeta) → text-white &nbsp;·&nbsp;
            chart-5+ → text-white (padrao)
          </p>
        </div>
      </Section>

      {/* ── ALERTAS ── */}
      <Section title="Alertas">
        <p className="text-xs text-muted-foreground mb-4">
          Comunicação de eventos críticos da plataforma: sincronização ComexStat, status das rodadas FL, alertas de preço e erros de API.
        </p>
        <div className="space-y-3">
          <Alert>
            <AlertTitle>Sincronização concluída</AlertTitle>
            <AlertDescription>
              Dados do ComexStat/MDIC atualizados com sucesso. 847.320 registros processados
              para o período Jan–Mar/2025.
            </AlertDescription>
          </Alert>

          <Alert style={{ borderColor: "var(--success)", background: "color-mix(in oklch, var(--success) 10%, transparent)" }}>
            <AlertTitle style={{ color: "var(--success)" }}>Rodada FL convergida — FedAvg</AlertTitle>
            <AlertDescription>
              Rodada #47 finalizada com 8 nós (UFs). Perda global estabilizou em 0,0312.
              MAE: R$ 1.240/mês · RMSE: R$ 1.890.
            </AlertDescription>
          </Alert>

          <Alert style={{ borderColor: "var(--warning)", background: "color-mix(in oklch, var(--warning) 10%, transparent)" }}>
            <AlertTitle style={{ color: "var(--warning-foreground)" }}>Alerta de preço — VL_FOB Soja (MT)</AlertTitle>
            <AlertDescription>
              O valor FOB da soja no Mato Grosso excedeu o limiar de R$ 140,00/60kg.
              PriceStory gerou narrativa explicativa automaticamente.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <AlertTitle>Falha na API ComexStat</AlertTitle>
            <AlertDescription>
              Não foi possível buscar dados de exportação. Verifique a conectividade com
              ComexStat/MDIC e tente novamente. Dados em cache de 6h atrás.
            </AlertDescription>
          </Alert>
        </div>
      </Section>

      {/* ── RADIO GROUP ── */}
      <Section title="Radio Group">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Commodity</CardTitle>
              <CardDescription>
                Alvo da análise no FedPredict e ComexMap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup defaultValue="soja">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="soja" id="soja" />
                  <Label htmlFor="soja">Soja — NCM 1201</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="milho" id="milho" />
                  <Label htmlFor="milho">Milho — NCM 1005</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cafe" id="cafe" />
                  <Label htmlFor="cafe">Café — NCM 0901</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="acucar" id="acucar" />
                  <Label htmlFor="acucar">Açúcar — NCM 1701</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Algoritmo de Agregação FL</CardTitle>
              <CardDescription>
                Configuração para a próxima rodada do FedPredict
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup defaultValue="fedavg">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fedavg" id="fedavg" />
                  <Label htmlFor="fedavg">
                    FedAvg — Média ponderada por dataset
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fedprox" id="fedprox" />
                  <Label htmlFor="fedprox">
                    FedProx — Robusto para UFs heterogêneas
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="centralizado" id="centralizado" />
                  <Label htmlFor="centralizado">
                    Centralizado — Baseline (sem privacidade)
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* ── COMPONENTES ── */}
      <Section title="Componentes">
        <p className="text-xs text-muted-foreground mb-6">
          Componentes compostos do sistema — combinam tokens e primitivos shadcn/ui em blocos reutilizaveis.
        </p>

        {/* Sidebar */}
        <div className="mb-10">
          <p className="text-sm font-medium text-muted-foreground mb-1">Sidebar</p>
          <p className="text-xs text-muted-foreground mb-4">
            Navegacao principal da aplicacao. Fundo em primary-950 (#081F0F), item ativo com accent
            (lima), logout com destructive no hover. Exibido em modo preview (posicionamento relativo).
          </p>
          <div className="h-[600px] w-60 overflow-hidden rounded-xl border border-border shadow-lg">
            <Sidebar
              preview
              activePath="/dashboard"
              userName="Mark Johnson"
              appName="AgroComex"
            />
          </div>
        </div>

        {/* TopMenu */}
        <div className="mb-10">
          <p className="text-sm font-medium text-muted-foreground mb-1">TopMenu</p>
          <p className="text-xs text-muted-foreground mb-4">
            Navegacao horizontal alternativa ao Sidebar. Mesmo conjunto de rotas, estilo pill da
            landing page — fundo primary-950, itens ativos com accent (lima), logout em destaque
            no canto direito.
          </p>
          <div
            className="flex items-start justify-center rounded-xl p-4"
            style={{
              background: "linear-gradient(135deg, oklch(0.12 0.04 145), oklch(0.22 0.06 145))",
            }}
          >
            <TopMenu preview activePath="/dashboard" />
          </div>
        </div>

        {/* LoginCard */}
        <div className="mb-4">
          <p className="text-sm font-medium text-muted-foreground mb-1">LoginCard</p>
          <p className="text-xs text-muted-foreground mb-4">
            Card de autenticacao com glassmorphism sobre a cor primaria. Fundo escuro abaixo simula
            contexto real de uso (pagina de login com background fotografico ou gradiente).
          </p>
          <div
            className="flex items-center justify-center rounded-xl p-12"
            style={{
              background: "linear-gradient(135deg, oklch(0.12 0.04 145), oklch(0.22 0.06 145), oklch(0.16 0.03 90))",
            }}
          >
            <LoginCard />
          </div>
        </div>
      </Section>

      {/* ── COMMODITY PRICE CARD ── */}
      <Section title="CommodityPriceCard">
        <p className="text-xs text-muted-foreground mb-4">
          Card de preco atual de commodity. Background igual ao corpo do dashboard (<code className="font-mono bg-muted px-1 rounded">--background</code>),
          borda em tom escuro para diferenciacao. Badge de variacao usa <code className="font-mono bg-muted px-1 rounded">--success</code> (alta) e{" "}
          <code className="font-mono bg-muted px-1 rounded">--destructive</code> (queda).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 h-40">
          <CommodityPriceCard
            mode="export-index"
            nome="Soja"
            codigo="NCM 1201"
            value={132.4}
            quarter="1T 2025"
            variation={3.2}
          />
          <CommodityPriceCard
            mode="export-index"
            nome="Milho"
            codigo="NCM 1005"
            value={87.6}
            quarter="1T 2025"
            variation={-1.8}
          />
          <CommodityPriceCard
            mode="export-index"
            nome="Cafe"
            codigo="NCM 0901"
            value={214.9}
            quarter="1T 2025"
            variation={7.5}
          />
        </div>

        <div className="mt-3 p-3 bg-muted rounded-lg">
          <p className="text-xs font-mono text-muted-foreground">
            bg: --background &nbsp;·&nbsp;
            border: foreground/20 &nbsp;·&nbsp;
            variacao+: --success / --success-foreground &nbsp;·&nbsp;
            variacao-: --destructive / --destructive-foreground
          </p>
        </div>
      </Section>

      {/* ─── RecentAnalysisCard ─────────────────────────────────────────── */}
      <Section title="Recent Analysis Card" subtitle="Cards de historico de analises do usuario — canto direito do dashboard">
        <p className="text-xs text-muted-foreground mb-3">
          Fundo igual ao da pagina (sem fundo proprio). Sem bordas laterais — apenas linha inferior delimitando cada card.
          Botao circular no canto superior direito alterna entre estado colapsado e expandido.
        </p>

        {/* Preview container with same bg as dashboard */}
        <div className="rounded-[var(--radius-xl)] bg-background border border-border max-w-sm overflow-hidden">
          {(
            [
              {
                id: "sg-1",
                commodityCode: "SOJ",
                commodityColor: "var(--chart-1)",
                commodityTextColor: "oklch(0.92 0.008 80)",
                title: "Exportacao Soja — Safra 25/26",
                status: "aprovado",
                salePrice: 485.50,
                salePriceCurrency: "USD",
                salePriceUnit: "/ton",
                contractType: "FOB",
                expiryYear: 2025,
                totalContractValue: "Valor total: USD 12.500.000,00",
                country: "China",
                timeAgo: "2h ago",
              },
              {
                id: "sg-2",
                commodityCode: "MIL",
                commodityColor: "var(--chart-3)",
                commodityTextColor: "oklch(0.175 0.018 70)",
                title: "Contrato Milho — Q1 2026",
                status: "pendente",
                salePrice: 224.75,
                salePriceCurrency: "USD",
                salePriceUnit: "/ton",
                contractType: "CIF",
                expiryYear: 2026,
                totalContractValue: "Valor total: USD 3.370.000,00",
                country: "Espanha",
                timeAgo: "5h ago",
              },
              {
                id: "sg-3",
                commodityCode: "CAF",
                commodityColor: "var(--chart-2)",
                commodityTextColor: "oklch(0.175 0.018 70)",
                title: "Exportacao Cafe Arabica — Europa",
                status: "em_analise",
                salePrice: 3180.00,
                salePriceCurrency: "USD",
                salePriceUnit: "/ton",
                contractType: "CFR",
                expiryYear: 2025,
                totalContractValue: "Valor total: USD 1.908.000,00",
                country: "Alemanha",
                timeAgo: "1d ago",
              },
            ] as RecentAnalysisData[]
          ).map((analysis) => (
            <RecentAnalysisCard key={analysis.id} analysis={analysis} />
          ))}
        </div>

        <div className="mt-3 p-3 bg-muted rounded-lg">
          <p className="text-xs font-mono text-muted-foreground">
            fundo: --background (transparente) &nbsp;·&nbsp;
            separador: border-b --border &nbsp;·&nbsp;
            botao toggle: oklch(bg - 0.15 lightness) &nbsp;·&nbsp;
            status: --success / --warning / --info / --destructive &nbsp;·&nbsp;
            badges contrato: --muted / --muted-foreground
          </p>
        </div>
      </Section>

      {/* ─── CommodityImageCard ──────────────────────────────────────────── */}
      <Section title="CommodityImageCard">
        <p className="text-xs text-muted-foreground mb-6">
          Container padrao para imagens de commodities. Dimensoes fixas por variante de tamanho —{" "}
          <code className="font-mono bg-muted px-1 rounded">sm</code>,{" "}
          <code className="font-mono bg-muted px-1 rounded">md</code>,{" "}
          <code className="font-mono bg-muted px-1 rounded">lg</code> — garantindo consistencia visual em todo o sistema.
          A imagem usa <code className="font-mono bg-muted px-1 rounded">object-contain</code>: nunca e cortada, sempre
          visivel integralmente, com aspect ratio preservado.
        </p>

        {/* Size variants */}
        <div className="mb-8">
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">Variantes de tamanho</p>
          <div className="flex flex-wrap items-end gap-6">
            {(["sm", "md", "lg"] as CommodityImageSize[]).map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <CommodityImageCard
                  src="/placeholder-commodity.png"
                  alt={`Commodity — variante ${size}`}
                  size={size}
                />
                <p className="text-xs font-mono text-muted-foreground">{size}</p>
                <p className="text-[10px] text-muted-foreground/70">
                  {size === "sm" ? "64px" : size === "md" ? "96px" : "128px"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Usage inside a card */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">Uso em card de commodity</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
            {[
              { nome: "Soja", codigo: "NCM 1201" },
              { nome: "Milho", codigo: "NCM 1005" },
              { nome: "Cafe", codigo: "NCM 0901" },
            ].map(({ nome, codigo }) => (
              <div
                key={codigo}
                className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] border border-border bg-card shadow-sm"
              >
                <CommodityImageCard
                  src="/placeholder-commodity.png"
                  alt={nome}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight">{nome}</p>
                  <p className="text-xs text-muted-foreground font-mono">{codigo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <p className="text-xs font-mono text-muted-foreground">
            container: --muted &nbsp;·&nbsp; border: --border/60 &nbsp;·&nbsp;
            radius: --radius-md &nbsp;·&nbsp; image: object-contain + p-1.5 &nbsp;·&nbsp;
            sizes: sm=64px / md=96px / lg=128px
          </p>
        </div>
      </Section>

      {/* ── CARD SELECAO CENARIO ANALISE ── */}
      <Section title="CardSelecaoCenarioAnalise">
        <p className="text-xs text-muted-foreground mb-4">
          Seletor de cenario para analises de derivativos. Tres estrategias — Conservador, Moderado e Agressivo —
          com o cenario central destacado como recomendado. Botao de selecao segue o mesmo padrao visual do{" "}
          <code className="font-mono bg-muted px-1 rounded">LoginCard</code>.
        </p>
        <div
          className="rounded-2xl p-8 md:p-12"
          style={{
            background: "linear-gradient(135deg, oklch(0.08 0.03 145), oklch(0.14 0.04 145), oklch(0.10 0.025 90))",
          }}
        >
          <CardSelecaoCenarioAnalise />
        </div>
        <div className="mt-3 p-3 bg-muted rounded-lg">
          <p className="text-xs font-mono text-muted-foreground">
            bg: #081F0F &nbsp;·&nbsp;
            borda destaque: --accent/30 &nbsp;·&nbsp;
            metrica: --accent &nbsp;·&nbsp;
            botao: padrao LoginCard (border-white/10 + hover slide)
          </p>
        </div>
      </Section>

      {/* ── CHATMESSAGE ── */}
      <Section title="ChatMessage">
        <p className="text-xs text-muted-foreground mb-4">
          Bolha de mensagem do Mauro. Mensagens do Mauro aparecem a esquerda com avatar verde; mensagens do usuario aparecem a direita com avatar accent. O cursor pulsante indica streaming em progresso.
        </p>
        <div className="rounded-[var(--radius-xl)] border border-border bg-card overflow-hidden max-w-2xl">
          <ChatMessage role="ai" content="Ola! Sou o Mauro. Posso analisar suas solicitacoes de derivativos, comparar cenarios Black-Scholes e responder perguntas sobre commodities. Como posso ajudar?" />
          <ChatMessage role="human" content="Qual cenario foi recomendado na analise de soja de hoje?" />
          <ChatMessage role="ai" content="Na ultima analise de soja (ID 47), o cenario Moderado foi recomendado pelo modelo. Preco de exercicio: R$ 132,50/60kg, premio de 2,4% e ponto de equilibrio em R$ 129,34. Deseja ver os detalhes completos?" />
          <ChatMessage role="human" content="Sim, quero comparar com o cenario conservador." />
          <ChatMessage role="ai" content="Comparando os cenarios..." isStreaming />
        </div>
        <div className="mt-3 p-3 bg-muted rounded-lg">
          <p className="text-xs font-mono text-muted-foreground">
            ai: bg --primary / text --primary-foreground (avatar esquerda) &nbsp;·&nbsp;
            human: bg --primary / text --primary-foreground (avatar --accent) &nbsp;·&nbsp;
            isStreaming: cursor animate-pulse inline-block
          </p>
        </div>
      </Section>

      {/* ── CHATINTERFACE (MOCK ESTATICO) ── */}
      <Section title="ChatInterface">
        <p className="text-xs text-muted-foreground mb-4">
          Interface completa de chat com streaming SSE. O componente real chama <code className="font-mono bg-muted px-1 rounded">createConversation</code> no mount e <code className="font-mono bg-muted px-1 rounded">streamMessage</code> a cada envio. Abaixo: preview estatico do layout.
        </p>
        <div className="rounded-[var(--radius-xl)] border border-border bg-card overflow-hidden max-w-2xl" style={{ height: 440 }}>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              <ChatMessage role="ai" content="Faca uma pergunta sobre suas analises de derivativos." />
              <ChatMessage role="human" content="Qual o lucro maximo estimado no cenario agressivo?" />
              <ChatMessage role="ai" content="No cenario agressivo da sua ultima analise, o lucro maximo estimado e de R$ 8.400,00 por contrato (500 sacas), considerando preco de exercicio a R$ 140,00/60kg e vencimento em julho/2025." />
            </div>
            <div className="border-t border-[var(--border)] p-4">
              <div className="flex gap-2">
                <div className="flex-1 h-10 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 flex items-center">
                  <span className="text-sm text-[var(--muted-foreground)]">Pergunte sobre suas analises...</span>
                </div>
                <div className="h-10 w-10 rounded-[var(--radius-md)] bg-[var(--primary)] flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary-foreground)]"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 p-3 bg-muted rounded-lg">
          <p className="text-xs font-mono text-muted-foreground">
            rota: /chat &nbsp;·&nbsp; query: ?analise_id=N &nbsp;·&nbsp;
            stream: POST /api/v1/chat/stream/ SSE &nbsp;·&nbsp;
            container: --card + --radius-xl + border --border &nbsp;·&nbsp;
            input: --background + --border
          </p>
        </div>
      </Section>

      {/* Footer */}
      <div className="border-t border-border pt-6 pb-16">
        <p className="text-xs text-muted-foreground">
          AgroComex Design System &nbsp;·&nbsp; CESAR School 2026.1 &nbsp;·&nbsp;
          Projeto 5 — Federated Learning para Exportações de Commodities &nbsp;·&nbsp;
          Fontes: ComexStat/MDIC · AgroStat/MAPA · CONAB · BCB
        </p>
      </div>
    </div>
  );
}
