export interface NavItem {
  name: string;
  href: string;
  tag?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    title: "Foundation",
    items: [{ name: "Design Tokens", href: "/styleguide" }],
  },
  {
    title: "Módulos MVP",
    items: [
      { name: "ComexMap", href: "/styleguide/components/comexmap", tag: "MVP" },
      { name: "PriceStory", href: "/styleguide/components/pricestory", tag: "MVP" },
      { name: "AgroChat", href: "/styleguide/components/agrochat", tag: "MVP" },
    ],
  },
  {
    title: "Componentes",
    items: [
      { name: "BarChart", href: "/styleguide/components/bar-chart" },
      { name: "LineChart", href: "/styleguide/components/line-chart" },
      { name: "PieChart", href: "/styleguide/components/pie-chart" },
      { name: "WorldMap", href: "/styleguide/components/world-map" },
      { name: "CardSelecaoCenario", href: "/styleguide/components/card-selecao-cenario" },
      { name: "ScatterChart", href: "/styleguide/components/scatter-chart" },
    ],
  },
  {
    title: "Core Técnico",
    items: [
      { name: "FedPredict", href: "/styleguide/components/fedpredict", tag: "FL" },
    ],
  },
];
