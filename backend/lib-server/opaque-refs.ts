import { decodeOpaqueId, encodeOpaqueId } from "@/lib/server/opaque-id";
import type { CandidateApplication } from "@/types/workflows";
import type { Vacancy } from "@/types/vacancy";
import type { ProductNotification } from "@/types/notifications";
import type { CandidateProfile } from "@/types/profile";
import type { CompanyApplicant, CompanyJobPost } from "@/types/workflows";

const CANDIDATE_SCOPE = "candidate";
const COMPANY_SCOPE = "company";

export function encodeCandidateJobId(rawId: string) {
  return encodeOpaqueId("job", rawId, CANDIDATE_SCOPE);
}

export function decodeCandidateJobId(value: string) {
  return decodeOpaqueId(value, { kind: "job", scope: CANDIDATE_SCOPE }) ?? value;
}

export function decodeCandidateJobIdStrict(value: string) {
  return decodeOpaqueId(value, { kind: "job", scope: CANDIDATE_SCOPE });
}

export function encodeCandidateApplicationId(rawId: string) {
  return encodeOpaqueId("application", rawId, CANDIDATE_SCOPE);
}

export function decodeCandidateApplicationId(value: string) {
  return decodeOpaqueId(value, { kind: "application", scope: CANDIDATE_SCOPE }) ?? value;
}

export function decodeCandidateApplicationIdStrict(value: string) {
  return decodeOpaqueId(value, { kind: "application", scope: CANDIDATE_SCOPE });
}

export function encodeCandidateProfileId(rawId: string) {
  return encodeOpaqueId("candidate-profile", rawId, CANDIDATE_SCOPE);
}

export function decodeCandidateProfileId(value: string) {
  return decodeOpaqueId(value, { kind: "candidate-profile", scope: CANDIDATE_SCOPE }) ?? value;
}

export function decodeCandidateProfileIdStrict(value: string) {
  return decodeOpaqueId(value, { kind: "candidate-profile", scope: CANDIDATE_SCOPE });
}

export function encodeCompanyJobId(rawId: string) {
  return encodeOpaqueId("company-job", rawId, COMPANY_SCOPE);
}

export function decodeCompanyJobId(value: string) {
  return decodeOpaqueId(value, { kind: "company-job", scope: COMPANY_SCOPE }) ?? value;
}

export function decodeCompanyJobIdStrict(value: string) {
  return decodeOpaqueId(value, { kind: "company-job", scope: COMPANY_SCOPE });
}

export function encodeCompanyApplicationId(rawId: string) {
  return encodeOpaqueId("company-application", rawId, COMPANY_SCOPE);
}

export function decodeCompanyApplicationId(value: string) {
  return decodeOpaqueId(value, { kind: "company-application", scope: COMPANY_SCOPE }) ?? value;
}

export function decodeCompanyApplicationIdStrict(value: string) {
  return decodeOpaqueId(value, { kind: "company-application", scope: COMPANY_SCOPE });
}

export function encodeCompanyCandidateId(rawId: string) {
  return encodeOpaqueId("company-candidate", rawId, COMPANY_SCOPE);
}

export function decodeCompanyCandidateId(value: string) {
  return decodeOpaqueId(value, { kind: "company-candidate", scope: COMPANY_SCOPE }) ?? value;
}

export function decodeCompanyCandidateIdStrict(value: string) {
  return decodeOpaqueId(value, { kind: "company-candidate", scope: COMPANY_SCOPE });
}

export function encodeVacancyForCandidate<T extends Vacancy>(vacancy: T): T {
  return {
    ...vacancy,
    id: encodeCandidateJobId(vacancy.id),
  };
}

export function encodeVacancyForCompany<T extends Vacancy>(vacancy: T): T {
  if (vacancy.publicadorTipo !== "persona") {
    return vacancy;
  }

  return {
    ...vacancy,
    id: encodeCompanyCandidateId(vacancy.id),
  };
}

export function encodeApplicationForCandidate<T extends CandidateApplication>(application: T): T {
  return {
    ...application,
    id: encodeCandidateApplicationId(application.id),
    candidateId: encodeCandidateProfileId(application.candidateId),
    jobId: encodeCandidateJobId(application.jobId),
  };
}

export function encodeNotificationRefsForCandidate<T extends ProductNotification>(notification: T): T {
  return {
    ...notification,
    applicationId: notification.applicationId
      ? encodeCandidateApplicationId(notification.applicationId)
      : notification.applicationId,
    jobId: notification.jobId
      ? encodeCandidateJobId(notification.jobId)
      : notification.jobId,
    entityId:
      notification.type === "profile_viewed" && notification.entityId
        ? encodeCandidateProfileId(notification.entityId)
        : notification.entityId,
  };
}

export function encodeApplicantForCompany<T extends CompanyApplicant>(applicant: T): T {
  return {
    ...applicant,
    id: encodeCompanyApplicationId(applicant.id),
    candidateId: applicant.candidateId
      ? encodeCompanyCandidateId(applicant.candidateId)
      : applicant.candidateId,
  };
}

export function encodeCompanyJobForCompany<T extends CompanyJobPost>(job: T): T {
  return {
    ...job,
    id: encodeCompanyJobId(job.id),
    applicants: job.applicants.map(encodeApplicantForCompany),
  };
}

export function encodeCandidateForCompany<T extends CandidateProfile>(candidate: T): T {
  return {
    ...candidate,
    id: encodeCompanyCandidateId(candidate.id),
  };
}
