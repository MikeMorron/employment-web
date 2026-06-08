import type {
  ChartPoint,
  DashboardResponse,
  DashboardSection,
  MetricCard,
} from "@/lib/market/types";
import { formatCOP } from "@/lib/market/utils";
import {
  ANNUAL_UNEMPLOYMENT_CHANGE_ROWS,
  ANNUAL_UNEMPLOYMENT_DELTA_SUMMARIES,
  LOCALIZED_CARD_OVERRIDES_EN,
  MARKET_CHART_LABELS_EN,
  MARKET_CONCLUSION_COPY,
  MARKET_EDUCATION_LABELS_EN,
} from "@/components/sections/market-panorama/copy";

export const sectionMeta: Record<
  DashboardSection,
  {
    title: { es: string; en: string };
    description: { es: string; en: string };
  }
> = {
  mercado: {
    title: { es: "Mercado", en: "Market" },
    description: {
      es: "Cómo está el mercado laboral hoy.",
      en: "How the job market looks today.",
    },
  },
  demanda: {
    title: { es: "Demanda", en: "Demand" },
    description: {
      es: "Qué están buscando las empresas.",
      en: "What companies are looking for.",
    },
  },
  salarios: {
    title: { es: "Salarios", en: "Salaries" },
    description: {
      es: "Cuánto está pagando el mercado.",
      en: "How much the market is paying.",
    },
  },
  oportunidades: {
    title: {
      es: "Dónde están las oportunidades reales",
      en: "Where the real opportunities are",
    },
    description: {
      es: "Dónde hay volumen de vacantes y cómo se cruza con el salario.",
      en: "Where job volume is concentrated and how it intersects with salary.",
    },
  },
  perfil: {
    title: { es: "Perfil del candidato", en: "Candidate profile" },
    description: {
      es: "Qué necesita una persona para ser competitiva.",
      en: "What a person needs to stay competitive.",
    },
  },
};

function createFallbackDashboard(): DashboardResponse {
  return {
    updatedAt: new Date().toISOString(),
    cards: [],
  };
}

export function sanitizeDashboard(
  payload: Partial<DashboardResponse> | undefined,
): DashboardResponse {
  const fallback = createFallbackDashboard();

  return {
    updatedAt: payload?.updatedAt ?? fallback.updatedAt,
    cards: Array.isArray(payload?.cards) ? payload.cards : fallback.cards,
  };
}

export function groupCards(cards: MetricCard[]) {
  const sorted = [...cards].sort((a, b) => a.priority - b.priority);
  const map = new Map<
    DashboardSection,
    { title: string; description: string; cards: MetricCard[] }
  >();

  for (const section of [
    "mercado",
    "demanda",
    "salarios",
    "oportunidades",
    "perfil",
  ] as const) {
    map.set(section, {
      title: sectionMeta[section].title.es,
      description: sectionMeta[section].description.es,
      cards: [],
    });
  }

  for (const card of sorted) {
    map.get(card.section)?.cards.push(card);
  }

  return [...map.entries()]
    .map(([section, value]) => ({ section, ...value }))
    .filter((group) => group.cards.length > 0);
}

function translateChartLabel(cardId: string, label: string, isEnglish: boolean) {
  if (!isEnglish) {
    return label;
  }

  if (MARKET_CHART_LABELS_EN[label]) {
    return MARKET_CHART_LABELS_EN[label];
  }

  if (cardId === "education-demand") {
    return MARKET_EDUCATION_LABELS_EN[label] ?? label;
  }

  return label;
}

export function localizeCard(card: MetricCard, isEnglish: boolean): MetricCard {
  if (!isEnglish) {
    return card;
  }

  const overrides = LOCALIZED_CARD_OVERRIDES_EN[card.id] ?? {};

  return {
    ...card,
    ...overrides,
    chartPoints: (card.chartPoints ?? []).map((point) => ({
      ...point,
      label: translateChartLabel(card.id, point.label, isEnglish),
    })),
  };
}

export function getConclusionCopy(isEnglish: boolean) {
  return MARKET_CONCLUSION_COPY[isEnglish ? "en" : "es"];
}

export function getFeaturedMarketCards(cards: MetricCard[]) {
  return {
    primary: ["unemployment-rate", "employment-rate"]
      .map((id) => cards.find((card) => card.id === id))
      .filter(Boolean) as MetricCard[],
    secondary: ["annual-unemployment-delta", "annual-unemployment-comparison"]
      .map((id) => cards.find((card) => card.id === id))
      .filter(Boolean) as MetricCard[],
  };
}

export function formatMetricValue(card: MetricCard, isEnglish: boolean) {
  if (card.value === null || card.value === "") {
    return isEnglish ? "No data" : "Sin dato";
  }

  if (typeof card.value === "number") {
    if (card.unit === "%") {
      return `${card.value}%`;
    }

    if (card.unit === "COP") {
      return formatCOP(card.value);
    }

    if (card.unit === "años") {
      return `${card.value} años`;
    }
  }

  return String(card.value);
}

export function formatChartValue(value: number) {
  if (value >= 1_000_000) {
    return `${Math.round(value / 100_000) / 10}M`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 100) / 10}k`;
  }

  return `${Math.round(value)}`;
}

export function formatSeriesValue(card: MetricCard, value: number) {
  if (card.unit === "%") {
    return `${value}%`;
  }

  if (card.unit === "COP") {
    return formatCOP(value);
  }

  if (card.unit === "años") {
    return `${value} años`;
  }

  return formatChartValue(value);
}

export function formatBarHeaderValue(card: MetricCard, value: number) {
  if (card.unit === "%") {
    return `${value.toFixed(1)}%`;
  }

  if (card.unit === "años") {
    return `${value.toFixed(1)}`;
  }

  return formatChartValue(value);
}

export function getSeriesScaleBounds(card: MetricCard, series: ChartPoint[]) {
  const values = series.map((item) => item.value);

  if (card.unit === "%") {
    return {
      min: 0,
      max: 100,
    };
  }

  return {
    min: Math.min(...values, 0),
    max: Math.max(...values, 1),
  };
}

export function getAnnualUnemploymentChangeRows(isEnglish: boolean) {
  return ANNUAL_UNEMPLOYMENT_CHANGE_ROWS[isEnglish ? "en" : "es"];
}

export function getAnnualUnemploymentDeltaSummary(isEnglish: boolean) {
  return ANNUAL_UNEMPLOYMENT_DELTA_SUMMARIES[isEnglish ? "en" : "es"];
}
