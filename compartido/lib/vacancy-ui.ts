import {
  isActiveCandidateApplicationStatus,
  normalizeCandidateApplicationStatus,
} from "@/lib/application-status";
import type { CandidateApplication } from "@/types/workflows";

type VacancyPrimaryCtaInput = {
  isEnglish: boolean;
  isPersonProfile: boolean;
  isBoosted: boolean;
  isUrgent: boolean;
  application?: CandidateApplication | null;
  isApplying?: boolean;
};

export function getVacancyModalityLabel(modality: string | null | undefined, isEnglish: boolean) {
  if (!modality) {
    return null;
  }

  if (modality === "Hibrido") return isEnglish ? "Hybrid" : "Híbrido";
  if (modality === "Presencial") return isEnglish ? "On-site" : "Presencial";
  if (modality === "Remoto") return isEnglish ? "Remote" : "Remoto";

  return modality;
}

export function getVacancyLocationLabel(location: string | null | undefined) {
  if (!location) {
    return null;
  }

  if (location.trim().toLowerCase() === "remoto en colombia") {
    return "Remoto";
  }

  return location;
}

export function getVacancyPrimaryCta({
  isEnglish,
  isPersonProfile,
  isBoosted,
  isUrgent,
  application,
  isApplying = false,
}: VacancyPrimaryCtaInput) {
  if (isApplying) {
    return isEnglish ? "Applying..." : "Aplicando...";
  }

  if (isPersonProfile) {
    return isEnglish ? "View profile" : "Ver perfil";
  }

  if (application) {
    const normalizedStatus = normalizeCandidateApplicationStatus(application.status);

    if (isActiveCandidateApplicationStatus(application.status)) {
      return isEnglish ? "View application" : "Ver postulación";
    }

    if (normalizedStatus === "withdrawn") {
      return isEnglish ? "Apply again" : "Aplicar de nuevo";
    }

    return isEnglish ? "Process closed" : "Proceso cerrado";
  }

  if (isUrgent) {
    return isEnglish ? "Apply now" : "Aplicar ahora";
  }

  if (isBoosted) {
    return isEnglish ? "View & apply" : "Ver y aplicar";
  }

  return isEnglish ? "View details" : "Ver detalles";
}

export function getVacancyEntityCtaLabel(isEnglish: boolean, isPersonProfile: boolean) {
  if (isEnglish) {
    return isPersonProfile ? "View profile" : "View company";
  }

  return isPersonProfile ? "Ver perfil" : "Ver compañía";
}
