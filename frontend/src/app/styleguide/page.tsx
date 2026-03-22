import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <div className="flex-1 h-px bg-border" />
      </div>
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
            <h5 className="text-lg font-medium">AgroChat — Assistente Contextual com IA Generativa</h5>
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
