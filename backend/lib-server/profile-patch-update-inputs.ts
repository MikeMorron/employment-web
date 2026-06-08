import type { DbProfileUpdateInput } from "@/lib/server/db-types";
import type { CandidateProfile, CompanyProfile } from "@/types/profile";

export function candidateProfilePatchToProfileUpdateInput(
  patch: Partial<CandidateProfile>,
): DbProfileUpdateInput {
  const next: DbProfileUpdateInput = {};

  if ("nombre" in patch) next.nombre = patch.nombre;
  if ("rol" in patch) next.rol = patch.rol;
  if ("ubicacion" in patch) next.ubicacion = patch.ubicacion ?? null;
  if ("modalidadTrabajo" in patch) next.modalidadTrabajo = patch.modalidadTrabajo ?? null;
  if ("expectativaSalarial" in patch) next.expectativaSalarial = patch.expectativaSalarial ?? null;
  if ("expectativaSalarialMin" in patch) next.expectativaSalarialMin = patch.expectativaSalarialMin ?? null;
  if ("expectativaSalarialMax" in patch) next.expectativaSalarialMax = patch.expectativaSalarialMax ?? null;
  if ("jornada" in patch) next.jornada = patch.jornada ?? null;
  if ("resumenPerfil" in patch) next.resumenPerfil = patch.resumenPerfil ?? null;
  if ("categoriasEnfoque" in patch) next.categoriasEnfoqueJson = JSON.stringify(patch.categoriasEnfoque ?? []);
  if ("telefono" in patch) next.telefono = patch.telefono ?? null;
  if ("website" in patch) next.website = patch.website ?? null;
  if ("bio" in patch) next.bio = patch.bio ?? null;
  if ("idiomas" in patch) next.idiomasJson = JSON.stringify(patch.idiomas ?? []);
  if ("disponibilidadViaje" in patch) next.disponibilidadViaje = patch.disponibilidadViaje ?? null;
  if ("movilidad" in patch) next.movilidad = patch.movilidad ?? null;
  if ("skills" in patch) next.skillsJson = JSON.stringify(patch.skills ?? []);
  if ("structuredSkills" in patch) next.candidateSkillsJson = JSON.stringify(patch.structuredSkills ?? []);
  if ("experiencia" in patch) next.experienciaJson = JSON.stringify(patch.experiencia ?? []);
  if ("professionalProfile" in patch) next.professionalProfileJson = JSON.stringify(patch.professionalProfile ?? {});
  if ("educationProfile" in patch) next.educationProfileJson = JSON.stringify(patch.educationProfile ?? { records: [] });
  if ("certificationProfile" in patch) next.certificationProfileJson = JSON.stringify(patch.certificationProfile ?? { records: [] });
  if ("workPreferences" in patch) next.workPreferencesJson = JSON.stringify(patch.workPreferences ?? {});
  if ("locationProfile" in patch) next.locationProfileJson = JSON.stringify(patch.locationProfile ?? {});
  if ("profileQuality" in patch) next.profileQualityJson = JSON.stringify(patch.profileQuality ?? {});
  if ("profileVisibility" in patch) next.profileVisibility = patch.profileVisibility ?? null;

  return next;
}

export function companyProfilePatchToProfileUpdateInput(
  patch: Partial<CompanyProfile>,
): DbProfileUpdateInput {
  const next: DbProfileUpdateInput = {};

  if ("nombre" in patch) next.nombre = patch.nombre;
  if ("rol" in patch) next.rol = patch.rol;
  if ("ubicacion" in patch) next.ubicacion = patch.ubicacion ?? null;
  if ("telefono" in patch) next.telefono = patch.telefono ?? null;
  if ("website" in patch) next.website = patch.website ?? null;
  if ("companyName" in patch) next.companyName = patch.companyName;
  if ("industry" in patch) next.industry = patch.industry;
  if ("companySize" in patch) next.companySize = patch.companySize;
  if ("companyDescription" in patch) next.companyDescription = patch.companyDescription;
  if ("companyCulture" in patch) next.companyCulture = patch.companyCulture ?? null;
  if ("companyMission" in patch) next.companyMission = patch.companyMission ?? null;
  if ("companyVision" in patch) next.companyVision = patch.companyVision ?? null;
  if ("companyContactEmail" in patch) next.companyContactEmail = patch.companyContactEmail ?? null;
  if ("companyWebsite" in patch) next.companyWebsite = patch.companyWebsite ?? null;
  if ("companyLocation" in patch) next.companyLocation = patch.companyLocation ?? null;
  if ("companyBenefits" in patch) next.companyBenefitsJson = JSON.stringify(patch.companyBenefits ?? []);
  if ("companySocialLinks" in patch) next.companySocialLinksJson = JSON.stringify(patch.companySocialLinks ?? []);
  if ("companyBanner" in patch) next.companyBanner = patch.companyBanner ?? null;
  if ("hiringFocus" in patch) next.hiringFocusJson = JSON.stringify(patch.hiringFocus ?? []);

  return next;
}
