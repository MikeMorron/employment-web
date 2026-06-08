import type { LanguageProficiency } from "@/types/profile";
import {
  createLanguageCode,
  getLanguageDefinition,
} from "@/lib/profile-form/languages";

export { COLOMBIA_LANGUAGE_OPTIONS, getLanguageDefinition } from "@/lib/profile-form/languages";

export const WORK_MODALITY_OPTIONS = ["Remoto", "Presencial", "Hibrido"] as const;
export const EMPLOYMENT_TYPE_OPTIONS = [
  "Tiempo completo",
  "Medio tiempo",
  "Por horas",
  "Turnos rotativos",
  "Lunes a viernes",
  "Fin de semana",
  "Nocturna",
  "Diurna",
  "Flexible",
  "Freelance",
] as const;
export const MAX_EXPECTED_SALARY_COP = 1_000_000_000;

export const TRAVEL_AVAILABILITY_OPTIONS = [
  "Si",
  "No",
  "No en este momento",
  "Dentro de poco",
] as const;

export const MOBILITY_OPTIONS = ["Moto", "Carro", "Bicicleta", "Camioneta", "No tengo Vehiculo", "Otro"] as const;

export function createLanguageProficiency(
  name: string,
  level?: string,
): LanguageProficiency {
  const definition = getLanguageDefinition(name);
  return {
    name: definition.name,
    levelSystem: definition.levelSystem,
    level: level && definition.levels.includes(level) ? level : definition.levels[0],
    languageCode: createLanguageCode(definition.name),
    isNative: definition.name === "Español" && (!level || level === "Nativo"),
    certified: false,
  };
}

export function normalizeLanguageProficiencies(
  value: LanguageProficiency[] | string[] | undefined,
) {
  return (value ?? []).map((item) => {
    if (typeof item === "string") {
      return createLanguageProficiency(item, item === "Español" ? "Nativo" : undefined);
    }

    const definition = getLanguageDefinition(item.name);
    const normalizedLevel = definition.levels.includes(item.level)
      ? item.level
      : definition.levels[0];

    return {
      ...createLanguageProficiency(definition.name, normalizedLevel),
      languageCode:
        typeof item.languageCode === "string" && item.languageCode.trim()
          ? item.languageCode.trim()
          : createLanguageCode(definition.name),
      isNative: typeof item.isNative === "boolean" ? item.isNative : normalizedLevel === "Nativo",
      certified: typeof item.certified === "boolean" ? item.certified : false,
      certificateFileName:
        typeof item.certificateFileName === "string" && item.certificateFileName.trim()
          ? item.certificateFileName.trim()
          : undefined,
      certificateStoredFileName:
        typeof item.certificateStoredFileName === "string" && item.certificateStoredFileName.trim()
          ? item.certificateStoredFileName.trim()
          : undefined,
      certificateThumbnailStoredFileName:
        typeof item.certificateThumbnailStoredFileName === "string" &&
        item.certificateThumbnailStoredFileName.trim()
          ? item.certificateThumbnailStoredFileName.trim()
          : undefined,
    };
  });
}

export function sanitizeSalaryNumeric(value: string, max = MAX_EXPECTED_SALARY_COP) {
  const digitsOnly = value.replace(/\D/g, "");

  if (!digitsOnly) {
    return "";
  }

  const numericValue = Number(digitsOnly);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "";
  }

  return String(Math.min(numericValue, max));
}

export function formatSalaryInputValue(value?: string | number | null) {
  const sanitized = sanitizeSalaryNumeric(String(value ?? ""));

  if (!sanitized) {
    return "";
  }

  return `$${new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(Number(sanitized))}`;
}

export function formatSalaryRange(min: string, max: string): string {
  const fmtMin = formatSalaryInputValue(min);
  const fmtMax = formatSalaryInputValue(max);
  if (!fmtMin && !fmtMax) return "";
  if (!fmtMax) return fmtMin;
  if (!fmtMin) return fmtMax;
  return `${fmtMin} – ${fmtMax}`;
}

export function sanitizePhoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function isValidColombiaPhone(value?: string) {
  return /^[3][0-9]{9}$/.test((value ?? "").trim());
}

export function normalizeWebsiteInput(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export function isValidWebsite(input?: string): boolean {
  if (!input?.trim()) {
    return false;
  }

  try {
    const parsed = new URL(input.trim());

    if (parsed.protocol !== "https:") return false;
    if (!parsed.hostname) return false;

    const host = parsed.hostname.toLowerCase();

    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return false;

    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) {
      return false;
    }

    const blockedHosts = ["bit.ly", "tinyurl.com", "goo.gl"];
    if (
      blockedHosts.includes(host) ||
      blockedHosts.some((domain) => host.endsWith(`.${domain}`))
    ) {
      return false;
    }

    if (parsed.username || parsed.password) return false;
    if (parsed.port && parsed.port !== "443") return false;

    const suspicious = /(%2e|%2f|%5c|\.\.|<|>|"|\'|;|--|%00)/i;
    const combined = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    if (suspicious.test(combined)) return false;

    return true;
  } catch {
    return false;
  }
}

export function sanitizeOpinionInput(value: string) {
  return value
    .replace(/<\/?[^>]+>/gi, "")
    .replace(/[<>{}]/g, "")
    .replace(/script/gi, "")
    .slice(0, 200);
}

export function composeExperienceTime(
  startDate?: string,
  endDate?: string,
  isCurrent?: boolean,
) {
  if (!startDate && !endDate && !isCurrent) {
    return "";
  }

  const start =
    startDate && isCompleteMonthValue(startDate) ? formatMonthYear(startDate) : "Inicio";
  const end = isCurrent
    ? "Actualidad"
    : endDate && isCompleteMonthValue(endDate)
      ? formatMonthYear(endDate)
      : "Actualidad";
  return `${start} - ${end}`;
}

function getCurrentBogotaYearMonth() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return { year, month };
}

export function calculateExperienceDurationMonths(
  startDate?: string,
  endDate?: string,
  isCurrent?: boolean,
) {
  if (!startDate || !isCompleteMonthValue(startDate)) {
    return undefined;
  }
  const [startYearRaw, startMonthRaw] = startDate.split("-");
  const startYear = Number(startYearRaw);
  const startMonth = Number(startMonthRaw);

  let effectiveEndDate = endDate;
  if (isCurrent) {
    const current = getCurrentBogotaYearMonth();
    effectiveEndDate = `${current.year}-${current.month}`;
  }

  if (!effectiveEndDate || !isCompleteMonthValue(effectiveEndDate)) {
    return undefined;
  }
  const [endYearRaw, endMonthRaw] = effectiveEndDate.split("-");
  const endYear = Number(endYearRaw);
  const endMonth = Number(endMonthRaw);
  const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;

  if (!Number.isFinite(totalMonths) || totalMonths <= 0) {
    return undefined;
  }

  return totalMonths;
}

export function isCompleteMonthValue(dateValue?: string) {
  if (!dateValue) {
    return false;
  }

  return /^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(dateValue);
}

function formatMonthYear(dateValue: string) {
  const [year, month] = dateValue.split("-");

  if (!year || !month || year === "0000" || month === "00") {
    return dateValue;
  }

  return `${month}/${year}`;
}

export function parseMobilityValue(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeMobilityValue(values: string[]) {
  return values.join(", ");
}
