export type EducationDraft = {
  educationType:
    | "primaria"
    | "secundaria_bachillerato"
    | "tecnico_tecnologo"
    | "universidad_pregrado"
    | "especializacion"
    | "maestria"
    | "doctorado"
    | "bootcamp"
    | "curso_certificacion"
    | "autodidacta";
  institutionName: string;
  degreeField: string;
  focusAreas: string[];
  startDate: string;
  endDate: string;
  region: string;
  city: string;
};

export type CertificationDraft = {
  issuer: string;
  startedAt: string;
  completedAt: string;
  certificationName: string;
  proofImageName: string;
  proofImageAssetId: string;
  proofImageAssetPublicId: string;
  proofImageUrl: string;
  proofImageThumbnailUrl: string;
  proofImageStoredFileName: string;
  proofImageThumbnailStoredFileName: string;
};

export const SENIORITY_OPTIONS = [
  { value: "intern", label: "Intern" },
  { value: "junior", label: "Junior" },
  { value: "mid", label: "Mid" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "principal", label: "Principal" },
] as const;

export const AVAILABILITY_OPTIONS = [
  { value: "available_now", label: "Disponible ahora" },
  { value: "open_30_days", label: "Disponible en 30 días" },
  { value: "open_60_days", label: "Disponible en 60 días" },
  { value: "interviewing", label: "En entrevistas" },
  { value: "not_available", label: "No disponible" },
] as const;

export const EMPTY_EDUCATION_DRAFT: EducationDraft = {
  educationType: "universidad_pregrado",
  institutionName: "",
  degreeField: "",
  focusAreas: [],
  startDate: "",
  endDate: "",
  region: "",
  city: "",
};

export const EMPTY_CERTIFICATION_DRAFT: CertificationDraft = {
  issuer: "",
  startedAt: "",
  completedAt: "",
  certificationName: "",
  proofImageName: "",
  proofImageAssetId: "",
  proofImageAssetPublicId: "",
  proofImageUrl: "",
  proofImageThumbnailUrl: "",
  proofImageStoredFileName: "",
  proofImageThumbnailStoredFileName: "",
};

export const EDUCATION_LEVEL_OPTIONS = [
  { value: "primaria", label: "Primaria" },
  { value: "secundaria_bachillerato", label: "Secundaria / Bachillerato" },
  { value: "tecnico_tecnologo", label: "Técnico / Tecnólogo" },
  { value: "universidad_pregrado", label: "Universidad (Pregrado)" },
  { value: "especializacion", label: "Especialización" },
  { value: "maestria", label: "Maestría" },
  { value: "doctorado", label: "Doctorado (PhD)" },
  { value: "bootcamp", label: "Bootcamp" },
  { value: "curso_certificacion", label: "Curso / Certificación" },
  { value: "autodidacta", label: "Autodidacta" },
] as const;

export const SENIORITY_LABEL_MAP = Object.fromEntries(
  SENIORITY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<(typeof SENIORITY_OPTIONS)[number]["value"], string>;

export const AVAILABILITY_LABEL_MAP = Object.fromEntries(
  AVAILABILITY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<(typeof AVAILABILITY_OPTIONS)[number]["value"], string>;

export const EDUCATION_LABEL_MAP = Object.fromEntries(
  EDUCATION_LEVEL_OPTIONS.map((option) => [option.value, option.label]),
) as Record<(typeof EDUCATION_LEVEL_OPTIONS)[number]["value"], string>;
