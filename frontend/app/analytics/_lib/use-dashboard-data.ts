import { getDaysSince } from "./dashboard-config";
import type { DashboardConfig } from "./dashboard-config";

interface JobApplicant {
  appliedAt: string;
  stage: string;
}

export interface DashboardJob {
  id: string;
  title: string;
  status: string;
  featured?: boolean;
  updatedAt?: string;
  applicants: JobApplicant[];
}

export interface DashboardAnalytics {
  totalApplicants: number;
  shortlisted: number;
}

export interface DashboardEventAnalytics {
  kpis: {
    viewsTotal: number;
    clicksTotal: number;
    applicationsTotal: number;
    visitToApplyRate: number;
  };
  averageStageDays: { label: string; value: number }[];
  matchQuality: { averageMatch: number; high: number; medium: number; low: number };
}

export function computeDashboardData(
  config: DashboardConfig,
  companyJobs: DashboardJob[],
  analytics: DashboardAnalytics,
  eventAnalytics: DashboardEventAnalytics,
) {
  const totalViews = eventAnalytics.kpis.viewsTotal;
  const totalClicks = eventAnalytics.kpis.clicksTotal;
  const totalApplications = eventAnalytics.kpis.applicationsTotal || analytics.totalApplicants;
  const averageResponseHours =
    analytics.totalApplicants > 0 ? Math.max(4, 48 - analytics.shortlisted * 3) : 0;

  const filteredJobs = config.vacancyId
    ? companyJobs.filter((job) => job.id === config.vacancyId)
    : companyJobs;

  const headerStatus =
    totalViews === 0
      ? "Tu vacante aún no tiene actividad"
      : totalViews > 0 && totalApplications === 0
        ? "Tu vacante está recibiendo visitas pero no postulaciones"
        : "Tu vacante está generando candidatos";

  const heroInsight =
    totalViews === 0
      ? {
          tone: "warning" as const,
          title: "Tu vacante no está recibiendo tráfico",
          copy: "Ajusta título, salario visible o difusión para activar las primeras vistas.",
        }
      : totalClicks > 0 && totalApplications === 0
        ? {
            tone: "warning" as const,
            title: "Tu vacante recibe interés pero no convierte",
            copy: "Hay visitas y clics, pero nadie se postula. Revisa requisitos, fricción y claridad del rol.",
          }
        : totalApplications > 5
          ? {
              tone: "good" as const,
              title: "Buen rendimiento, estás atrayendo candidatos",
              copy: "Tu vacante ya está generando candidatos. Ahora el foco es calidad y velocidad de revisión.",
            }
          : {
              tone: "neutral" as const,
              title: "Tu vacante ya empezó a mover señal",
              copy: "Hay actividad suficiente para empezar a optimizar conversión y flujo del pipeline.",
            };

  const now = new Date();
  const fromDate =
    config.rangePreset === "7d"
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      : config.rangePreset === "30d"
        ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        : config.customFrom
          ? new Date(`${config.customFrom}T00:00:00`)
          : null;
  const toDate =
    config.rangePreset === "custom" && config.customTo
      ? new Date(`${config.customTo}T23:59:59`)
      : null;

  const filteredApplicants = filteredJobs
    .flatMap((job) => job.applicants)
    .filter((item) => {
      const appliedAt = new Date(item.appliedAt);
      if (fromDate && appliedAt < fromDate) return false;
      if (toDate && appliedAt > toDate) return false;
      return true;
    });

  const funnelSourceJob = filteredJobs[0];
  const funnelStages = funnelSourceJob
    ? [
        {
          label: "Vistas",
          value: funnelSourceJob.applicants.length * 18 + (funnelSourceJob.featured ? 90 : 24),
        },
        {
          label: "Clicks",
          value: funnelSourceJob.applicants.length * 7 + (funnelSourceJob.featured ? 36 : 12),
        },
        { label: "Postulaciones", value: funnelSourceJob.applicants.length },
        {
          label: "Revisión",
          value: funnelSourceJob.applicants.filter((a) => a.stage === "review").length,
        },
        {
          label: "Entrevista",
          value: funnelSourceJob.applicants.filter((a) => a.stage === "interview").length,
        },
        {
          label: "Oferta",
          value: funnelSourceJob.applicants.filter((a) => a.stage === "offer").length,
        },
      ]
    : [];

  const applicationsByDay = (() => {
    const buckets = new Map<string, number>();
    filteredApplicants.forEach((applicant) => {
      const key = applicant.appliedAt.slice(5, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return [...buckets.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-7);
  })();

  const performanceRows = filteredJobs
    .map((job) => ({ label: job.title, value: job.applicants.length, isBest: false }))
    .sort((a, b) => b.value - a.value);
  if (performanceRows[0]) {
    performanceRows[0].isBest = performanceRows[0].value > 0;
  }

  const pipelineByStage = [
    { label: "Nuevos", value: filteredApplicants.filter((a) => a.stage === "new").length },
    { label: "Revisión", value: filteredApplicants.filter((a) => a.stage === "review").length },
    {
      label: "Preselección",
      value: filteredApplicants.filter((a) => a.stage === "shortlist").length,
    },
    {
      label: "Entrevista",
      value: filteredApplicants.filter((a) => a.stage === "interview").length,
    },
    { label: "Oferta", value: filteredApplicants.filter((a) => a.stage === "offer").length },
    { label: "Cerrados", value: filteredApplicants.filter((a) => a.stage === "rejected").length },
  ];

  const averageStageDays =
    eventAnalytics.averageStageDays.length > 0
      ? eventAnalytics.averageStageDays
      : [
          { label: "Revisión", value: Math.max(1, Math.round(averageResponseHours / 24)) },
          {
            label: "Preselección",
            value: Math.max(1, Math.round((averageResponseHours + 24) / 24)),
          },
          {
            label: "Entrevista",
            value: Math.max(1, Math.round((averageResponseHours + 48) / 24)),
          },
          {
            label: "Oferta",
            value: Math.max(1, Math.round((averageResponseHours + 72) / 24)),
          },
        ];

  const perVacancyInsights = Object.fromEntries(
    filteredJobs.flatMap((job) => {
      const views = job.applicants.length * 18 + (job.featured ? 90 : 24);
      const clicks = job.applicants.length * 7 + (job.featured ? 36 : 12);
      const applications = job.applicants.length;

      if (views === 0) {
        return [
          [
            job.title,
            {
              title: `Tu vacante no está recibiendo tráfico: ${job.title}`,
              copy: "Ajusta título, salario visible o difusión para activar las primeras vistas.",
            },
          ],
        ];
      }
      if (views > 0 && clicks === 0) {
        return [
          [
            job.title,
            {
              title: `Tu vacante recibe vistas pero no clics: ${job.title}`,
              copy: "Revisa el título y la propuesta de valor para activar interés real.",
            },
          ],
        ];
      }
      if (clicks > 0 && applications === 0 && getDaysSince(job.updatedAt ?? "") >= 3) {
        return [
          [
            job.title,
            {
              title: `Tu vacante recibe interés pero no convierte: ${job.title}`,
              copy: "Ajusta requisitos, salario visible o fricción de postulación para activar candidatos.",
            },
          ],
        ];
      }
      return [];
    }),
  ) as Record<string, { title: string; copy: string }>;

  return {
    filteredJobs,
    filteredApplicants,
    totalViews,
    totalClicks,
    totalApplications,
    averageResponseHours,
    headerStatus,
    heroInsight,
    funnelStages,
    applicationsByDay,
    performanceRows,
    pipelineByStage,
    averageStageDays,
    perVacancyInsights,
  };
}

export type DashboardData = ReturnType<typeof computeDashboardData>;
