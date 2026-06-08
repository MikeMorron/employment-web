import { buildCertificationDisplayName, formatDisplayDate } from "@/components/profile/candidate-match-profile/utils";
import {
  AVAILABILITY_LABEL_MAP,
  EDUCATION_LABEL_MAP,
  type CertificationDraft,
  type EducationDraft,
} from "@/components/profile/candidate-match-profile/constants";
import type {
  CandidateCertificationProfile,
  CandidateEducationProfile,
  CandidateProfessionalProfile,
  CandidateWorkPreferences,
} from "@/types/profile";

export function buildProfessionalSummaryItems(
  professionalProfile: CandidateProfessionalProfile,
  seniorityLabelMap: Record<string, string>,
) {
  return [
    professionalProfile.currentJobTitle
      ? {
          label: "Cargo actual o más reciente",
          value: professionalProfile.currentJobTitle,
        }
      : null,
    (professionalProfile.preferredRoleTitles ?? []).length
      ? {
          label: "A qué roles apuntas",
          values: professionalProfile.preferredRoleTitles ?? [],
        }
      : null,
    typeof professionalProfile.yearsExperienceTotal === "number"
      ? {
          label: "Años de experiencia",
          value:
            professionalProfile.yearsExperienceTotal >= 10
              ? "+10"
              : String(Math.max(0, professionalProfile.yearsExperienceTotal)),
        }
      : null,
    professionalProfile.seniorityLevel
      ? {
          label: "Nivel profesional",
          value: seniorityLabelMap[professionalProfile.seniorityLevel] ?? professionalProfile.seniorityLevel,
        }
      : null,
    typeof professionalProfile.openToWork === "boolean"
      ? {
          label: "Open to work",
          value: professionalProfile.openToWork ? "Sí" : "No",
        }
      : null,
    professionalProfile.availabilityStatus
      ? {
          label: "Disponibilidad",
          value:
            AVAILABILITY_LABEL_MAP[professionalProfile.availabilityStatus] ?? professionalProfile.availabilityStatus,
        }
      : null,
  ];
}

export function buildPreferenceSummaryItems(workPreferences: CandidateWorkPreferences) {
  return [
    (workPreferences.preferredLocations ?? []).length
      ? {
          label: "Ubicaciones preferidas",
          values: workPreferences.preferredLocations ?? [],
        }
      : null,
    workPreferences.availabilityDate
      ? {
          label: "Fecha de disponibilidad",
          value: formatDisplayDate(workPreferences.availabilityDate),
        }
      : null,
    typeof workPreferences.willingToRelocate === "boolean"
      ? {
          label: "Disponibilidad para reubicarse",
          value: workPreferences.willingToRelocate ? "Sí" : "No",
        }
      : null,
  ];
}

export function buildAllowedSections(
  visibleSections?: Array<"professional" | "preferences" | "education" | "certifications">,
) {
  return new Set(
    visibleSections ?? ["professional", "preferences", "education", "certifications"],
  );
}

export function addPreferredLocationValue(
  selectedPreferredDepartment: string,
  selectedPreferredCity: string,
  currentValues: string[],
) {
  if (!selectedPreferredDepartment || !selectedPreferredCity) {
    return currentValues;
  }

  const nextValue = `${selectedPreferredDepartment} · ${selectedPreferredCity}`;
  if (currentValues.includes(nextValue) || currentValues.length >= 8) {
    return currentValues;
  }

  return [...currentValues, nextValue];
}

export function buildNextEducationProfile(
  educationProfile: CandidateEducationProfile,
  educationDraft: EducationDraft,
) {
  const levelLabel = EDUCATION_LABEL_MAP[educationDraft.educationType] ?? educationDraft.educationType;

  return {
    highestEducationLevel: educationProfile.highestEducationLevel || levelLabel,
    records: [
      ...educationProfile.records,
      {
        educationType: educationDraft.educationType,
        degreeTitle: levelLabel,
        degreeField: educationDraft.degreeField || undefined,
        focusAreas: educationDraft.focusAreas.length ? educationDraft.focusAreas : undefined,
        institutionName: educationDraft.institutionName.trim(),
        startDate: educationDraft.startDate,
        endDate: educationDraft.endDate,
        city: educationDraft.city,
        region: educationDraft.region,
        isCompleted: true,
        isRelevant:
          educationDraft.educationType !== "primaria" &&
          educationDraft.educationType !== "secundaria_bachillerato",
      },
    ],
  } satisfies CandidateEducationProfile;
}

export function buildNextCertificationProfile(
  certificationProfile: CandidateCertificationProfile,
  certificationDraft: CertificationDraft,
) {
  return {
    records: [
      ...certificationProfile.records,
      {
        certificationName: certificationDraft.certificationName.trim(),
        issuer: certificationDraft.issuer.trim(),
        startedAt: certificationDraft.startedAt,
        completedAt: certificationDraft.completedAt,
        proofImageName: certificationDraft.proofImageName || undefined,
        proofImageAssetId: certificationDraft.proofImageAssetId || undefined,
        proofImageAssetPublicId: certificationDraft.proofImageAssetPublicId || undefined,
        proofImageUrl: certificationDraft.proofImageUrl || undefined,
        proofImageThumbnailUrl: certificationDraft.proofImageThumbnailUrl || undefined,
        proofImageStoredFileName: certificationDraft.proofImageStoredFileName || undefined,
        proofImageThumbnailStoredFileName: certificationDraft.proofImageThumbnailStoredFileName || undefined,
        issuedAt: certificationDraft.completedAt,
        isActive: true,
        isRelevant: true,
      },
    ],
  } satisfies CandidateCertificationProfile;
}

export async function uploadCertificationImageAsset(input: {
  issuer: string;
  certificationName: string;
  firstName: string;
  file: File;
}) {
  const provisionalName = buildCertificationDisplayName(
    input.issuer,
    input.certificationName,
    input.firstName,
  );

  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("issuer", input.issuer);
  formData.append("program", input.certificationName);
  formData.append("firstName", input.firstName);

  const response = await fetch("/api/certification-image-upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("upload_failed");
  }

  const payload = (await response.json()) as {
    ok: boolean;
    assetId: string;
    assetPublicId: string;
    displayFileName: string;
    fullUrl: string;
    thumbUrl: string;
  };

  return {
    provisionalName,
    payload,
  };
}
