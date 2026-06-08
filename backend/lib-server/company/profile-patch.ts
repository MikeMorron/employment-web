import type { CompanyProfile } from "@/types/profile";
import {
  sanitizeHttpUrl,
  sanitizeOptionalString,
  sanitizeString,
  sanitizeStringArray,
} from "@/lib/server/profile-patch-shared";
import {
  companyProfilePatchToProfileUpdateInput as companyProfilePatchToProfileUpdateInputImpl,
} from "@/lib/server/profile-patch-update-inputs";

export function sanitizeCompanyProfilePatch(input: Partial<CompanyProfile>) {
  const next: Partial<CompanyProfile> = {};

  if ("nombre" in input) next.nombre = sanitizeString(input.nombre, 160);
  if ("rol" in input) next.rol = sanitizeString(input.rol, 120);
  if ("ubicacion" in input) next.ubicacion = sanitizeOptionalString(input.ubicacion, 120);
  if ("telefono" in input) next.telefono = sanitizeOptionalString(input.telefono, 40);
  if ("website" in input) next.website = sanitizeHttpUrl(input.website);
  if ("companyName" in input) next.companyName = sanitizeString(input.companyName, 160);
  if ("industry" in input) next.industry = sanitizeString(input.industry, 120);
  if ("companySize" in input) next.companySize = sanitizeString(input.companySize, 80);
  if ("companyDescription" in input) next.companyDescription = sanitizeString(input.companyDescription, 600);
  if ("companyCulture" in input) next.companyCulture = sanitizeOptionalString(input.companyCulture, 400);
  if ("companyMission" in input) next.companyMission = sanitizeOptionalString(input.companyMission, 400);
  if ("companyVision" in input) next.companyVision = sanitizeOptionalString(input.companyVision, 400);
  if ("companyContactEmail" in input) next.companyContactEmail = sanitizeOptionalString(input.companyContactEmail, 200);
  if ("companyWebsite" in input || "website" in input) {
    next.companyWebsite = sanitizeHttpUrl(input.companyWebsite ?? input.website);
    next.website = next.companyWebsite;
  }
  if ("companyLocation" in input) next.companyLocation = sanitizeOptionalString(input.companyLocation, 120);
  if ("companyBenefits" in input) next.companyBenefits = sanitizeStringArray(input.companyBenefits, 12, 100);
  if ("companySocialLinks" in input) {
    next.companySocialLinks = sanitizeStringArray(input.companySocialLinks, 8, 200)
      .map((item) => sanitizeHttpUrl(item))
      .filter(Boolean) as string[];
  }
  if ("companyBanner" in input) next.companyBanner = sanitizeHttpUrl(input.companyBanner);
  if ("hiringFocus" in input) next.hiringFocus = sanitizeStringArray(input.hiringFocus, 8, 80);

  return next;
}

export {
  companyProfilePatchToProfileUpdateInputImpl as companyProfilePatchToProfileUpdateInput,
};
