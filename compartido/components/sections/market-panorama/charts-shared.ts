import type { ChartPoint, MetricCard } from "@/lib/market/types";

export type MiniChartProps = {
  isDark: boolean;
  card: MetricCard;
  series: ChartPoint[];
};
