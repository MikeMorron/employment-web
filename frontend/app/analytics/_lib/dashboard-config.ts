export type InsightTone = "good" | "warning" | "neutral";

export type GridLayoutItem = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
};

export type Layouts = Record<string, GridLayoutItem[]>;

export type DateRangePreset = "7d" | "30d" | "custom";

export type WidgetId =
  | "funnel"
  | "trend"
  | "performance"
  | "pipeline"
  | "stage_time"
  | "matching";

export type ChartType =
  | "bars"
  | "line"
  | "area"
  | "circular"
  | "scatter"
  | "histogram"
  | "vertical"
  | "step"
  | "list";

export type WidgetConfig = {
  id: WidgetId;
  title: string;
  chartType: ChartType;
  hidden: boolean;
};

export type DashboardConfig = {
  rangePreset: DateRangePreset;
  customFrom: string;
  customTo: string;
  vacancyId: string;
  editMode: boolean;
  widgets: Record<WidgetId, WidgetConfig>;
  layouts: Layouts;
};

export type WidgetStat = {
  label: string;
  value: number;
};

export const WIDGET_ORDER: WidgetId[] = [
  "funnel",
  "trend",
  "performance",
  "pipeline",
  "stage_time",
  "matching",
];

export const DEFAULT_LAYOUT_LG: GridLayoutItem[] = [
  { i: "funnel", x: 0, y: 0, w: 6, h: 7, minW: 4, minH: 6 },
  { i: "trend", x: 6, y: 0, w: 6, h: 7, minW: 4, minH: 6 },
  { i: "performance", x: 0, y: 7, w: 6, h: 7, minW: 4, minH: 6 },
  { i: "pipeline", x: 6, y: 7, w: 6, h: 7, minW: 4, minH: 6 },
  { i: "stage_time", x: 0, y: 14, w: 6, h: 6, minW: 4, minH: 5 },
  { i: "matching", x: 6, y: 14, w: 6, h: 6, minW: 4, minH: 5 },
];

export const DEFAULT_LAYOUTS: Layouts = {
  lg: DEFAULT_LAYOUT_LG,
  md: DEFAULT_LAYOUT_LG.map((item) => ({
    ...item,
    x: item.x >= 6 ? 0 : item.x,
    y: item.x >= 6 ? item.y + 7 : item.y,
    w: 10,
  })),
  sm: DEFAULT_LAYOUT_LG.map((item, index) => ({
    ...item,
    x: 0,
    y: index * 6,
    w: 6,
  })),
};

export const DEFAULT_WIDGETS: Record<WidgetId, WidgetConfig> = {
  funnel: {
    id: "funnel",
    title: "Embudo por vacante",
    chartType: "bars",
    hidden: false,
  },
  trend: {
    id: "trend",
    title: "Postulaciones por tiempo",
    chartType: "line",
    hidden: false,
  },
  performance: {
    id: "performance",
    title: "Rendimiento por vacante",
    chartType: "bars",
    hidden: false,
  },
  pipeline: {
    id: "pipeline",
    title: "Distribución del pipeline",
    chartType: "circular",
    hidden: false,
  },
  stage_time: {
    id: "stage_time",
    title: "Tiempo por etapa",
    chartType: "bars",
    hidden: false,
  },
  matching: {
    id: "matching",
    title: "Calidad de coincidencia",
    chartType: "circular",
    hidden: false,
  },
};

export const DEFAULT_CONFIG: DashboardConfig = {
  rangePreset: "7d",
  customFrom: "",
  customTo: "",
  vacancyId: "",
  editMode: false,
  widgets: DEFAULT_WIDGETS,
  layouts: DEFAULT_LAYOUTS,
};

export const DASHBOARD_PRESETS: Array<{
  id: string;
  label: string;
  apply: (current: DashboardConfig) => DashboardConfig;
}> = [
  {
    id: "company_operational",
    label: "Operativo",
    apply: (current) => ({
      ...current,
      widgets: {
        ...current.widgets,
        funnel: { ...current.widgets.funnel, hidden: false, chartType: "bars" },
        trend: { ...current.widgets.trend, hidden: false, chartType: "line" },
        performance: {
          ...current.widgets.performance,
          hidden: false,
          chartType: "bars",
        },
        pipeline: {
          ...current.widgets.pipeline,
          hidden: false,
          chartType: "circular",
        },
        stage_time: {
          ...current.widgets.stage_time,
          hidden: false,
          chartType: "bars",
        },
        matching: {
          ...current.widgets.matching,
          hidden: false,
          chartType: "circular",
        },
      },
    }),
  },
  {
    id: "company_conversion",
    label: "Conversión",
    apply: (current) => ({
      ...current,
      widgets: {
        ...current.widgets,
        funnel: { ...current.widgets.funnel, hidden: false, chartType: "step" },
        trend: { ...current.widgets.trend, hidden: false, chartType: "area" },
        performance: {
          ...current.widgets.performance,
          hidden: false,
          chartType: "scatter",
        },
        pipeline: {
          ...current.widgets.pipeline,
          hidden: true,
          chartType: "circular",
        },
        stage_time: {
          ...current.widgets.stage_time,
          hidden: true,
          chartType: "bars",
        },
        matching: { ...current.widgets.matching, hidden: false, chartType: "bars" },
      },
    }),
  },
  {
    id: "company_executive",
    label: "Ejecutivo",
    apply: (current) => ({
      ...current,
      widgets: {
        ...current.widgets,
        funnel: { ...current.widgets.funnel, hidden: false, chartType: "bars" },
        trend: { ...current.widgets.trend, hidden: false, chartType: "line" },
        performance: {
          ...current.widgets.performance,
          hidden: true,
          chartType: "bars",
        },
        pipeline: { ...current.widgets.pipeline, hidden: false, chartType: "list" },
        stage_time: {
          ...current.widgets.stage_time,
          hidden: true,
          chartType: "bars",
        },
        matching: {
          ...current.widgets.matching,
          hidden: false,
          chartType: "circular",
        },
      },
    }),
  },
];

export function getDaysSince(date: string) {
  return Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
}
