import { randomBytes } from "node:crypto";
import type { ProductNotification } from "@/types/notifications";
import type {
  CandidateApplication,
  CandidateApplicationStatus,
  CompanyApplicant,
} from "@/types/workflows";

export function candidateToApplicantStage(status: CandidateApplicationStatus): CompanyApplicant["stage"] {
  const map: Record<CandidateApplicationStatus, CompanyApplicant["stage"]> = {
    application_submitted: "new",
    application_received: "new",
    submitted: "new",
    in_review: "review",
    preselected: "review",
    in_evaluation: "interview",
    shortlisted: "shortlist",
    in_decision: "interview",
    offer_sent: "offer",
    offer_accepted: "offer",
    offer_rejected: "rejected",
    shortlist: "shortlist",
    interview: "interview",
    offer: "offer",
    rejected: "rejected",
    not_selected: "rejected",
    process_closed: "rejected",
    vacancy_cancelled: "rejected",
    withdrawn: "rejected",
  };

  return map[status];
}

export function applicantToCandidateStatus(stage: CompanyApplicant["stage"]): CandidateApplicationStatus {
  const map: Record<CompanyApplicant["stage"], CandidateApplicationStatus> = {
    new: "application_received",
    review: "in_review",
    shortlist: "shortlisted",
    interview: "in_evaluation",
    offer: "offer_sent",
    rejected: "rejected",
  };

  return map[stage];
}

function getApplicationNotificationType(status: CandidateApplicationStatus): ProductNotification["type"] {
  const map: Record<CandidateApplicationStatus, ProductNotification["type"]> = {
    application_submitted: "application_submitted",
    application_received: "application_received",
    submitted: "application_submitted",
    in_review: "application_review",
    preselected: "application_preselected",
    in_evaluation: "application_evaluation",
    shortlisted: "application_shortlist",
    in_decision: "application_decision",
    offer_sent: "application_offer",
    offer_accepted: "application_offer_accepted",
    offer_rejected: "application_offer_rejected",
    shortlist: "application_shortlist",
    interview: "application_evaluation",
    offer: "application_offer",
    rejected: "application_rejected",
    not_selected: "application_not_selected",
    process_closed: "application_process_closed",
    vacancy_cancelled: "application_vacancy_cancelled",
    withdrawn: "application_withdrawn",
  };

  return map[status];
}

function getApplicationNotificationCopy(
  application: CandidateApplication,
  status: CandidateApplicationStatus,
) {
  switch (status) {
    case "application_submitted":
    case "submitted":
      return {
        title: `Postulación enviada a ${application.companyName}`,
        message: `Tu postulación para ${application.title} fue enviada y quedó registrada.`,
      };
    case "application_received":
      return {
        title: `${application.companyName} recibió tu postulación`,
        message: `La vacante ${application.title} ya aparece como recibida por la empresa.`,
      };
    case "in_review":
      return {
        title: "Tu postulación está en revisión",
        message: `${application.companyName} está revisando tu perfil para ${application.title}.`,
      };
    case "preselected":
    case "shortlisted":
    case "shortlist":
      return {
        title: `Avanzaste en ${application.title}`,
        message: "Tu perfil quedó preseleccionado para seguir en el proceso.",
      };
    case "in_evaluation":
    case "interview":
      return {
        title: "Pasaste a evaluación",
        message: `${application.companyName} movió tu proceso a evaluación o entrevista.`,
      };
    case "in_decision":
      return {
        title: "Tu proceso está en decisión",
        message: `La empresa está cerrando la decisión final para ${application.title}.`,
      };
    case "offer_sent":
    case "offer":
      return {
        title: "Recibiste una oferta",
        message: `${application.companyName} te envió una oferta para ${application.title}.`,
      };
    case "offer_accepted":
      return {
        title: "Oferta aceptada",
        message: `Confirmaste la oferta para ${application.title}.`,
      };
    case "offer_rejected":
      return {
        title: "Oferta rechazada",
        message: `La oferta para ${application.title} fue rechazada.`,
      };
    case "rejected":
    case "not_selected":
      return {
        title: "Proceso finalizado",
        message: `La vacante ${application.title} cerró sin selección para tu perfil.`,
      };
    case "process_closed":
    case "vacancy_cancelled":
      return {
        title: "Vacante cerrada",
        message: `La empresa cerró la vacante ${application.title}.`,
      };
    case "withdrawn":
      return {
        title: "Retiraste tu postulación",
        message: `Tu postulación para ${application.title} fue retirada.`,
      };
  }
}

export function buildApplicationNotification(
  userId: string,
  application: CandidateApplication,
  status: CandidateApplicationStatus,
): ProductNotification {
  const copy = getApplicationNotificationCopy(application, status);

  return {
    id: `app-note-${randomBytes(8).toString("hex")}`,
    userId,
    type: getApplicationNotificationType(status),
    category: "workflow",
    title: copy.title,
    message: copy.message,
    createdAt: new Date().toISOString(),
    read: false,
    applicationId: application.id,
    jobId: application.jobId,
    status,
  };
}
