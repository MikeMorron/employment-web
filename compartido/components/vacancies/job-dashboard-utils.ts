import {
  vacancyCategoriesEn,
  vacancyCategoriesEs,
} from "@/data/colombia-locations";
import { qualifiesAsFeaturedVacancy } from "@/lib/utils";
import type { Vacancy } from "@/types/vacancy";

export const modalityOptions = ["Todo", "Hibrido", "Remoto", "Presencial"] as const;
export const sortOptions = [
  { value: "relevancia", labelEs: "Relevancia", labelEn: "Relevance" },
  { value: "mi-ocupacion", labelEs: "Mi ocupación", labelEn: "My role" },
  { value: "recientes", labelEs: "Más recientes", labelEn: "Most recent" },
  { value: "antiguas", labelEs: "Más antiguas", labelEn: "Oldest first" },
  { value: "mejor-paga", labelEs: "Mejor pagadas", labelEn: "Highest salary" },
  { value: "alta-demanda", labelEs: "Alta demanda", labelEn: "High demand" },
] as const;
export const companySortOptions = [
  { value: "relevancia", labelEs: "Mejor match", labelEn: "Best match" },
  { value: "mi-ocupacion", labelEs: "Experiencia", labelEn: "Experience" },
  { value: "recientes", labelEs: "Más reciente", labelEn: "Most recent" },
  { value: "alta-demanda", labelEs: "Disponibilidad", labelEn: "Availability" },
  { value: "mejor-paga", labelEs: "Salario", labelEn: "Salary" },
] as const;
export const maxDays = 90;
export const defaultDays = 90;
export const minSalary = 500_000;
export const defaultSalary = 2_000_000;
export const maxSalary = 50_000_000;
export const minExperience = 0;
export const maxExperience = 11;
export const defaultExperience = maxExperience;
export const JOBS_PAGE_SIZE = 12;
export const ALL_MODALITY = "Todo";
export const ALL_OPTION = "Todos";
export const ALL_CATEGORY = "Todas";

export type CandidateProfileViewMode = "details" | "summary" | "full";

export type FilterDraft = {
  modalidad: string;
  urgente: boolean;
  departamento: string;
  municipio: string;
  categoria: string;
  dias: number;
  salario: number;
  experiencia: number;
};

export type FilterDraftUpdater = FilterDraft | ((current: FilterDraft) => FilterDraft);

export type ApplicationProfilePrompt = {
  job: Vacancy;
  completionScore: number;
  missingFields: string[];
};

export const defaultFilters: FilterDraft = {
  modalidad: ALL_MODALITY,
  urgente: false,
  departamento: ALL_OPTION,
  municipio: ALL_OPTION,
  categoria: ALL_CATEGORY,
  dias: defaultDays,
  salario: defaultSalary,
  experiencia: defaultExperience,
};

const categoryEsToEn = Object.fromEntries(
  vacancyCategoriesEs.map((category, index) => [category, vacancyCategoriesEn[index] ?? category]),
);
const categoryEnToEs = Object.fromEntries(
  vacancyCategoriesEn.map((category, index) => [category, vacancyCategoriesEs[index] ?? category]),
);

export function normalizeVacancyTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function getOccupationTerms(value?: string | null) {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      normalizeVacancyTag(value)
        .split(/[^a-z0-9]+/g)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3)
        .filter(
          (token) =>
            !["con", "para", "del", "las", "los", "una", "uno", "por", "and", "the"].includes(token),
        ),
    ),
  );
}

export function getOccupationMatchScore(job: Vacancy, occupationTerms: string[]) {
  if (occupationTerms.length === 0) {
    return 0;
  }

  const title = normalizeVacancyTag(job.titulo ?? "");
  const description = normalizeVacancyTag(job.descripcion ?? "");
  const tags = (job.etiquetas ?? []).map((tag) => normalizeVacancyTag(tag));

  return occupationTerms.reduce((score, term) => {
    if (title.includes(term)) {
      return score + 6;
    }

    if (tags.some((tag) => tag.includes(term))) {
      return score + 4;
    }

    if (description.includes(term)) {
      return score + 2;
    }

    return score;
  }, 0);
}

