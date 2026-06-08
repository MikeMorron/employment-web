import type { ChartPoint } from "../types";

export function getStaticMarketSignals() {
  const annualUnemploymentDeltaSeries: ChartPoint[] = [
    { label: "2020", value: 5.4 },
    { label: "2021", value: -2.2 },
    { label: "2022", value: -2.5 },
    { label: "2023", value: -1.0 },
    { label: "2024", value: 0.0 },
    { label: "2025", value: -1.3 },
    { label: "2026 (ene)", value: -0.7 },
  ];

  const activeVacanciesSeries: ChartPoint[] = [
    { label: "2020", value: 90000 },
    { label: "2021", value: 140000 },
    { label: "2022", value: 220000 },
    { label: "2023", value: 260000 },
    { label: "2024", value: 240000 },
    { label: "2025", value: 200000 },
    { label: "2026 (ene)", value: 180000 },
  ];

  const educationDemandTimeline: ChartPoint[] = [
    { label: "2020", value: 1 },
    { label: "2021", value: 2 },
    { label: "2022", value: 3 },
    { label: "2023", value: 3 },
    { label: "2024", value: 4 },
    { label: "2025", value: 3 },
    { label: "2026", value: 3 },
  ];

  const topOccupationLabels = [
    "Ventas y asesores comerciales",
    "Servicio al cliente / call center",
    "Operarios / producción",
    "Logística y transporte",
    "Auxiliares administrativos",
    "Construcción (oficiales, ayudantes)",
    "Salud (auxiliares, enfermería)",
    "Seguridad (vigilantes)",
    "Contabilidad / apoyo financiero",
    "Tecnología (menos volumen, más especializada)",
    "Marketing digital / e-commerce",
    "Educación",
  ];

  const topOccupations = topOccupationLabels.map((label, index) => ({
    label,
    value: topOccupationLabels.length - index,
  }));

  const topSkillLabels = [
    "Comunicación efectiva",
    "Trabajo en equipo",
    "Responsabilidad y puntualidad",
    "Orientación al cliente",
    "Adaptabilidad",
    "Manejo de Excel y herramientas Office",
    "Atención al cliente / CRM",
    "Ventas y negociación",
    "Logística e inventarios",
    "Soporte TI básico / herramientas digitales",
    "Manejo de maquinaria o equipos",
    "Procesos de producción",
    "Conducción (licencias C1, C2, etc.)",
    "Manipulación de alimentos",
    "Picking / packing / logística básica",
  ];

  const topSkills = topSkillLabels.map((label, index) => ({
    label,
    value: topSkillLabels.length - index,
  }));

  return {
    annualUnemploymentDeltaSeries,
    activeVacanciesSeries,
    educationDemandTimeline,
    topOccupations,
    topSkills,
  };
}
