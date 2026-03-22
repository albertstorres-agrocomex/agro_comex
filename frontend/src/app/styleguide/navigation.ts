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
    title: "Core Técnico",
    items: [
      { name: "FedPredict", href: "/styleguide/components/fedpredict", tag: "FL" },
    ],
  },
];
