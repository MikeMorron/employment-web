import type { MetricCard } from "@/lib/market/types";

export const MARKET_CHART_LABELS_EN: Record<string, string> = {
  "2026 (ene)": "2026 (Jan)",
  Presencial: "On-site",
  Híbrido: "Hybrid",
  Remoto: "Remote",
  "Más de 5M": "More than 5M",
  "Ventas y asesores comerciales": "Sales and commercial advisors",
  "Servicio al cliente / call center": "Customer service / call center",
  "Operarios / producción": "Operators / production",
  "Logística y transporte": "Logistics and transportation",
  "Auxiliares administrativos": "Administrative assistants",
  "Construcción (oficiales, ayudantes)": "Construction (crew, helpers)",
  "Salud (auxiliares, enfermería)": "Healthcare (assistants, nursing)",
  "Seguridad (vigilantes)": "Security (guards)",
  "Contabilidad / apoyo financiero": "Accounting / finance support",
  "Tecnología (menos volumen, más especializada)": "Technology (lower volume, more specialized)",
  Educación: "Education",
  "Comunicación efectiva": "Effective communication",
  "Trabajo en equipo": "Teamwork",
  "Responsabilidad y puntualidad": "Responsibility and punctuality",
  "Orientación al cliente": "Customer orientation",
  Adaptabilidad: "Adaptability",
  "Manejo de Excel y herramientas Office": "Excel and Office tools",
  "Atención al cliente / CRM": "Customer service / CRM",
  "Ventas y negociación": "Sales and negotiation",
  "Logística e inventarios": "Logistics and inventory",
  "Soporte TI básico / herramientas digitales": "Basic IT support / digital tools",
  "Manejo de maquinaria o equipos": "Machinery or equipment handling",
  "Procesos de producción": "Production processes",
  "Conducción (licencias C1, C2, etc.)": "Driving (C1, C2, etc. licenses)",
  "Manipulación de alimentos": "Food handling",
  "Picking / packing / logística básica": "Picking / packing / basic logistics",
};

export const MARKET_EDUCATION_LABELS_EN: Record<string, string> = {
  Bachiller: "High school",
  "Bachiller / técnico": "High school / technical",
  "Técnico / tecnólogo": "Technical / technologist",
  "Técnico/tecnólogo + profesional": "Technical / technologist + professional",
};

