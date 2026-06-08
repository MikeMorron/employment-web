export type DataStatus = "official" | "derived" | "secondary" | "pending";

export type ChartType =
  | "bar"
  | "horizontal-bar"
  | "line"
  | "sparkline"
  | "donut"
  | "range"
  | "none";

export type DashboardSection =
  | "mercado"
  | "demanda"
  | "salarios"
  | "oportunidades"
  | "perfil";

export type ChartPoint = {
  label: string;
  value: number;
};

export type MetricCard = {
  id: string;
  section: DashboardSection;
  eyebrow: string;
  title: string;
  value: string | number | null;
  unit?: string;
  meta?: string;
  description: string;
  status: DataStatus;
  sourceLabel: string;
  chartType: ChartType;
  chartPoints?: ChartPoint[];
  priority: number;
};

export type DashboardResponse = {
  updatedAt: string;
  cards: MetricCard[];
};
