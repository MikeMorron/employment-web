import type { Vacancy } from "@/types/vacancy";

export function isVerifiedCompanyVacancy(vacancy: Vacancy): boolean {
  if (vacancy.publicadorTipo === "persona") {
    return false;
  }

  return vacancy.companyVerificationStatus === "verified";
}
