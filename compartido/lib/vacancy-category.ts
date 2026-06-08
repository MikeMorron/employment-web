import { vacancyCategoriesEn, vacancyCategoriesEs } from "@/data/colombia-locations";
import type { Vacancy } from "@/types/vacancy";

type VacancyCategoryEntry = {
  es: string;
  en: string;
  normalizedEs: string;
  normalizedEn: string;
  matchLength: number;
};

const vacancyCategoryEntries: VacancyCategoryEntry[] = vacancyCategoriesEs
  .map((category, index) => ({
    es: category,
    en: vacancyCategoriesEn[index] ?? category,
  }))
  .filter((entry) => entry.es !== "Todas" && entry.en !== "All")
  .map((entry) => ({
    ...entry,
    normalizedEs: normalizeVacancyCategoryValue(entry.es),
    normalizedEn: normalizeVacancyCategoryValue(entry.en),
    matchLength: Math.max(entry.es.length, entry.en.length),
  }))
  .sort((left, right) => right.matchLength - left.matchLength);

export function normalizeVacancyCategoryValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function buildVacancyHaystack(job: Pick<Vacancy, "titulo" | "descripcion" | "descripcionCompleta" | "etiquetas">) {
  return [
    job.titulo,
    job.descripcion,
    job.descripcionCompleta,
    ...(job.etiquetas ?? []),
  ]
    .filter(Boolean)
    .map((value) => normalizeVacancyCategoryValue(value!))
    .join(" ");
}

export function getVacancyFilterCategory(job: Pick<Vacancy, "titulo" | "descripcion" | "descripcionCompleta" | "etiquetas">) {
  const haystack = buildVacancyHaystack(job);

  if (!haystack) {
    return null;
  }

  const exactMatch = vacancyCategoryEntries.find((entry) =>
    haystack.includes(entry.normalizedEs) || haystack.includes(entry.normalizedEn),
  );

  if (exactMatch) {
    return exactMatch.es;
  }

  return job.etiquetas?.find(Boolean) ?? null;
}