export const LOCALIZED_CARD_OVERRIDES_EN: Partial<Record<string, Partial<MetricCard>>> = {
  "unemployment-rate": {
    eyebrow: "Market",
    title: "Unemployment rate",
    meta: "Annual series 2020-2025 + January 2026",
    description:
      "In January 2026, the unemployment rate was 10.9%, lower than the 11.6% recorded in January 2025 (-0.7 pp year over year). The level remains above late 2025 due to seasonal start-of-year effects.",
    sourceLabel: "Official source",
  },
  "employment-rate": {
    eyebrow: "Market",
    title: "Employment rate",
    meta: "Annual series 2020-2025 + January 2026",
    description:
      "Steady recovery after the pandemic, with an employment rate of 56.7% in January 2026, in line with recent labor market levels.",
    sourceLabel: "Official source",
  },
  "annual-unemployment-delta": {
    eyebrow: "Market",
    title: "Annual unemployment change",
    meta: "Series 2020-2025 + January 2026 (pp vs same month previous year)",
    description:
      "In January 2026 the year-over-year change was -0.7 pp versus January 2025, confirming improvement, although total unemployment remains above late 2025 due to seasonality.",
    sourceLabel: "Official source",
  },
  "annual-unemployment-comparison": {
    eyebrow: "Market",
    title: "Annual unemployment comparison",
    value: "2020-2025 + Jan 2026",
    meta: "Rate and annual change",
    description:
      "Year-by-year unemployment comparison with its level and change versus the comparable period.",
    sourceLabel: "Official source",
  },
  "active-vacancies": {
    eyebrow: "Demand",
    title: "Active vacancies",
    description:
      "Estimated series of active vacancies in the formal market based on SPE, SENA, and job-board signals between 2020 and January 2026.",
    sourceLabel: "Market signal",
  },
  "education-demand": {
    eyebrow: "Demand",
    title: "Most demanded education level",
    description:
      "Dominance of high school, technical, and technologist profiles depending on the market cycle between 2020 and 2026.",
    sourceLabel: "Market signal",
  },
  "top-occupations": {
    eyebrow: "Demand",
    title: "Most demanded occupations",
    description: "Roles appearing most often in active vacancies.",
    sourceLabel: "Market signal",
  },
  "top-skills": {
    eyebrow: "Demand",
    title: "Most requested skills",
    description:
      "Soft, technical, and operational skills with the highest recurrence in recent demand.",
    sourceLabel: "Market signal",
  },
  "top-sectors": {
    eyebrow: "Demand",
    title: "Sectors with more vacancies",
    description:
      "Annual evolution of the sectors with the strongest market presence.",
    sourceLabel: "Market signal",
  },
  "top-companies": {
    eyebrow: "Demand",
    title: "Companies with more openings",
    description: "Companies with higher visible hiring volume in each stage.",
    sourceLabel: "Market signal",
  },
  "labor-conditions": {
    eyebrow: "Demand",
    title: "Labor conditions",
    description:
      "Yearly summary of employment, formality, contracts, wages, and work mode between 2020 and 2026.",
    sourceLabel: "Market signal",
  },
  "average-salary": {
    eyebrow: "Salaries",
    title: "Average labor income (reference)",
    meta: "Estimated series 2020-2026",
    description:
      "Estimated range of average labor income in Colombia. It should be read as a market reference, not as a single official wage for all employed people.",
    sourceLabel: "Market signal",
  },
  "real-salary-vs-inflation": {
    eyebrow: "Salaries",
    title: "Real minimum wage change (inflation-adjusted)",
    meta: "Series 2020-2025",
    description:
      "Evolution of the legal minimum wage once inflation is discounted, useful to understand real purchasing power.",
    sourceLabel: "Market signal",
  },
  "salary-range-share": {
    eyebrow: "Salaries",
    title: "Share of vacancies by salary range",
    description:
      "Visible salary distribution in Colombia across the most frequent compensation bands.",
    sourceLabel: "Market signal",
  },
  "minimum-wage-history": {
    eyebrow: "Salaries",
    title: "Minimum wage history",
    description:
      "Annual path of Colombia's legal minimum wage and its recent acceleration.",
    sourceLabel: "Official source",
  },
  "salary-by-sector": {
    eyebrow: "Salaries",
    title: "Salary by sector",
    description:
      "Sector comparison between better-paid and lower-paid job families in the visible market.",
    sourceLabel: "Market signal",
  },
  "salary-by-experience": {
    eyebrow: "Salaries",
    title: "Salary by experience level",
    description:
      "Salary ranges by experience band and expected level of responsibility.",
    sourceLabel: "Market signal",
  },
  "demand-vs-salary": {
    eyebrow: "Opportunities",
    title: "Where the real opportunities are",
    description:
      "Volume of vacancies versus wage quality to show where opportunity is abundant and where pay is stronger.",
    sourceLabel: "Integrated signal",
  },
  "market-trend-2026": {
    eyebrow: "Opportunities",
    title: "Labor market trend in 2026",
    description:
      "Compact reading of the current labor market, what companies are requiring, and where the short-term direction points.",
    sourceLabel: "Integrated signal",
  },
  "avg-experience": {
    eyebrow: "Profile",
    title: "Average required experience",
    description:
      "Evolution of required experience according to the recent market pattern between 2020 and 2026.",
    sourceLabel: "Market signal",
  },
  "work-mode": {
    eyebrow: "Profile",
    title: "Work mode distribution",
    description:
      "Visible split between on-site, hybrid, and remote work in the Colombian market.",
    sourceLabel: "Market signal",
  },
  "top-tools": {
    eyebrow: "Profile",
    title: "Key certifications and tools",
    description:
      "What companies in Colombia are asking for by area, with emphasis on useful certifications and tools that matter in hiring.",
    sourceLabel: "Market signal",
  },
};

