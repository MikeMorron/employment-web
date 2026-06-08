import type { CandidateApplicationStatus } from "@/types/workflows";

export type CandidateApplicationVisibleGroup =
  | "postulada"
  | "revision"
  | "decision"
  | "cerrada";

export const VISIBLE_APPLICATION_GROUPS: CandidateApplicationVisibleGroup[] = [
  "postulada",
  "revision",
  "decision",
  "cerrada",
];

const LEGACY_STATUS_MAP: Partial<Record<CandidateApplicationStatus, CandidateApplicationStatus>> = {
  submitted: "application_submitted",
  shortlist: "shortlisted",
  interview: "in_evaluation",
  offer: "offer_sent",
};

export function normalizeCandidateApplicationStatus(status: CandidateApplicationStatus): CandidateApplicationStatus {
  return LEGACY_STATUS_MAP[status] ?? status;
}

export function getApplicationVisibleGroup(status: CandidateApplicationStatus): CandidateApplicationVisibleGroup {
  switch (normalizeCandidateApplicationStatus(status)) {
    case "application_submitted":
    case "application_received":
      return "postulada";
    case "in_review":
    case "preselected":
    case "in_evaluation":
    case "shortlisted":
      return "revision";
    case "in_decision":
    case "offer_sent":
      return "decision";
    default:
      return "cerrada";
  }
}

export function isActiveCandidateApplicationStatus(status: CandidateApplicationStatus) {
  return [
    "application_submitted",
    "application_received",
    "in_review",
    "preselected",
    "in_evaluation",
    "shortlisted",
    "in_decision",
    "offer_sent",
  ].includes(normalizeCandidateApplicationStatus(status));
}

export function canWithdrawCandidateApplication(status: CandidateApplicationStatus) {
  return [
    "application_submitted",
    "application_received",
    "in_review",
    "preselected",
    "in_evaluation",
    "shortlisted",
    "in_decision",
  ].includes(normalizeCandidateApplicationStatus(status));
}

export function getCandidateApplicationStatusLabel(status: CandidateApplicationStatus, isEnglish = false) {
  const normalized = normalizeCandidateApplicationStatus(status);
  const labels = {
    application_submitted: { es: "Postulación enviada", en: "Application submitted" },
    application_received: { es: "Postulación recibida", en: "Application received" },
    in_review: { es: "En revisión", en: "In review" },
    preselected: { es: "Preseleccionado", en: "Preselected" },
    in_evaluation: { es: "En evaluación", en: "In evaluation" },
    shortlisted: { es: "En shortlist", en: "Shortlisted" },
    in_decision: { es: "En decisión", en: "In decision" },
    offer_sent: { es: "Oferta enviada", en: "Offer sent" },
    offer_accepted: { es: "Oferta aceptada", en: "Offer accepted" },
    offer_rejected: { es: "Oferta rechazada", en: "Offer rejected" },
    rejected: { es: "Rechazado", en: "Rejected" },
    not_selected: { es: "No seleccionado", en: "Not selected" },
    process_closed: { es: "Proceso cerrado", en: "Process closed" },
    vacancy_cancelled: { es: "Vacante cancelada", en: "Vacancy cancelled" },
    withdrawn: { es: "Retirada", en: "Withdrawn" },
    submitted: { es: "Postulación enviada", en: "Application submitted" },
    shortlist: { es: "En shortlist", en: "Shortlisted" },
    interview: { es: "En evaluación", en: "In evaluation" },
    offer: { es: "Oferta enviada", en: "Offer sent" },
  } as const;

  return isEnglish ? labels[normalized].en : labels[normalized].es;
}

export function getCandidateApplicationVisibleGroupLabel(group: CandidateApplicationVisibleGroup, isEnglish = false) {
  const labels = {
    postulada: { es: "Postulada", en: "Applied" },
    revision: { es: "En revisión", en: "In review" },
    decision: { es: "Decisión", en: "Decision" },
    cerrada: { es: "Cerrada", en: "Closed" },
  } as const;

  return isEnglish ? labels[group].en : labels[group].es;
}

