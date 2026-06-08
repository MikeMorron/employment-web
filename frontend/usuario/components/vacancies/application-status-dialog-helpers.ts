import {
  getApplicationVisibleGroup,
  normalizeCandidateApplicationStatus,
  VISIBLE_APPLICATION_GROUPS,
  type CandidateApplicationVisibleGroup,
} from "@/lib/application-status";
import type { CandidateApplication } from "@/types/workflows";

export function formatApplicationDate(value: string, isEnglish: boolean) {
  return new Date(value).toLocaleDateString(isEnglish ? "en-US" : "es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getStepDate(application: CandidateApplication, group: CandidateApplicationVisibleGroup) {
  const currentGroup = getApplicationVisibleGroup(application.status);
  if (group === "postulada") {
    return application.appliedAt;
  }

  if (group === currentGroup) {
    return application.lastUpdatedAt;
  }

  return null;
}

export function getGroupIndex(group: CandidateApplicationVisibleGroup) {
  return VISIBLE_APPLICATION_GROUPS.indexOf(group);
}

export function getCurrentGroupIndex(status: CandidateApplication["status"]) {
  return getGroupIndex(getApplicationVisibleGroup(status));
}

export function getApplicationBadgeTone(status: CandidateApplication["status"]) {
  const normalized = normalizeCandidateApplicationStatus(status);

  if (["offer_sent", "offer_accepted"].includes(normalized)) {
    return "border-emerald-300/50 bg-emerald-50 text-emerald-700 shadow-[0_10px_24px_rgba(16,185,129,0.1)]";
  }

  if (["withdrawn"].includes(normalized)) {
    return "border-violet-300/50 bg-violet-50 text-violet-700 shadow-[0_10px_24px_rgba(139,92,246,0.08)]";
  }

  if (["offer_rejected", "rejected", "not_selected", "vacancy_cancelled", "process_closed"].includes(normalized)) {
    return "border-rose-300/50 bg-rose-50 text-rose-700 shadow-[0_10px_24px_rgba(244,63,94,0.08)]";
  }

  return "border-sky-300/50 bg-sky-50 text-sky-700 shadow-[0_10px_24px_rgba(14,165,233,0.08)]";
}

export function isNegativeClosedStatus(status: CandidateApplication["status"]) {
  const normalized = normalizeCandidateApplicationStatus(status);

  return [
    "withdrawn",
    "process_closed",
    "offer_rejected",
    "rejected",
    "not_selected",
    "vacancy_cancelled",
  ].includes(normalized);
}

export function isWithdrawnStatus(status: CandidateApplication["status"]) {
  return normalizeCandidateApplicationStatus(status) === "withdrawn";
}

export function getGroupHelperCopyKey(group: CandidateApplicationVisibleGroup) {
  if (group === "postulada") {
    return "stageHelperApplied";
  }
  if (group === "revision") {
    return "stageHelperReview";
  }
  if (group === "decision") {
    return "stageHelperDecision";
  }
  return "stageHelperClosed";
}
