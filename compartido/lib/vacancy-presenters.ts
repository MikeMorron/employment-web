import { getVacancyFilterCategory } from "@/lib/vacancy-category";
import type { Vacancy } from "@/types/vacancy";

function formatSalary(value?: number) {
  if (!value) {
    return null;
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value * 1_000_000);
}

function getApplicantsCount(job: Vacancy) {
  if (typeof job.aplicantes === "number") {
    return job.aplicantes;
  }

  if (typeof job.vistasDosSemanas === "number") {
    return Math.max(3, Math.round(job.vistasDosSemanas * 0.09));
  }

  if (typeof job.clicksDetalleDosDias === "number") {
    return Math.max(1, Math.round(job.clicksDetalleDosDias * 0.18));
  }

  return null;
}

export function getVacancyPresenter(job: Vacancy) {
  const isPersonProfile = job.publicadorTipo === "persona";

  return {
    isPersonProfile,
    primaryName: isPersonProfile ? job.publicadorNombre : job.empresa,
    displayCategory: getVacancyFilterCategory(job),
    displaySalary: job.salario ?? formatSalary(job.salarioMinimoMillones),
    applicantsCount: getApplicantsCount(job),
    visibleCategories:
      job.etiquetas?.filter((tag) => tag.toLowerCase() !== "alta demanda").slice(0, 3) ?? [],
  };
}
