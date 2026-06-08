import type { ChartPoint, DashboardResponse, MetricCard } from "../types";
import { getStaticMarketSignals } from "@/lib/market/transformers/card-data";

type OfficialMarketData = {
  laborMarket: {
    latestCut: {
      label: string;
      previousLabel: string;
      unemploymentRate: number;
      previousUnemploymentRate: number;
      participationRate: number;
      previousParticipationRate: number;
      employmentRate: number;
      previousEmploymentRate?: number;
      urbanUnemploymentRate: number;
      previousUrbanUnemploymentRate: number;
      urbanParticipationRate: number;
      previousUrbanParticipationRate: number;
      urbanEmploymentRate: number;
    };
    unemploymentSeries: ChartPoint[];
    employmentSeries: ChartPoint[];
    participationSeries: ChartPoint[];
    urbanUnemploymentSeries: ChartPoint[];
  };
};

type SecondaryMarketData = {
  vacancies: {
    activeCount: number;
    activeCountSeries: ChartPoint[];
    topOccupations: ChartPoint[];
    topSkills: ChartPoint[];
    topSectors: ChartPoint[];
    topCompanies: ChartPoint[];
    avgSalary: number;
    avgSalarySeries: ChartPoint[];
    realSalaryVsInflationSeries: ChartPoint[];
    salaryVacancyBands: ChartPoint[];
    medianSalary: number;
    medianSalarySeries: ChartPoint[];
    salaryRange: {
      min: number;
      max: number;
    };
    minimumSalarySeries: ChartPoint[];
    salaryBySector: ChartPoint[];
    salaryBySeniority: ChartPoint[];
    avgExperienceYears: number;
    experienceDistribution: ChartPoint[];
    educationLevels: ChartPoint[];
    workModes: ChartPoint[];
    topTools: ChartPoint[];
    laborConditionsTimeline: ChartPoint[];
    educationDemandTimeline: ChartPoint[];
  };
};