export function getCandidateApplicationTone(status: CandidateApplicationStatus) {
  const normalized = normalizeCandidateApplicationStatus(status);

  if (["offer_accepted", "offer_sent"].includes(normalized)) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (["offer_rejected", "rejected", "not_selected", "vacancy_cancelled"].includes(normalized)) {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }

  if (["withdrawn", "process_closed"].includes(normalized)) {
    return "bg-slate-100 text-slate-600 border-slate-200";
  }

  if (["in_decision"].includes(normalized)) {
    return "bg-violet-50 text-violet-700 border-violet-200";
  }

  if (["preselected", "in_evaluation", "shortlisted"].includes(normalized)) {
    return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
  }

  if (["in_review"].includes(normalized)) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-sky-50 text-sky-700 border-sky-200";
}

export function getCandidateApplicationInsight(status: CandidateApplicationStatus, isEnglish = false) {
  const normalized = normalizeCandidateApplicationStatus(status);
  const copy = {
    application_submitted: {
      es: "Tu candidatura fue enviada y está pendiente de ser recibida formalmente por la empresa.",
      en: "Your application was sent and is waiting to be formally received by the company.",
    },
    application_received: {
      es: "La empresa ya recibió tu postulación. El siguiente paso es que entre a revisión.",
      en: "The company already received your application. The next step is moving into review.",
    },
    in_review: {
      es: "Tu perfil está siendo revisado por la empresa para validar encaje con el cargo.",
      en: "Your profile is being reviewed by the company to validate fit for the role.",
    },
    preselected: {
      es: "Tu perfil generó interés y fue preseleccionado para avanzar dentro del proceso.",
      en: "Your profile generated interest and was preselected to advance in the process.",
    },
    in_evaluation: {
      es: "La empresa está evaluando tu perfil con mayor detalle antes de tomar una decisión.",
      en: "The company is evaluating your profile in more detail before making a decision.",
    },
    shortlisted: {
      es: "Estás dentro de los perfiles finalistas del proceso actual.",
      en: "You are among the finalist profiles in the current process.",
    },
    in_decision: {
      es: "La empresa está cerrando el proceso y pronto definirá si continúa contigo.",
      en: "The company is closing the process and will soon decide whether to continue with you.",
    },
    offer_sent: {
      es: "La empresa ya emitió una oferta para esta vacante.",
      en: "The company has already issued an offer for this role.",
    },
    offer_accepted: {
      es: "La oferta fue aceptada y esta candidatura quedó cerrada con resultado positivo.",
      en: "The offer was accepted and this application closed with a positive outcome.",
    },
    offer_rejected: {
      es: "La oferta fue rechazada y el proceso quedó cerrado.",
      en: "The offer was rejected and the process was closed.",
    },
    rejected: {
      es: "La empresa decidió no continuar con tu candidatura para esta vacante.",
      en: "The company decided not to continue with your application for this role.",
    },
    not_selected: {
      es: "La empresa avanzó con otros perfiles y tu candidatura quedó fuera del cierre final.",
      en: "The company moved forward with other profiles and your application was left out of the final close.",
    },
    process_closed: {
      es: "El proceso de selección ya finalizó y no admite nuevos movimientos.",
      en: "The hiring process has already finished and no longer accepts new movements.",
    },
    vacancy_cancelled: {
      es: "La vacante fue cancelada por la empresa y el proceso se cerró.",
      en: "The job posting was canceled by the company and the process was closed.",
    },
    withdrawn: {
      es: "Retiraste esta postulación y el proceso quedó cerrado por tu decisión.",
      en: "You withdrew this application and the process was closed by your decision.",
    },
    submitted: {
      es: "Tu candidatura fue enviada y está pendiente de ser recibida formalmente por la empresa.",
      en: "Your application was sent and is waiting to be formally received by the company.",
    },
    shortlist: {
      es: "Estás dentro de los perfiles finalistas del proceso actual.",
      en: "You are among the finalist profiles in the current process.",
    },
    interview: {
      es: "La empresa está evaluando tu perfil con mayor detalle antes de tomar una decisión.",
      en: "The company is evaluating your profile in more detail before making a decision.",
    },
    offer: {
      es: "La empresa ya emitió una oferta para esta vacante.",
      en: "The company has already issued an offer for this role.",
    },
  } as const;

  return isEnglish ? copy[normalized].en : copy[normalized].es;
}

