import type { CandidateProfile, CandidateStructuredSkill } from "@/types/profile";
import { sanitizeSummaryText, truncateSummaryText } from "@/lib/summary-text";
import { sanitizeNameInput, sanitizePlainTextInput } from "@/lib/server/security";

export function sanitizeString(value: unknown, maxLength = 160) {
  return sanitizePlainTextInput(value, maxLength);
}

export function sanitizeOptionalString(value: unknown, maxLength = 160) {
  const sanitized = sanitizeString(value, maxLength);
  return sanitized || undefined;
}

export function sanitizePersonNameField(value: unknown, maxLength = 25) {
  return sanitizeNameInput(value, maxLength);
}

export function sanitizeOptionalSummaryText(value: unknown, maxWords = 150) {
  if (typeof value !== "string") {
    return undefined;
  }

  const sanitized = sanitizeSummaryText(truncateSummaryText(value, maxWords));
  return sanitized || undefined;
}

export function sanitizeHttpUrl(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  const normalizedWithProtocol =
    /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;

  try {
    const parsed = new URL(normalizedWithProtocol);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function sanitizeStringArray(value: unknown, maxItems = 12, maxLength = 60) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => sanitizeString(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

const MALICIOUS_TEXT_PATTERNS = [
  /<\/?script\b/i,
  /\bjavascript\s*:/i,
  /\bon\w+\s*=/i,
  /\b(?:document|window|localStorage|sessionStorage)\b/i,
  /\b(?:eval|fetch|XMLHttpRequest|Function|setTimeout|setInterval)\s*\(/i,
] as const;

export function sanitizeExperienceSkillsUsed(
  value: unknown,
  maxItems = 12,
  maxLength = 140,
  maxTotalLength = 500,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  const next: string[] = [];
  let totalLength = 0;

  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }

    const normalized = item
      .replace(/\r/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const sanitized = sanitizeString(normalized, maxLength);

    if (!sanitized || MALICIOUS_TEXT_PATTERNS.some((pattern) => pattern.test(item) || pattern.test(sanitized))) {
      continue;
    }

    if (totalLength + sanitized.length > maxTotalLength) {
      break;
    }

    next.push(sanitized);
    totalLength += sanitized.length;

    if (next.length >= maxItems) {
      break;
    }
  }

  return next;
}

export function sanitizeOptionalInteger(value: unknown, max = 999) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(max, Math.round(value)));
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.min(max, Math.round(parsed)));
    }
  }

  return undefined;
}

export function sanitizeBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

export function sanitizeDateString(value: unknown) {
  const sanitized = sanitizeOptionalString(value, 20);
  return sanitized && /^\d{4}(-\d{2}){0,2}$/.test(sanitized) ? sanitized : undefined;
}

export function sanitizeCandidateStructuredSkills(value: unknown): CandidateProfile["structuredSkills"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const skillName = sanitizeString(item.skillName, 80);
      if (!skillName) {
        return null;
      }

      return {
        skillName,
        canonicalSkill: sanitizeOptionalString(item.canonicalSkill, 80),
        skillCategory: sanitizeOptionalString(item.skillCategory, 60),
        skillLevel:
          item.skillLevel === "basic" ||
          item.skillLevel === "intermediate" ||
          item.skillLevel === "advanced" ||
          item.skillLevel === "expert"
            ? item.skillLevel
            : undefined,
        yearsExperience: sanitizeOptionalInteger(item.yearsExperience, 80),
        experienceMonths: sanitizeOptionalInteger(item.experienceMonths, 999),
        lastUsedAt: sanitizeDateString(item.lastUsedAt),
        isCoreSkill: sanitizeBoolean(item.isCoreSkill),
        evidenceSource: sanitizeOptionalString(item.evidenceSource, 80),
      } satisfies CandidateStructuredSkill;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 32);
}
