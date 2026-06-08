import type { LanguageLevelSystem } from "@/types/profile";

export type CandidateStat = {
  label: string;
  value: string;
  accent?: "sky" | "amber" | "emerald" | "rose";
};

export type CandidateMetric = {
  label: string;
  value: number;
  tone?: "sky" | "amber" | "emerald";
};

export type CandidateExperience = {
  role: string;
  company: string;
  period: string;
  summary: string;
  impact?: string;
};

export type CandidateContact = {
  phone: string;
  email: string;
  linkedin: string;
};

export type CandidateProfile = {
  fullName: string;
  avatarUrl?: string;
  role: string;
  location: string;
  expectedSalary: string;
  matchScore: number;
  projectsCount: number;
  responseRate: number;
  availability: string;
  summary: string;
  technicalSkills: string[];
  softSkills: string[];
  highlightedExperience: CandidateExperience[];
  metrics: CandidateMetric[];
  contact: CandidateContact;
  fullProfile: {
    headline: string;
    achievements: string[];
    experience: CandidateExperience[];
    education: string[];
    languages: string[];
    certifications?: string[];
  };
  stats?: CandidateStat[];
};

export type VacancyLanguageRequirement = {
  name: string;
  minLevel?: string;
  levelSystem?: LanguageLevelSystem;
};

export type VacancySalaryPeriodicity =
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "unknown";

export type Vacancy = {
  id: string;
  titulo: string;
  publicadorTipo?: "empresa" | "persona";
  publicadorNombre?: string;
  empresa?: string;
  companyVerificationStatus?: "verified" | "pending" | "unverified";
  ubicacion?: string;
  departamento?: string;
  municipio?: string;
  modalidad?: string;
  salario?: string;
  descripcion: string;
  etiquetas?: string[];
  destacada?: boolean;
  url?: string;
  fuente?: string;
  diasDesdePublicacion?: number;
  salarioMinimoMillones?: number;
  experienciaMinimaAnos?: number;
  clicksDetalleDosDias?: number;
  vistasDosSemanas?: number;
  personasTresDias?: number;
  personasDosSemanas?: number;
  clicksDia?: number;
  clicksSemana?: number;
  aplicantes?: number;
  descripcionCompleta?: string;
  beneficios?: string[];
  resumenEmpresa?: string;
  publishedAt?: string;
  candidateProfile?: CandidateProfile;
  requiredSkills?: string[];
  optionalSkills?: string[];
  languageRequirements?: VacancyLanguageRequirement[];
  requiredEducation?: string[];
  requiredCertifications?: string[];
  salaryCurrency?: string;
  salaryPeriodicity?: VacancySalaryPeriodicity;
  salaryMinAmount?: number;
  salaryMaxAmount?: number;
};