export const MARKET_CONCLUSION_COPY = {
  en: {
    label: "Labor market conclusion (2020-2026)",
    text:
      "Colombia's labor market has recovered from the 2020 crisis, with unemployment falling to around 9% in 2025, although seasonal rebounds remain visible in 2026. Employment stays relatively stable around 56% to 58%, but demand is still concentrated in low and mid salary bands. Most openings favor junior, technical, and technological profiles, while higher salaries and specialized roles remain a minority. In general, the market shows more stability and volume, but relevant gaps in income quality and job quality still persist.",
  },
  es: {
    label: "Conclusión del mercado laboral (2020–2026)",
    text:
      "El mercado laboral en Colombia se ha recuperado desde la crisis de 2020, con una caída del desempleo hasta niveles cercanos a 9% en 2025, aunque con repuntes estacionales en 2026. La ocupación se mantiene estable entre 56% y 58%, pero el empleo sigue concentrado en rangos salariales bajos y medios. Predominan vacantes para perfiles junior y técnicos, mientras que los salarios altos y los roles especializados representan una minoría. En general, hay más estabilidad y volumen, pero persisten brechas en ingresos y calidad del empleo.",
  },
} as const;

export const ANNUAL_UNEMPLOYMENT_CHANGE_ROWS = {
  en: [
    { year: "2020", heading: "2020 (15.9% ▲ +5.4 pp): sharp increase due to the pandemic.", positive: true },
    { year: "2021", heading: "2021 (13.7% ▼ −2.2 pp): start of the recovery.", positive: false },
    { year: "2022", heading: "2022 (11.2% ▼ −2.5 pp): strong labor rebound.", positive: false },
    { year: "2023", heading: "2023 (10.2% ▼ −1.0 pp): slower improvement.", positive: false },
    { year: "2024", heading: "2024 (10.2% → 0.0 pp): relative stagnation.", positive: true },
    { year: "2025", heading: "2025 (8.9% ▼ −1.3 pp): fresh improvement.", positive: false },
    { year: "2026", heading: "2026 (10.9% ▼ −0.7 pp vs Jan 2025): year-on-year improvement with seasonal effect versus late 2025.", positive: false },
  ],
  es: [
    { year: "2020", heading: "2020 (15,9% ▲ +5,4 pp): fuerte aumento por la pandemia.", positive: true },
    { year: "2021", heading: "2021 (13,7% ▼ −2,2 pp): inicio de la recuperación.", positive: false },
    { year: "2022", heading: "2022 (11,2% ▼ −2,5 pp): fuerte rebote laboral.", positive: false },
    { year: "2023", heading: "2023 (10,2% ▼ −1,0 pp): mejora más lenta.", positive: false },
    { year: "2024", heading: "2024 (10,2% → 0,0 pp): relativa estabilización.", positive: true },
    { year: "2025", heading: "2025 (8,9% ▼ −1,3 pp): nueva mejora.", positive: false },
    { year: "2026", heading: "2026 (10,9% ▼ −0,7 pp vs ene 2025): mejora interanual con efecto estacional frente a finales de 2025.", positive: false },
  ],
} as const;

export const ANNUAL_UNEMPLOYMENT_DELTA_SUMMARIES = {
  en: [
    {
      title: "2020 (strong shock)",
      text: "Business closures, lockdowns, and lower economic activity. Result: massive job losses.",
    },
    {
      title: "2021-2023 (fast recovery)",
      text: "Economic reopening, sector reactivation, and workers returning. Result: a strong drop in unemployment.",
    },
    {
      title: "2024-2025 (moderate improvement)",
      text: "Employment keeps growing, but more slowly. Result: smaller unemployment reductions and stabilization.",
    },
    {
      title: "2026 (seasonal adjustment)",
      text: "Temporary year-end jobs end in January. Result: unemployment rises versus late 2025, but stays below January 2025.",
    },
  ],
  es: [
    {
      title: "2020 (choque fuerte)",
      text: "Cierre de empresas, cuarentenas y caída de la actividad económica. Resultado: pérdida masiva de empleos.",
    },
    {
      title: "2021-2023 (recuperación rápida)",
      text: "Reactivación económica, reapertura de sectores y regreso de trabajadores. Resultado: fuerte caída del desempleo.",
    },
    {
      title: "2024-2025 (mejora moderada)",
      text: "El empleo sigue creciendo, pero más lento. Resultado: menor reducción del desempleo y estabilización.",
    },
    {
      title: "2026 (ajuste estacional)",
      text: "En enero terminan empleos temporales de fin de año. Resultado: el desempleo aumenta frente a finales de 2025, pero se mantiene por debajo de enero de 2025.",
    },
  ],
} as const;
