import type { CompanyProfile } from "@/types/profile";

export function getCompanyProfileCompleteness(user: CompanyProfile) {
  const checks = [
    user.companyName,
    user.companyDescription,
    user.companyWebsite,
    user.companyLocation,
    user.companyBenefits?.length,
    user.companyCulture,
    user.industry,
    user.companyContactEmail,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