export function formatCopValue(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatExperienceValue(value: number, isEnglish: boolean) {
  if (value === 0) {
    return isEnglish ? "No experience" : "Sin experiencia";
  }

  if (value > 10) {
    return isEnglish ? "+10 years" : "+10 años";
  }

  return isEnglish
    ? `${value} year${value === 1 ? "" : "s"}`
    : `${value} año${value === 1 ? "" : "s"}`;
}

export function formatDateValue(value: number, isEnglish: boolean) {
  if (value === 30) {
    return isEnglish ? "30 days" : "30 días";
  }

  return `${value} ${isEnglish ? "days" : "días"}`;
}

export function getModalityLabel(value: string, isEnglish: boolean) {
  if (value === ALL_MODALITY) return isEnglish ? "All" : ALL_MODALITY;
  if (value === "Hibrido") return isEnglish ? "Hybrid" : "Híbrido";
  if (value === "Remoto") return isEnglish ? "Remote" : "Remoto";
  if (value === "Presencial") return isEnglish ? "On-site" : "Presencial";

  return value;
}

export function getLocationOptionLabel(value: string, isEnglish: boolean) {
  if (isEnglish && value === ALL_OPTION) {
    return "All";
  }

  return value;
}

export function getCategoryLabel(value: string, isEnglish: boolean) {
  return isEnglish ? (categoryEsToEn[value] ?? value) : (categoryEnToEs[value] ?? value);
}

export function matchesCategoryFilter(
  selectedCategory: string,
  job: Pick<Vacancy, "titulo" | "descripcion" | "descripcionCompleta" | "etiquetas">,
) {
  if (selectedCategory === ALL_CATEGORY || selectedCategory === "All") {
    return true;
  }

  const spanishCategory = categoryEnToEs[selectedCategory] ?? selectedCategory;
  const englishCategory = categoryEsToEn[selectedCategory] ?? selectedCategory;
  const candidates = [
    selectedCategory,
    spanishCategory,
    englishCategory,
  ]
    .map((value) => normalizeVacancyTag(value))
    .filter(Boolean);
  const haystack = [
    job.titulo,
    job.descripcion,
    job.descripcionCompleta,
    ...(job.etiquetas ?? []),
  ]
    .filter(Boolean)
    .map((value) => normalizeVacancyTag(value!))
    .join(" ");

  return candidates.some((candidate) => haystack.includes(candidate));
}

export function hasUrgentTag(tags: string[] | undefined) {
  return (tags ?? []).some((tag) => normalizeVacancyTag(tag) === normalizeVacancyTag("Urgente"));
}

export function getVacancyPriority(job: Vacancy) {
  const isBoosted = qualifiesAsFeaturedVacancy(job);
  const isFeatured = Boolean(job.destacada);

  if (isBoosted && isFeatured) {
    return 0;
  }

  if (isBoosted) {
    return 1;
  }

  if (isFeatured) {
    return 2;
  }

  return 3;
}

export function getCompanyInitials(name?: string) {
  if (!name) {
    return "TC";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getDisplayCompensation(job: Vacancy) {
  if (job.salario) {
    return job.salario;
  }

  if (job.salarioMinimoMillones) {
    return formatCopValue(job.salarioMinimoMillones * 1_000_000);
  }

  return "Salario a convenir";
}

function parseSalaryNumber(value: string) {
  const normalized = value.replace(/\s+/g, "");
  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");
  const decimalSeparator =
    lastComma > -1 && normalized.length - lastComma <= 3
      ? ","
      : lastDot > -1 && normalized.length - lastDot <= 3
        ? "."
        : null;

  if (decimalSeparator) {
    const integerPart = normalized.slice(0, normalized.lastIndexOf(decimalSeparator)).replace(/[.,]/g, "");
    const decimalPart = normalized.slice(normalized.lastIndexOf(decimalSeparator) + 1);
    return Number(`${integerPart}.${decimalPart}`);
  }

  return Number(normalized.replace(/[.,]/g, ""));
}

export function parseVisibleSalaryToCop(value?: string | null) {
  const salary = value?.trim().toLowerCase();
  if (!salary || /convenir|acordar|negociar/.test(salary)) {
    return null;
  }

  const millionMatches = Array.from(
    salary.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:m\b|mm\b|millones?)/g),
  )
    .map((match) => parseSalaryNumber(match[1] ?? ""))
    .filter((amount) => Number.isFinite(amount) && amount > 0)
    .map((amount) => Math.round(amount * 1_000_000));

  if (millionMatches.length > 0) {
    return Math.min(...millionMatches);
  }

  const explicitMatches = Array.from(salary.matchAll(/\d[\d.,]{4,}/g))
    .map((match) => parseSalaryNumber(match[0]))
    .filter((amount) => Number.isFinite(amount) && amount >= 100_000)
    .map((amount) => Math.round(amount));

  if (explicitMatches.length > 0) {
    return Math.min(...explicitMatches);
  }

  return null;
}

export function getVacancySalaryFloorCop(job: Vacancy) {
  if (typeof job.salaryMinAmount === "number" && Number.isFinite(job.salaryMinAmount)) {
    return job.salaryMinAmount;
  }

  if (typeof job.salarioMinimoMillones === "number" && Number.isFinite(job.salarioMinimoMillones)) {
    return Math.round(job.salarioMinimoMillones * 1_000_000);
  }

  return parseVisibleSalaryToCop(job.salario);
}

export function matchesSalaryFilter(job: Vacancy, salaryFloor: number) {
  const vacancySalaryFloor = getVacancySalaryFloorCop(job);

  if (vacancySalaryFloor === null) {
    return salaryFloor === defaultSalary;
  }

  return vacancySalaryFloor >= salaryFloor;
}

export function getRelevantRoleTags(tags: string[] | undefined, limit = 3) {
  if (!tags?.length) {
    return [];
  }

  const genericTags = new Set([
    normalizeVacancyTag("Software / Desarrollo"),
    normalizeVacancyTag("Software / Development"),
    normalizeVacancyTag("Alta demanda"),
    normalizeVacancyTag("High demand"),
    normalizeVacancyTag("Ops"),
  ]);

  return tags
    .filter((tag) => !genericTags.has(normalizeVacancyTag(tag)))
    .slice(0, limit);
}

export function formatDescriptionBlocks(text: string) {
  return text
    .split(/\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function metricBarTone(tone?: "sky" | "amber" | "emerald") {
  if (tone === "amber") {
    return "from-[#fcd116] to-[#f59e0b]";
  }

  if (tone === "emerald") {
    return "from-emerald-400 to-teal-400";
  }

  return "from-sky-400 to-cyan-300";
}

export function statToneClass(isDark: boolean, accent?: "sky" | "amber" | "emerald" | "rose") {
  if (accent === "amber") {
    return isDark
      ? "border-[#fcd116]/24 bg-[#fcd116]/10 text-[#fde68a]"
      : "border-amber-300/60 bg-amber-50 text-amber-800";
  }

  if (accent === "emerald") {
    return isDark
      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
      : "border-emerald-300/60 bg-emerald-50 text-emerald-800";
  }

  if (accent === "rose") {
    return isDark
      ? "border-rose-300/20 bg-rose-400/10 text-rose-100"
      : "border-rose-300/60 bg-rose-50 text-rose-800";
  }

  return isDark
    ? "border-cyan-300/18 bg-cyan-300/10 text-cyan-100"
    : "border-sky-300/60 bg-sky-50 text-sky-800";
}
