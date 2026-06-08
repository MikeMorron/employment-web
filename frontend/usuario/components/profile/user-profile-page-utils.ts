import {
  composeExperienceTime,
  isCompleteMonthValue,
  isValidColombiaPhone,
} from "@/lib/profile-form";
import { sanitizeSummaryText } from "@/lib/summary-text";
import type { User } from "@/types/user";

export type ExperienceValidationErrors = Record<
  number,
  Partial<Record<"rol" | "empresa" | "fechaInicio" | "fechaFin", string>>
>;

export type SaveValidationState = {
  phone: string | null;
  experience: string | null;
  experienceItems: ExperienceValidationErrors;
  avatar: string | null;
};

export const EMPTY_SAVE_VALIDATION_STATE: SaveValidationState = {
  phone: null,
  experience: null,
  experienceItems: {},
  avatar: null,
};

const SPANISH_MONTH_INDEX: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

export function getProfileDateStorageValue(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseProfileDateValue(value: string) {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00-05:00`);
  }

  const spanishMatch = trimmed.match(/^(\d{1,2}) de ([a-záéíóúñ]+) de (\d{4})$/i);
  if (spanishMatch) {
    const [, dayRaw, monthRaw, yearRaw] = spanishMatch;
    const normalizedMonth = monthRaw
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const monthIndex = SPANISH_MONTH_INDEX[normalizedMonth];

    if (monthIndex != null) {
      return new Date(Number(yearRaw), monthIndex, Number(dayRaw));
    }
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatProfileDate(value: string, isEnglish: boolean) {
  const parsed = parseProfileDateValue(value);
  if (!parsed) {
    return value;
  }

  return new Intl.DateTimeFormat(isEnglish ? "en-US" : "es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function normalizeExperienceItem(item: User["experiencia"][number]) {
  const fechaInicio = item.fechaInicio?.trim() ?? "";
  const fechaFin = item.actualidad ? "" : item.fechaFin?.trim() ?? "";
  const actualidad = Boolean(item.actualidad);

  return {
    ...item,
    rol: item.rol.trim(),
    empresa: item.empresa.trim(),
    empresaNit: item.empresaNit?.trim() ?? "",
    fechaInicio,
    fechaFin,
    actualidad,
    opinion: item.opinion?.trim() ?? "",
    tiempo: composeExperienceTime(fechaInicio, fechaFin, actualidad),
  };
}

export function isEmptyExperienceItem(item: User["experiencia"][number]) {
  return (
    !item.rol.trim() &&
    !item.empresa.trim() &&
    !(item.empresaNit?.trim() ?? "") &&
    !(item.opinion?.trim() ?? "") &&
    !item.fechaInicio?.trim() &&
    !item.fechaFin?.trim() &&
    !item.actualidad
  );
}

export function validateExperienceItems(items: User["experiencia"]) {
  const cleanedItems = items.map(normalizeExperienceItem).filter((item) => !isEmptyExperienceItem(item));
  const errors: ExperienceValidationErrors = {};

  cleanedItems.forEach((item, index) => {
    const itemErrors: ExperienceValidationErrors[number] = {};

    if (!item.rol) {
      itemErrors.rol = "Este campo es requerido.";
    }

    if (!item.empresa) {
      itemErrors.empresa = "Este campo es requerido.";
    }

    if (!isCompleteMonthValue(item.fechaInicio)) {
      itemErrors.fechaInicio = "Este campo es requerido.";
    }

    if (!item.actualidad && !isCompleteMonthValue(item.fechaFin)) {
      itemErrors.fechaFin = "Este campo es requerido.";
    }

    if (Object.keys(itemErrors).length > 0) {
      errors[index] = itemErrors;
    }
  });

  return {
    cleanedItems,
    errors,
  };
}

export function getProfileScoreBreakdown(profile: User) {
  const basicInfoScore =
    (profile.nombre.trim() ? 3 : 0) +
    (profile.rol.trim() ? 5 : 0) +
    4 +
    (isValidColombiaPhone(profile.telefono) ? 3 : 0);

  const categoriesCount = profile.categoriasEnfoque?.length ?? 0;
  const categoriesScore = categoriesCount >= 2 ? 5 : categoriesCount === 1 ? 3 : 0;
  const profilePersonalScore = (sanitizeSummaryText(profile.resumenPerfil ?? "") ? 10 : 0) + categoriesScore;

  const skillsCount = profile.skills.length;
  const skillsScore =
    skillsCount >= 7 ? 20 : skillsCount >= 5 ? 15 : skillsCount >= 3 ? 10 : skillsCount >= 1 ? 5 : 0;

  const experienceCount = profile.experiencia.length;
  const experienceScore = experienceCount >= 3 ? 20 : experienceCount === 2 ? 14 : experienceCount === 1 ? 8 : 0;

  const cvScore = profile.cv?.trim() ? 15 : 0;

  const languagesCount = Math.min(profile.idiomas?.length ?? 0, 2);
  const languagesScore = languagesCount >= 2 ? 10 : languagesCount === 1 ? 5 : 0;
  const additionalScore = Math.min(15, languagesScore);

  const total =
    basicInfoScore +
    profilePersonalScore +
    skillsScore +
    experienceScore +
    cvScore +
    additionalScore;

  return {
    total,
    basicInfoScore,
    profilePersonalScore,
    skillsScore,
    experienceScore,
    cvScore,
    additionalScore,
  };
}

export function getDynamicMatchScore(profile: User) {
  return getProfileScoreBreakdown(profile).total;
}