export function buildMarketCards(
  officialData: OfficialMarketData,
  secondaryData: SecondaryMarketData,
): DashboardResponse {
  const now = new Date().toISOString();

  const labor = officialData.laborMarket;
  const vacancies = secondaryData.vacancies;
  const latestCut = labor.latestCut;
  const unemploymentSeries = labor.unemploymentSeries;
  const employmentSeries = labor.employmentSeries;
  const currentUnemployment = latestCut.unemploymentRate;
  const currentEmployment = latestCut.employmentRate;
  const annualDelta = -0.7;
  const {
    annualUnemploymentDeltaSeries,
    activeVacanciesSeries,
    educationDemandTimeline,
    topOccupations,
    topSkills,
  } = getStaticMarketSignals();
  const topSectors = [
    { label: "2020", value: 1 },
    { label: "2021", value: 2 },
    { label: "2022", value: 3 },
    { label: "2023", value: 4 },
    { label: "2024", value: 5 },
    { label: "2025", value: 6 },
    { label: "2026", value: 7 },
  ];
  const topCompanies = [
    { label: "2020", value: 1 },
    { label: "2021", value: 2 },
    { label: "2022", value: 3 },
    { label: "2023", value: 4 },
    { label: "2024", value: 5 },
    { label: "2025", value: 6 },
    { label: "2026", value: 7 },
  ];
  const laborConditionsTimeline = [
    { label: "2020", value: 1 },
    { label: "2021", value: 2 },
    { label: "2022", value: 3 },
    { label: "2023", value: 4 },
    { label: "2024", value: 5 },
    { label: "2025", value: 6 },
    { label: "2026", value: 7 },
  ];
  const averageIncomeSeries = [
    { label: "2020", value: 1000000 },
    { label: "2021", value: 1100000 },
    { label: "2022", value: 1300000 },
    { label: "2023", value: 1400000 },
    { label: "2024", value: 1500000 },
    { label: "2025", value: 1550000 },
    { label: "2026", value: 1550000 },
  ];
  const realSalaryVsInflationSeries = [
    { label: "2020", value: 1.5 },
    { label: "2021", value: 3.5 },
    { label: "2022", value: 2.5 },
    { label: "2023", value: 2.5 },
    { label: "2024", value: 3.5 },
    { label: "2025", value: 3.0 },
  ];
  const salaryVacancyBands = [
    { label: "1M – 2M", value: 20 },
    { label: "2M – 3M", value: 35 },
    { label: "3M – 4M", value: 22 },
    { label: "4M – 5M", value: 12 },
    { label: "Más de 5M", value: 8 },
  ];
  const minimumSalarySeries = [
    { label: "2020", value: 877803 },
    { label: "2021", value: 908526 },
    { label: "2022", value: 1000000 },
    { label: "2023", value: 1160000 },
    { label: "2024", value: 1300000 },
    { label: "2025", value: 1423500 },
    { label: "2026", value: 1750905 },
  ];
  const experienceDistribution = [
    { label: "2020", value: 0.5 },
    { label: "2021", value: 0.8 },
    { label: "2022", value: 1.0 },
    { label: "2023", value: 1.25 },
    { label: "2024", value: 1.5 },
    { label: "2025", value: 0.8 },
    { label: "2026", value: 1.5 },
  ];
  const workModes = [
    { label: "Presencial", value: 82 },
    { label: "Híbrido", value: 13 },
    { label: "Remoto", value: 5 },
  ];
  const cards: MetricCard[] = [
    {
      id: "unemployment-rate",
      section: "mercado",
      eyebrow: "Mercado",
      title: "Tasa de desempleo",
      value: currentUnemployment,
      unit: "%",
      meta: "Serie anual 2020–2025 + enero de 2026",
      description: "En enero de 2026, la tasa de desempleo fue 10,9%, menor frente al 11,6% registrado en enero de 2025 (−0,7 pp interanual). El nivel es superior al cierre de 2025 por efectos estacionales propios de inicio de año.",
      status: "official",
      sourceLabel: "Fuente oficial",
      chartType: "bar",
      chartPoints: unemploymentSeries,
      priority: 1
    },
    {
      id: "employment-rate",
      section: "mercado",
      eyebrow: "Mercado",
      title: "Tasa de ocupación",
      value: currentEmployment,
      unit: "%",
      meta: "Serie anual 2020–2025 + enero de 2026",
      description: "Recuperación sostenida tras la pandemia, con una tasa de ocupación de 56,7% en enero de 2026, en línea con los niveles recientes del mercado laboral.",
      status: "official",
      sourceLabel: "Fuente oficial",
      chartType: "bar",
      chartPoints: employmentSeries,
      priority: 2
    },
    {
      id: "annual-unemployment-delta",
      section: "mercado",
      eyebrow: "Mercado",
      title: "Variación anual del desempleo",
      value: `${annualDelta > 0 ? "+" : ""}${annualDelta} pp`,
      meta: "Serie 2020–2025 + enero 2026 (pp vs mismo mes año anterior)",
      description: "En enero de 2026 la variación anual fue de −0,7 pp frente a enero de 2025, lo que confirma mejora interanual, aunque el nivel total del desempleo sigue por encima del cierre de 2025 por efecto estacional.",
      status: "official",
      sourceLabel: "Fuente oficial",
      chartType: "line",
      chartPoints: annualUnemploymentDeltaSeries,
      priority: 3
    },
    {
      id: "annual-unemployment-comparison",
      section: "mercado",
      eyebrow: "Mercado",
      title: "Comparación anual del desempleo",
      value: "2020–2025 + ene 2026",
      meta: "Tasa y cambio anual",
      description: "Comparación anual del desempleo con su tasa y cambio frente al período comparable.",
      status: "official",
      sourceLabel: "Fuente oficial",
      chartType: "bar",
      chartPoints: unemploymentSeries,
      priority: 4
    },
    {
      id: "active-vacancies",
      section: "demanda",
      eyebrow: "Demanda",
      title: "Vacantes activas",
      value: null,
      meta: undefined,
      description: "Serie estimada de vacantes activas del mercado formal basada en señales de SPE, SENA y portales de empleo entre 2020 y enero de 2026.",
      status: "secondary",
      sourceLabel: "Señal del mercado",
      chartType: "horizontal-bar",
      chartPoints: activeVacanciesSeries,
      priority: 5
    },
    {
      id: "education-demand",
      section: "demanda",
      eyebrow: "Demanda",
      title: "Nivel educativo más demandado",
      value: null,
      meta: undefined,
      description: "Predominio de bachiller, técnico y tecnólogo según el momento del mercado entre 2020 y 2026.",
      status: "secondary",
      sourceLabel: "Señal del mercado",
      chartType: "none",
      chartPoints: educationDemandTimeline,
      priority: 6
    },
    {
      id: "top-occupations",
      section: "demanda",
      eyebrow: "Demanda",
      title: "Ocupaciones más demandadas",
      value: null,
      meta: undefined,
      description: "Roles con mayor frecuencia en las vacantes activas.",
      status: "secondary",
      sourceLabel: "Señal del mercado",
      chartType: "none",
      chartPoints: topOccupations,
      priority: 7
    },
    {
      id: "top-skills",
      section: "demanda",
      eyebrow: "Demanda",
      title: "Skills más solicitadas",
      value: null,
      meta: undefined,
      description: "Habilidades blandas, técnicas y operativas con mayor recurrencia en la demanda reciente.",
      status: "secondary",
      sourceLabel: "Señal del mercado",
      chartType: "none",
      chartPoints: topSkills,
      priority: 8
    },
    {
      id: "top-sectors",
      section: "demanda",
      eyebrow: "Demanda",
      title: "Sectores con más vacantes",
      value: null,
      meta: undefined,
      description: "Evolución anual de los sectores con mayor presencia en el mercado.",
      status: "secondary",
      sourceLabel: "Señal del mercado",
      chartType: "none",
      chartPoints: topSectors,
      priority: 9
    },
    {
      id: "top-companies",
      section: "demanda",
      eyebrow: "Demanda",
      title: "Empresas con más ofertas",
      value: null,
      meta: undefined,
      description: "Empresas más visibles por volumen de contratación en cada etapa.",
      status: "secondary",
      sourceLabel: "Señal del mercado",
      chartType: "none",
      chartPoints: topCompanies,
      priority: 10
    },
    {
      id: "labor-conditions",
      section: "demanda",
      eyebrow: "Demanda",
      title: "Condiciones laborales",
      value: null,
      meta: undefined,
      description: "Resumen anual de empleo, formalidad, contratos, salarios y modalidad laboral entre 2020 y 2026.",
      status: "secondary",
      sourceLabel: "Señal del mercado",
      chartType: "none",
      chartPoints: laborConditionsTimeline,
      priority: 11
    },
    {
      id: "average-salary",
      section: "salarios",
      eyebrow: "Salarios",
      title: "Ingreso laboral promedio (referencial)",
      value: "$1,4M – $1,7M",
      meta: "Serie estimada 2020–2026",
      description: "Rango estimado del ingreso laboral promedio en Colombia. Debe leerse como referencia de mercado y no como un salario único oficial para todos los ocupados.",
      status: "secondary",
      sourceLabel: "Señal del mercado",
      chartType: "line",
      chartPoints: averageIncomeSeries,
      priority: 12
    },
    {
      id: "real-salary-vs-inflation",
      section: "salarios",
      eyebrow: "Salarios",
      title: "Cambio real del salario mínimo (ajustado por inflación)",
      value:
        realSalaryVsInflationSeries[realSalaryVsInflationSeries.length - 1]?.value ?? null,
      unit: "%",
      meta: "Serie 2020–2025",
      description: "Cambio real aproximado del salario mínimo ajustado por inflación. No representa ingreso promedio del mercado, sino poder adquisitivo del salario mínimo.",
      status: "secondary",
      sourceLabel: "Señal del mercado",
      chartType: "none",
      chartPoints: realSalaryVsInflationSeries,
      priority: 13
    },
    {
      id: "salary-vacancy-bands",
      section: "salarios",
      eyebrow: "Salarios",
      title: "Porcentaje de trabajos por rango salarial",
      value: null,
      unit: "%",
      meta: "Portales de empleo y SPE",
      description: "Distribución estimada de vacantes por rango salarial. Es una referencia de mercado y no una estadística oficial del DANE.",
      status: "secondary",
      sourceLabel: "Señal del mercado",
      chartType: "horizontal-bar",
      chartPoints: salaryVacancyBands,
      priority: 14
    },
    {
      id: "minimum-salary-history",
      section: "salarios",
      eyebrow: "Salarios",
      title: "Historial de salario mínimo",
      value:
        minimumSalarySeries[minimumSalarySeries.length - 1]?.value ??
        null,
      unit: "COP",
      meta: "2020–2026",
      description: "Histórico del salario mínimo legal. El dato de 2026 debe leerse como estimado dentro de un rango aproximado, no como un valor definitivo cerrado.",
      status: "official",
      sourceLabel: "Fuente oficial",
      chartType: "line",
      chartPoints: minimumSalarySeries,
      priority: 15
    },
    {
      id: "salary-by-sector",
      section: "salarios",
      eyebrow: "Salarios",
      title: "Salario por sector (referencial)",
      value: null,
      meta: undefined,
      description: "Rangos salariales estimados según comportamiento del mercado laboral en Colombia. No corresponden a estadísticas oficiales del DANE ni del Ministerio de Trabajo.",
      status: "secondary",
      sourceLabel: "Señal del mercado",
      chartType: "none",
      chartPoints: vacancies.salaryBySector,
      priority: 16
    },
    {
      id: "salary-by-seniority",
      section: "salarios",
      eyebrow: "Salarios",
      title: "Salario por experiencia (referencial)",
      value: null,
      meta: undefined,
      description: "Rangos salariales estimados según experiencia y nivel de responsabilidad en el mercado laboral. No corresponden a estadísticas oficiales.",
      status: "secondary",
      sourceLabel: "Señal del mercado",
      chartType: "none",
      chartPoints: vacancies.salaryBySeniority,
      priority: 17
    },
    {
      id: "demand-vs-salary",
      section: "oportunidades",
      eyebrow: "Oportunidades",
      title: "Dónde están las oportunidades reales",
      value: null,
      meta: undefined,
      description: "Volumen de vacantes frente al nivel salarial esperado en las ocupaciones con mayor peso del mercado.",
      status: "secondary",
      sourceLabel: "Señal del mercado",
      chartType: "none",
      chartPoints: [],
      priority: 18
    },
    {
      id: "avg-experience",
      section: "perfil",
      eyebrow: "Perfil",
      title: "Experiencia promedio requerida",
      value: "1–2 años",
      meta: "Evolución 2020–2026",
      description: "La entrada al mercado sigue siendo accesible para perfiles junior, pero con una exigencia mínima de experiencia cada vez más clara.",
      status: "secondary",
      sourceLabel: "Señal del mercado",
      chartType: "line",
      chartPoints: experienceDistribution,
      priority: 20
    },
    {
      id: "work-mode",
      section: "perfil",
      eyebrow: "Perfil",
      title: "Modalidad de trabajo",
      value: "Presencial",
      meta: "Distribución 2026",
      description: "Predomina el trabajo presencial en Colombia, con remoto concentrado en nichos y el híbrido limitado a empresas formales.",
      status: "secondary",
      sourceLabel: "Señal del mercado",
      chartType: "donut",
      chartPoints: workModes,
      priority: 21
    },
    {
      id: "top-tools",
      section: "perfil",
      eyebrow: "Perfil",
      title: "Certificaciones y herramientas clave",
      value: null,
      meta: undefined,
      description: "Qué están pidiendo las empresas en Colombia por área, con foco en certificaciones útiles y herramientas que pesan en contratación.",
      status: "secondary",
      sourceLabel: "Señal del mercado",
      chartType: "none",
      chartPoints: vacancies.topTools,
      priority: 22
    }
  ];

  return {
    updatedAt: now,
    cards: cards.sort((a, b) => a.priority - b.priority)
  };
}
