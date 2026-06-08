import type { CandidateProfile, ExperienceItem, LanguageLevelSystem } from "@/types/profile";
import type {
  CandidateExperienceSummary,
  MatchBreakdown,
  MatchEvaluationInput,
  MatchEvaluationOptions,
  MatchFactorInput,
  MatchImpact,
  MatchLevel,
  MatchPerspective,
  MatchQualitySignals,
  MatchRankingContext,
  MatchRankingMetadata,
  MatchReason,
  MatchResult,
  MatchWeights,
  NormalizedLanguage,
  NormalizedSalaryRange,
} from "@/types/matching";
import type { Vacancy, VacancyLanguageRequirement, VacancySalaryPeriodicity } from "@/types/vacancy";
import {
  calculateCandidateRankScore,
  getCandidatePlanFeatures,
  type CandidateRankingSurface,
} from "@/lib/candidate-plan";
import { canonicalizeSkill, dedupeCanonicalSkills, SKILL_ALIASES } from "@/lib/matching-aliases";
import { applyMatchCalibration } from "@/lib/matching-calibration";
import { normalizeLanguageProficiencies } from "@/lib/profile-form";

const MATCH_WEIGHTS: MatchWeights = {
  skills: 40,
  experience: 18,
  seniority: 10,
  location: 5,
  modality: 5,
  salary: 7,
  education: 3,
  languages: 6,
  certifications: 2,
  activity: 1,
};

const CATEGORY_PRIORITY: Record<MatchReason["category"], number> = {
  skills: 1,
  experience: 2,
  seniority: 3,
  salary: 4,
  location: 5,
  modality: 5,
  languages: 6,
  certifications: 7,
  education: 7,
  activity: 8,
};

const IMPACT_PRIORITY: Record<MatchImpact, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

const LANGUAGE_ALIASES: Record<string, string[]> = {
  ingles: ["english", "bilingual", "bilingue", "bilingüe", "ing"],
  espanol: ["español", "spanish", "castellano"],
  japones: ["japones", "japanese"],
  chinomandarin: ["mandarin", "mandarín", "chinese", "chino mandarín", "chino mandarin"],
  coreano: ["korean"],
  portugues: ["portuguese", "portugués"],
  frances: ["french", "francés"],
};

const GENERIC_SKILLS = new Set(
  [
    "software",
    "desarrollo",
    "desarrollodesoftware",
    "softwaredesarrollo",
    "softwaredevelopment",
    "tecnologia",
    "tecnología",
    "technology",
    "producto",
    "product",
    "data",
    "digital",
    "ops",
    "operaciones",
    "business",
    "comercial",
    "frontend",
    "backend",
  ].map((item) => normalizeString(item).replace(/\s+/g, "")),
);

const CEFR_RANKS = new Map(
  ["A1", "A2", "B1", "B2", "C1", "C2", "Nativo"].map((level, index) => [level.toUpperCase(), index + 1]),
);

const JLPT_RANKS = new Map(
  ["N5", "N4", "N3", "N2", "N1", "NATIVO"].map((level, index) => [level.toUpperCase(), index + 1]),
);

const HSK_RANKS = new Map(
  ["HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6", "NATIVO"].map((level, index) => [level.toUpperCase(), index + 1]),
);

const TOPIK_RANKS = new Map(
  ["TOPIK1", "TOPIK2", "TOPIK3", "TOPIK4", "TOPIK5", "TOPIK6", "NATIVO"].map((level, index) => [level.toUpperCase(), index + 1]),
);

type FactorEvaluation = {
  score: number;
  confidenceScore: number;
  isNeutral?: boolean;
  applicability?: "confirmed" | "neutral" | "unknown";
  strengths: MatchReason[];
  gaps: MatchReason[];
  warnings: MatchReason[];
  missingData: string[];
  criticalGaps: string[];
};

type VacancyExtraction = {
  factors: MatchFactorInput;
  qualitySignals: MatchQualitySignals;
  missingData: string[];
};

type EvaluationContext = {
  perspective: MatchPerspective;
  candidate: CandidateProfile;
  vacancy: Vacancy;
  factors: MatchFactorInput;
  experience: CandidateExperienceSummary;
  candidateSalary: NormalizedSalaryRange | null;
  candidateLanguages: NormalizedLanguage[];
};

const HARD_FACTOR_KEYS = ["skills", "experience", "seniority", "languages"] as const;
const SOFT_FACTOR_KEYS = ["salary", "location", "modality", "education", "certifications", "activity"] as const;
const HARD_CRITICAL_GAPS = new Set([
  "required_skills_gap",
  "required_skills_major_gap",
  "experience_gap",
  "experience_relevance_gap",
  "experience_uncertain",
  "seniority_gap",
  "language_gap",
]);
const EXPERIENCE_SIGNAL_STOPWORDS = new Set([
  "senior",
  "sr",
  "junior",
  "jr",
  "mid",
  "semi",
  "semisenior",
  "ssr",
  "lead",
  "staff",
  "principal",
  "ii",
  "iii",
]);

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeString(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+#./\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalizeLanguageName(value: string) {
  const normalized = normalizeString(value).replace(/[\s./-]+/g, "");

  for (const [canonical, aliases] of Object.entries(LANGUAGE_ALIASES)) {
    if ([canonical, ...aliases].map((item) => normalizeString(item).replace(/[\s./-]+/g, "")).includes(normalized)) {
      return canonical;
    }
  }

  return normalized;
}

function isGenericSkill(value: string) {
  return GENERIC_SKILLS.has(normalizeString(value).replace(/\s+/g, ""));
}

function tokenizeEvidence(value: string) {
  return normalizeString(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function getRequirementEvidenceScore(requirements: string[], evidence: string[]) {
  if (requirements.length === 0) {
    return 0;
  }

  const evidenceText = evidence.map((item) => normalizeString(item)).join(" ");
  if (!evidenceText) {
    return 0;
  }

  const ratios = requirements.map((requirement) => {
    const tokens = tokenizeEvidence(requirement);
    if (tokens.length === 0) {
      return 0;
    }

    const matchedTokens = tokens.filter((token) => evidenceText.includes(token)).length;
    return matchedTokens / tokens.length;
  });

  const bestRatio = Math.max(...ratios, 0);

  if (bestRatio >= 0.85) {
    return 90;
  }
  if (bestRatio >= 0.5) {
    return 65;
  }
  if (bestRatio >= 0.2) {
    return 40;
  }

  return 25;
}

function getDisplaySkillLabel(skill: string) {
  const label =
    Object.entries(SKILL_ALIASES).find(([canonical]) => canonical === skill)?.[0] ??
    skill;

  return label
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function buildReason(
  key: string,
  label: string,
  type: MatchReason["type"],
  category: MatchReason["category"],
  weight: number,
  impact: MatchImpact,
  actionLabel?: string,
): MatchReason {
  return { key, label, type, category, weight, impact, actionLabel };
}

function prioritizeReasons(reasons: MatchReason[]) {
  return [...reasons].sort((left, right) => {
    if (CATEGORY_PRIORITY[left.category] !== CATEGORY_PRIORITY[right.category]) {
      return CATEGORY_PRIORITY[left.category] - CATEGORY_PRIORITY[right.category];
    }

    if (IMPACT_PRIORITY[left.impact] !== IMPACT_PRIORITY[right.impact]) {
      return IMPACT_PRIORITY[left.impact] - IMPACT_PRIORITY[right.impact];
    }

    return right.weight - left.weight;
  });
}

function toLevel(score: number): MatchLevel {
  if (score >= 75) {
    return "high";
  }
  if (score >= 50) {
    return "medium";
  }
  return "low";
}

function getLanguageRank(levelSystem: LanguageLevelSystem, level: string) {
  const normalizedLevel = normalizeString(level).toUpperCase().replace(/\s+/g, "");
  const map =
    levelSystem === "JLPT"
      ? JLPT_RANKS
      : levelSystem === "HSK"
        ? HSK_RANKS
        : levelSystem === "TOPIK"
          ? TOPIK_RANKS
          : CEFR_RANKS;

  return map.get(normalizedLevel) ?? 0;
}

function normalizeCandidateLanguages(value: CandidateProfile["idiomas"]): NormalizedLanguage[] {
  return normalizeLanguageProficiencies(value).map((language) => ({
    name: canonicalizeLanguageName(language.name),
    level: language.level,
    levelSystem: language.levelSystem,
    proficiencyRank: getLanguageRank(language.levelSystem, language.level),
  }));
}

function parseYearMonth(value: string | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const yearMonthMatch = /^(\d{4})[-/](\d{1,2})$/.exec(trimmed);
  if (yearMonthMatch) {
    const year = Number(yearMonthMatch[1]);
    const month = Number(yearMonthMatch[2]);
    if (month >= 1 && month <= 12) {
      return { year, month };
    }
  }

  const fullDateMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(trimmed);
  if (fullDateMatch) {
    const year = Number(fullDateMatch[1]);
    const month = Number(fullDateMatch[2]);
    if (month >= 1 && month <= 12) {
      return { year, month };
    }
  }

  const yearMatch = /^(\d{4})$/.exec(trimmed);
  if (yearMatch) {
    return { year: Number(yearMatch[1]), month: 1 };
  }

  const slashMonthMatch = /^(\d{1,2})[-/](\d{4})$/.exec(trimmed);
  if (slashMonthMatch) {
    const month = Number(slashMonthMatch[1]);
    const year = Number(slashMonthMatch[2]);
    if (month >= 1 && month <= 12) {
      return { year, month };
    }
  }

  return null;
}

function parseExperienceRangeFallback(timeLabel: string | undefined) {
  if (!timeLabel) {
    return null;
  }

  const years = [...timeLabel.matchAll(/(19|20)\d{2}/g)].map((match) => Number(match[0]));
  if (years.length === 0) {
    return null;
  }

  return {
    startDate: `${years[0]}-01`,
    endDate: /actual|present|current/i.test(timeLabel) ? null : `${years[years.length - 1]}-12`,
    current: /actual|present|current/i.test(timeLabel),
  };
}

function monthIndex(year: number, month: number) {
  return year * 12 + (month - 1);
}

function diffInMonths(start: { year: number; month: number }, end: { year: number; month: number }) {
  return Math.max(0, monthIndex(end.year, end.month) - monthIndex(start.year, start.month) + 1);
}

function normalizeExperienceSummary(experience: ExperienceItem[]): CandidateExperienceSummary {
  const now = new Date();
  const currentYearMonth = {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
  };
  const ranges: CandidateExperienceSummary["ranges"] = [];
  let uncertainEntries = 0;
  let datedEntries = 0;

  for (const item of experience) {
    const startValue = item.startDate ?? item.fechaInicio;
    const endValue = item.endDate ?? item.fechaFin;
    const current = item.current ?? item.actualidad ?? false;
    const fallback = parseExperienceRangeFallback(item.tiempo);
    const parsedStart = parseYearMonth(startValue ?? fallback?.startDate ?? undefined);
    const parsedEnd = current
      ? currentYearMonth
      : parseYearMonth(endValue ?? fallback?.endDate ?? undefined);

    if (!parsedStart || !parsedEnd) {
      uncertainEntries += 1;
      continue;
    }

    if (monthIndex(parsedEnd.year, parsedEnd.month) < monthIndex(parsedStart.year, parsedStart.month)) {
      uncertainEntries += 1;
      continue;
    }

    ranges.push({
      startDate: `${parsedStart.year}-${String(parsedStart.month).padStart(2, "0")}`,
      endDate: `${parsedEnd.year}-${String(parsedEnd.month).padStart(2, "0")}`,
      current,
      source: startValue || endValue ? "structured" : "text",
    });
    datedEntries += 1;
  }

  const merged = ranges
    .map((range) => ({
      ...range,
      start: parseYearMonth(range.startDate)!,
      end: parseYearMonth(range.endDate)!,
    }))
    .sort((left, right) => monthIndex(left.start.year, left.start.month) - monthIndex(right.start.year, right.start.month));

  const mergedRanges: Array<{ start: { year: number; month: number }; end: { year: number; month: number } }> = [];
  for (const range of merged) {
    const currentRange = mergedRanges[mergedRanges.length - 1];
    if (!currentRange) {
      mergedRanges.push({ start: range.start, end: range.end });
      continue;
    }

    if (monthIndex(range.start.year, range.start.month) <= monthIndex(currentRange.end.year, currentRange.end.month) + 1) {
      if (monthIndex(range.end.year, range.end.month) > monthIndex(currentRange.end.year, currentRange.end.month)) {
        currentRange.end = range.end;
      }
      continue;
    }

    mergedRanges.push({ start: range.start, end: range.end });
  }

  const totalMonths = mergedRanges.reduce((sum, range) => sum + diffInMonths(range.start, range.end), 0);
  const totalYears = Math.round((totalMonths / 12) * 10) / 10;
  const entryCount = experience.length;
  const datedRatio = entryCount > 0 ? datedEntries / entryCount : 0;
  const structuralRatio = datedEntries > 0 ? ranges.filter((range) => range.source === "structured").length / datedEntries : 0;
  const confidenceScore =
    entryCount === 0
      ? 20
      : clampScore(datedRatio * 75 + structuralRatio * 15 + (datedEntries > 0 ? 10 : 0));

  return {
    totalMonths,
    totalYears,
    confidenceScore,
    uncertainEntries,
    datedEntries,
    overlappingEntriesMerged: Math.max(0, ranges.length - mergedRanges.length),
    ranges,
  };
}

function getExperienceEntryText(item: ExperienceItem) {
  return normalizeString(
    [
      item.rol,
      item.opinion,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function getDurationMonthsForExperienceItem(item: ExperienceItem) {
  const now = new Date();
  const currentYearMonth = {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
  };
  const startValue = item.startDate ?? item.fechaInicio;
  const endValue = item.endDate ?? item.fechaFin;
  const current = item.current ?? item.actualidad ?? false;
  const fallback = parseExperienceRangeFallback(item.tiempo);
  const parsedStart = parseYearMonth(startValue ?? fallback?.startDate ?? undefined);
  const parsedEnd = current
    ? currentYearMonth
    : parseYearMonth(endValue ?? fallback?.endDate ?? undefined);

  if (!parsedStart || !parsedEnd) {
    return 0;
  }

  return diffInMonths(parsedStart, parsedEnd);
}

function buildRelevantExperienceSignals(vacancy: Vacancy, requiredSkills: string[]) {
  const roleSignals = normalizeString(vacancy.titulo)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !EXPERIENCE_SIGNAL_STOPWORDS.has(token));

  const skillSignals = requiredSkills
    .map((skill) => normalizeString(getDisplaySkillLabel(skill)))
    .filter(Boolean);

  return {
    roleSignals: [...new Set(roleSignals)],
    skillSignals: [...new Set(skillSignals)],
  };
}

function scoreRatioToBand(value: number, bands: Array<{ min: number; score: number }>, fallback: number) {
  for (const band of bands) {
    if (value >= band.min) {
      return band.score;
    }
  }

  return fallback;
}

function scoreRelevantExperience(
  candidate: CandidateProfile,
  vacancy: Vacancy,
  requiredSkills: string[],
) {
  const { roleSignals, skillSignals } = buildRelevantExperienceSignals(vacancy, requiredSkills);
  const allTexts = [
    normalizeString(candidate.rol ?? ""),
    ...candidate.experiencia.map(getExperienceEntryText),
  ].filter(Boolean);

  if (allTexts.length === 0) {
    return 10;
  }

  const totalMonths = candidate.experiencia.reduce(
    (sum, item) => sum + getDurationMonthsForExperienceItem(item),
    0,
  );

  let weightedRoleMatch = 0;
  let weightedSkillMatch = 0;
  let accumulatedWeight = 0;

  candidate.experiencia.forEach((item) => {
    const text = getExperienceEntryText(item);
    if (!text) {
      return;
    }

    const months = Math.max(1, getDurationMonthsForExperienceItem(item));
    const weight = totalMonths > 0 ? months / totalMonths : 1 / Math.max(candidate.experiencia.length, 1);

    const roleRatio =
      roleSignals.length > 0
        ? roleSignals.filter((signal) => text.includes(signal)).length / roleSignals.length
        : 0;
    const skillRatio =
      skillSignals.length > 0
        ? skillSignals.filter((signal) => text.includes(signal)).length / skillSignals.length
        : 0;

    weightedRoleMatch += roleRatio * weight;
    weightedSkillMatch += skillRatio * weight;
    accumulatedWeight += weight;
  });

  const fallbackText = allTexts.join(" ");
  const fallbackRoleRatio =
    roleSignals.length > 0
      ? roleSignals.filter((signal) => fallbackText.includes(signal)).length / roleSignals.length
      : 0;
  const fallbackSkillRatio =
    skillSignals.length > 0
      ? skillSignals.filter((signal) => fallbackText.includes(signal)).length / skillSignals.length
      : 0;

  const roleEvidence = Math.max(
    accumulatedWeight > 0 ? weightedRoleMatch / accumulatedWeight : 0,
    fallbackRoleRatio,
  );
  const skillEvidence = Math.max(
    accumulatedWeight > 0 ? weightedSkillMatch / accumulatedWeight : 0,
    fallbackSkillRatio,
  );
  const combinedEvidence = roleEvidence * 0.65 + skillEvidence * 0.35;

  return scoreRatioToBand(
    combinedEvidence,
    [
      { min: 0.85, score: 100 },
      { min: 0.65, score: 75 },
      { min: 0.45, score: 55 },
      { min: 0.25, score: 30 },
      { min: 0.1, score: 10 },
    ],
    5,
  );
}

function getYearsRequirementScore(summary: CandidateExperienceSummary, minimumYears: number | null) {
  if (minimumYears === null) {
    return 10;
  }

  if (summary.datedEntries === 0) {
    return 10;
  }

  const ratio = summary.totalYears / minimumYears;

  return scoreRatioToBand(
    ratio,
    [
      { min: 1.4, score: 100 },
      { min: 1, score: 80 },
      { min: 0.8, score: 50 },
      { min: 0.01, score: 15 },
    ],
    10,
  );
}

function getExperienceEvidenceQualityScore(summary: CandidateExperienceSummary) {
  if (summary.datedEntries === 0) {
    return 10;
  }

  if (summary.confidenceScore >= 90) {
    return 100;
  }

  if (summary.confidenceScore >= 75) {
    return 60;
  }

  if (summary.confidenceScore >= 55) {
    return 25;
  }

  return 5;
}

function getFactorApplicability(evaluation: FactorEvaluation) {
  if (evaluation.applicability) {
    return evaluation.applicability;
  }

  if (evaluation.isNeutral) {
    return "neutral" as const;
  }

  return "confirmed" as const;
}

function getUnknownFactorWeightMultiplier(confidenceScore: number) {
  if (confidenceScore >= 85) {
    return 0.3;
  }

  if (confidenceScore >= 60) {
    return 0.2;
  }

  return 0.1;
}

function getSoftContributionMultiplier(args: {
  breakdown: MatchBreakdown;
  weights: MatchWeights;
  neutralFactors: Set<keyof MatchBreakdown>;
  criticalGaps: string[];
}) {
  const hardCriticalGapCount = args.criticalGaps.filter((gap) => HARD_CRITICAL_GAPS.has(gap)).length;
  const activeHardFactors = HARD_FACTOR_KEYS.filter((key) => !args.neutralFactors.has(key));
  const activeHardWeight = activeHardFactors.reduce((sum, key) => sum + args.weights[key], 0);
  const hardEvidenceScore =
    activeHardWeight > 0
      ? activeHardFactors.reduce(
          (sum, key) => sum + args.breakdown[key] * args.weights[key],
          0,
        ) / activeHardWeight
      : 0;

  if (args.criticalGaps.includes("required_skills_major_gap")) {
    return 0.05;
  }

  if (args.breakdown.skills < 40) {
    return 0.12;
  }

  if (hardCriticalGapCount >= 2) {
    return 0.15;
  }

  if (hardCriticalGapCount >= 1) {
    return 0.25;
  }

  if (hardEvidenceScore < 35) {
    return 0.18;
  }

  if (hardEvidenceScore < 50) {
    return 0.35;
  }

  if (hardEvidenceScore < 65) {
    return 0.55;
  }

  if (hardEvidenceScore < 80) {
    return 0.75;
  }

  return 1;
}

function buildDynamicWeights(args: {
  weights: MatchWeights;
  factors: MatchFactorInput;
  qualitySignals: MatchQualitySignals;
  evaluations: Record<keyof MatchBreakdown, FactorEvaluation>;
}) {
  const nextWeights: MatchWeights = { ...args.weights };

  if (args.factors.requiredLanguages.length > 0) {
    nextWeights.languages = Math.round(nextWeights.languages * 1.5 * 100) / 100;
  }

  if (!args.qualitySignals.hasStructuredSalary) {
    nextWeights.salary = Math.round(nextWeights.salary * 0.2 * 100) / 100;
  }

  if (getFactorApplicability(args.evaluations.location) === "unknown") {
    nextWeights.location = Math.round(nextWeights.location * 0.4 * 100) / 100;
  }

  if (getFactorApplicability(args.evaluations.modality) === "unknown") {
    nextWeights.modality = Math.round(nextWeights.modality * 0.4 * 100) / 100;
  }

  if (getFactorApplicability(args.evaluations.experience) === "unknown") {
    nextWeights.experience = Math.round(nextWeights.experience * 0.55 * 100) / 100;
  }

  if (getFactorApplicability(args.evaluations.languages) === "unknown") {
    nextWeights.languages = Math.round(nextWeights.languages * 0.5 * 100) / 100;
  }

  if (getFactorApplicability(args.evaluations.salary) === "unknown") {
    nextWeights.salary = Math.round(nextWeights.salary * 0.4 * 100) / 100;
  }

  if (getFactorApplicability(args.evaluations.education) === "neutral") {
    nextWeights.education = 0;
  }

  if (getFactorApplicability(args.evaluations.certifications) === "neutral") {
    nextWeights.certifications = 0;
  }

  return nextWeights;
}

function extractMonetaryNumbers(raw: string) {
  return [...raw.matchAll(/(?:\$|cop|usd|eur)?\s*(\d+(?:[.,]\d+)?)\s*(m|k|mil|mm)?/gi)]
    .map((match) => {
      const base = Number(match[1].replace(/\./g, "").replace(",", "."));
      const scale = normalizeString(match[2] ?? "");
      if (!Number.isFinite(base)) {
        return null;
      }

      if (scale === "m" || scale === "mm") {
        return Math.round(base * 1_000_000);
      }
      if (scale === "k") {
        return Math.round(base * 1_000);
      }
      if (scale === "mil") {
        return Math.round(base * 1_000);
      }

      if (base >= 1000) {
        return Math.round(base);
      }

      return Math.round(base * 1_000_000);
    })
    .filter((value): value is number => typeof value === "number" && value > 0);
}

function inferCurrency(raw: string) {
  if (/usd|d[oó]lar|dollar/i.test(raw)) {
    return "USD";
  }
  if (/eur|euro/i.test(raw)) {
    return "EUR";
  }
  if (/cop|colomb/i.test(raw) || /\$/.test(raw)) {
    return "COP";
  }

  return null;
}

function inferPeriodicity(raw: string): VacancySalaryPeriodicity {
  if (/hora|hour/i.test(raw)) {
    return "hourly";
  }
  if (/dia|día|daily/i.test(raw)) {
    return "daily";
  }
  if (/semana|weekly/i.test(raw)) {
    return "weekly";
  }
  if (/anual|año|year/i.test(raw)) {
    return "yearly";
  }
  if (/mes|mensual|monthly/i.test(raw)) {
    return "monthly";
  }

  return "unknown";
}

function normalizeSalaryRange(input: {
  raw?: string | null;
  structuredMin?: number | null;
  structuredMax?: number | null;
  currency?: string | null;
  periodicity?: VacancySalaryPeriodicity | null;
  source: "structured" | "text" | "candidate";
}): NormalizedSalaryRange | null {
  const raw = input.raw?.trim() ?? null;
  const currency = input.currency ?? (raw ? inferCurrency(raw) : null);
  const periodicity = input.periodicity ?? (raw ? inferPeriodicity(raw) : "unknown");
  const hasStructuredNumbers = input.structuredMin !== null || input.structuredMax !== null;

  let min = input.structuredMin ?? null;
  let max = input.structuredMax ?? null;
  let confidenceScore =
    input.source === "structured"
      ? 90
      : hasStructuredNumbers
        ? 78
        : 30;

  if ((!min || !max) && raw) {
    const values = extractMonetaryNumbers(raw);
    if (values.length >= 2) {
      min = Math.min(...values);
      max = Math.max(...values);
      confidenceScore = Math.max(confidenceScore, 82);
    } else if (values.length === 1) {
      min = values[0];
      max = values[0];
      confidenceScore = Math.max(confidenceScore, 68);
    }
  }

  if (!min && !max) {
    return null;
  }

  const normalizedMin = min ?? max ?? null;
  const normalizedMax = max ?? min ?? null;
  if (!normalizedMin || !normalizedMax) {
    return null;
  }

  if (currency) {
    confidenceScore += 8;
  }
  if (periodicity !== "unknown") {
    confidenceScore += 6;
  }
  if (input.source === "candidate") {
    confidenceScore = Math.min(100, confidenceScore + (hasStructuredNumbers ? 12 : 4));
  }

  return {
    min: Math.min(normalizedMin, normalizedMax),
    max: Math.max(normalizedMin, normalizedMax),
    currency,
    periodicity,
    confidenceScore: clampScore(confidenceScore),
    source: input.source,
    raw,
  };
}

function normalizeCandidateSalary(candidate: CandidateProfile) {
  return normalizeSalaryRange({
    raw:
      candidate.expectativaSalarial && candidate.expectativaSalarial.trim()
        ? candidate.expectativaSalarial
        : null,
    structuredMin: candidate.expectativaSalarialMin
      ? Number(candidate.expectativaSalarialMin.replace(/[^\d]/g, "")) || null
      : null,
    structuredMax: candidate.expectativaSalarialMax
      ? Number(candidate.expectativaSalarialMax.replace(/[^\d]/g, "")) || null
      : null,
    currency: "COP",
    periodicity: "monthly",
    source: "candidate",
  });
}

function normalizeVacancySalary(vacancy: Vacancy) {
  return normalizeSalaryRange({
    raw: vacancy.salario ?? null,
    structuredMin:
      vacancy.salaryMinAmount ??
      (typeof vacancy.salarioMinimoMillones === "number" ? Math.round(vacancy.salarioMinimoMillones * 1_000_000) : null),
    structuredMax:
      vacancy.salaryMaxAmount ??
      null,
    currency: vacancy.salaryCurrency ?? "COP",
    periodicity: vacancy.salaryPeriodicity ?? "monthly",
    source: vacancy.salaryMinAmount || vacancy.salaryMaxAmount ? "structured" : "text",
  });
}

function detectModality(value?: string | null): MatchFactorInput["modality"] {
  const normalized = normalizeString(value ?? "");
  if (!normalized) {
    return "unknown";
  }
  if (normalized.includes("remoto") || normalized.includes("remote")) {
    return "remote";
  }
  if (normalized.includes("hibrido") || normalized.includes("hybrid")) {
    return "hybrid";
  }
  if (normalized.includes("presencial") || normalized.includes("onsite")) {
    return "onsite";
  }
  if (normalized.includes("flex")) {
    return "flexible";
  }

  return "unknown";
}

function inferExperienceRequirement(vacancy: Vacancy, fullText: string) {
  if (typeof vacancy.experienciaMinimaAnos === "number" && vacancy.experienciaMinimaAnos > 0) {
    return vacancy.experienciaMinimaAnos;
  }

  const match = fullText.match(/(\d+)\s*\+?\s*(?:anos|años|years)/i);
  if (!match) {
    return null;
  }

  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function inferSeniorityFromText(text: string, years: number | null) {
  const normalized = normalizeString(text);
  let score = 0;

  if (/\b(principal|staff|lead|lider|líder|head)\b/.test(normalized)) {
    score += 4;
  } else if (/\b(senior|sr)\b/.test(normalized)) {
    score += 3;
  } else if (/\b(semi senior|semisenior|mid|middle)\b/.test(normalized)) {
    score += 2;
  } else if (/\b(junior|jr|trainee)\b/.test(normalized)) {
    score += 1;
  }

  if (years !== null) {
    if (years >= 8) {
      score = Math.max(score, 4);
    } else if (years >= 5) {
      score = Math.max(score, 3);
    } else if (years >= 2) {
      score = Math.max(score, 2);
    } else {
      score = Math.max(score, 1);
    }
  }

  if (score >= 4) {
    return "lead";
  }
  if (score === 3) {
    return "senior";
  }
  if (score === 2) {
    return "mid";
  }
  return "junior";
}

function inferCandidateSeniority(candidate: CandidateProfile, experience: CandidateExperienceSummary) {
  const text = [candidate.rol, ...candidate.experiencia.map((item) => item.rol)].join(" ");
  return inferSeniorityFromText(text, experience.totalYears || null);
}

function inferLanguageRequirements(vacancy: Vacancy, fullText: string) {
  if (Array.isArray(vacancy.languageRequirements) && vacancy.languageRequirements.length > 0) {
    return vacancy.languageRequirements.map((item) => ({
      ...item,
      required: true,
      source: "structured" as const,
    }));
  }

  const requirements: VacancyLanguageRequirement[] = [];
  const normalized = normalizeString(fullText);

  const englishDetected = /\b(english|ingles|ingles|bilingual|bilingue|bilingüe)\b/.test(normalized);
  if (englishDetected) {
    const minLevel = /\b(c1|advanced|avanzado|fluido|fluent)\b/.test(normalized)
      ? "C1"
      : /\b(b2|intermediate|intermedio)\b/.test(normalized) || /\bbilingual\b/.test(normalized)
        ? "B2"
        : "B1";
    requirements.push({ name: "Inglés", minLevel, levelSystem: "CEFR" });
  }

  const japaneseMatch = normalized.match(/\b(n[1-5])\b/);
  if (/\b(japones|japanese)\b/.test(normalized)) {
    requirements.push({
      name: "Japonés",
      minLevel: japaneseMatch?.[1]?.toUpperCase() ?? "N3",
      levelSystem: "JLPT",
    });
  }

  const chineseMatch = normalized.match(/\b(hsk\s*[1-6])\b/i);
  if (/\b(chino|mandarin|mandarin)\b/.test(normalized)) {
    requirements.push({
      name: "Chino mandarín",
      minLevel: chineseMatch?.[1]?.toUpperCase().replace(/\s+/g, "") ?? "HSK4",
      levelSystem: "HSK",
    });
  }

  return requirements.map((item) => ({
    ...item,
    required: true,
    source: "inferred" as const,
  }));
}

function inferEducationRequirements(vacancy: Vacancy, fullText: string) {
  if (Array.isArray(vacancy.requiredEducation) && vacancy.requiredEducation.length > 0) {
    return vacancy.requiredEducation;
  }

  if (/\b(ingenier|profesional|tecnolog|universitari|bachelor|degree)\b/i.test(fullText)) {
    return ["Profesional o técnico"];
  }

  return [];
}

function inferCertificationRequirements(vacancy: Vacancy, fullText: string) {
  if (Array.isArray(vacancy.requiredCertifications) && vacancy.requiredCertifications.length > 0) {
    return vacancy.requiredCertifications;
  }

  if (/\b(certif|aws|azure|scrum|pmp|itil)\b/i.test(fullText)) {
    return ["Certificación relevante"];
  }

  return [];
}

function inferSkills(vacancy: Vacancy) {
  const providedRequired = vacancy.requiredSkills?.filter(Boolean) ?? [];
  const providedOptional = vacancy.optionalSkills?.filter(Boolean) ?? [];

  if (providedRequired.length > 0 || providedOptional.length > 0) {
    return {
      requiredSkills: dedupeCanonicalSkills(providedRequired),
      optionalSkills: dedupeCanonicalSkills(providedOptional),
    };
  }

  const tags = (vacancy.etiquetas ?? []).map((tag) => tag.trim()).filter(Boolean);
  const canonicalTags = dedupeCanonicalSkills(tags);
  const specific = canonicalTags.filter((tag) => !isGenericSkill(tag));
  const generic = canonicalTags.filter((tag) => isGenericSkill(tag));

  return {
    requiredSkills: specific.slice(0, Math.min(5, specific.length)),
    optionalSkills: [...specific.slice(Math.min(5, specific.length)), ...generic],
  };
}

function extractVacancyRequirements(vacancy: Vacancy): VacancyExtraction {
  const fullText = [
    vacancy.titulo,
    vacancy.descripcion,
    vacancy.descripcionCompleta,
    ...(vacancy.etiquetas ?? []),
  ]
    .filter(Boolean)
    .join(" ");

  const salary = normalizeVacancySalary(vacancy);
  const inferredSkills = inferSkills(vacancy);
  const minimumExperienceYears = inferExperienceRequirement(vacancy, fullText);
  const modality = detectModality(vacancy.modalidad);
  const requiredLanguages = inferLanguageRequirements(vacancy, fullText);
  const requiredEducation = inferEducationRequirements(vacancy, fullText);
  const requiredCertifications = inferCertificationRequirements(vacancy, fullText);
  const qualitySignals: MatchQualitySignals = {
    candidateProfileQuality: 0,
    vacancyQuality: 0,
    experienceDataQuality: minimumExperienceYears ? 100 : 10,
    salaryDataQuality: salary?.confidenceScore ?? 20,
    languageDataQuality: requiredLanguages.length > 0 ? 100 : 0,
    requiredSkillsQuality:
      inferredSkills.requiredSkills.length >= 2
        ? 100
        : inferredSkills.requiredSkills.length === 1
          ? 50
          : 0,
    hasStructuredSalary: (salary?.confidenceScore ?? 0) >= 60,
    hasClearModality: modality !== "unknown",
    hasClearExperienceRequirement: minimumExperienceYears !== null,
    hasClearRequiredSkills: inferredSkills.requiredSkills.length >= 1,
  };

  qualitySignals.vacancyQuality = clampScore(
    qualitySignals.requiredSkillsQuality * 0.45 +
      qualitySignals.salaryDataQuality * 0.2 +
      (qualitySignals.hasClearModality ? 100 : 10) * 0.15 +
      qualitySignals.experienceDataQuality * 0.2,
  );

  const missingData: string[] = [];
  if (!qualitySignals.hasClearRequiredSkills) {
    missingData.push("vacancy_required_skills_missing");
  }
  if (!qualitySignals.hasStructuredSalary) {
    missingData.push("vacancy_salary_unstructured");
  }
  if (!qualitySignals.hasClearModality) {
    missingData.push("vacancy_modality_missing");
  }
  if (!qualitySignals.hasClearExperienceRequirement) {
    missingData.push("vacancy_experience_requirement_missing");
  }

  return {
    factors: {
      requiredSkills: inferredSkills.requiredSkills,
      optionalSkills: inferredSkills.optionalSkills,
      requiredLanguages,
      optionalLanguages: [],
      requiredCertifications,
      optionalCertifications: [],
      requiredEducation,
      optionalEducation: [],
      minimumExperienceYears,
      seniority: inferSeniorityFromText([vacancy.titulo, fullText].join(" "), minimumExperienceYears),
      location: vacancy.ubicacion,
      modality,
      salary,
      jobPostedRecently: (vacancy.diasDesdePublicacion ?? 999) <= 14,
      candidateRecentlyActive: true,
    },
    qualitySignals,
    missingData,
  };
}

function compareSkills(
  candidateSkills: string[],
  requiredSkills: string[],
  optionalSkills: string[],
  perspective: MatchPerspective,
): FactorEvaluation {
  const normalizedCandidateSkills = new Set(dedupeCanonicalSkills(candidateSkills).filter((skill) => !isGenericSkill(skill)));
  const dedupedRequiredSkills = [...new Set(requiredSkills.map((skill) => canonicalizeSkill(skill)).filter((skill) => !isGenericSkill(skill)))];
  const dedupedOptionalSkills = [...new Set(optionalSkills.map((skill) => canonicalizeSkill(skill)))];
  const matchedRequired = dedupedRequiredSkills.filter((skill) => normalizedCandidateSkills.has(skill));
  const missingRequired = dedupedRequiredSkills.filter((skill) => !matchedRequired.includes(skill));
  const matchedOptional = dedupedOptionalSkills.filter((skill) => normalizedCandidateSkills.has(skill));

  if (dedupedRequiredSkills.length === 0 && dedupedOptionalSkills.length === 0) {
    return {
      score: 8,
      confidenceScore: 15,
      applicability: "unknown",
      strengths: [],
      gaps: [],
      warnings: [
        buildReason(
          "skills_not_structured",
          perspective === "candidate"
            ? "La vacante no define skills claras; el fit técnico puede ser menos preciso"
            : "La vacante no define skills claras; el fit técnico puede ser menos preciso",
          "warning",
          "skills",
          MATCH_WEIGHTS.skills,
          "medium",
          "Estructura mejor las skills requeridas de la vacante",
        ),
      ],
      missingData: ["vacancy_required_skills_missing"],
      criticalGaps: [],
    };
  }

  const requiredRatio =
    dedupedRequiredSkills.length > 0 ? matchedRequired.length / dedupedRequiredSkills.length : 0;
  const optionalRatio =
    dedupedOptionalSkills.length > 0 ? matchedOptional.length / dedupedOptionalSkills.length : 0;
  const requiredScore =
    dedupedRequiredSkills.length > 0
      ? scoreRatioToBand(
          requiredRatio,
          [
            { min: 1, score: 100 },
            { min: 0.8, score: 85 },
            { min: 0.6, score: 65 },
            { min: 0.4, score: 40 },
          ],
          15,
        )
      : 0;
  const optionalScore = clampScore(optionalRatio * 100);
  const baseScore =
    dedupedRequiredSkills.length > 0
      ? requiredScore * 0.75 + optionalScore * 0.25
      : optionalScore * 0.35;

  const strengths: MatchReason[] = [];
  const gaps: MatchReason[] = [];
  const warnings: MatchReason[] = [];
  const criticalGaps: string[] = [];

  if (matchedRequired.length > 0) {
    strengths.push(
      buildReason(
        "required_skills_match",
        perspective === "candidate"
          ? `Coincides con ${matchedRequired.length} skill${matchedRequired.length === 1 ? "" : "s"} clave`
          : `El perfil coincide con ${matchedRequired.length} skill${matchedRequired.length === 1 ? "" : "s"} clave`,
        "strength",
        "skills",
        MATCH_WEIGHTS.skills,
        matchedRequired.length === dedupedRequiredSkills.length ? "high" : "medium",
      ),
    );
  }

  missingRequired.slice(0, 2).forEach((skill) => {
    gaps.push(
      buildReason(
        `missing_skill_${skill}`,
        perspective === "candidate"
          ? `Falta experiencia clara en ${getDisplaySkillLabel(skill)}`
          : `Falta experiencia clara en ${getDisplaySkillLabel(skill)}`,
        "gap",
        "skills",
        MATCH_WEIGHTS.skills,
        "high",
        perspective === "candidate"
          ? `Agrega proyectos o experiencia real en ${getDisplaySkillLabel(skill)}`
          : "Estructura mejor las skills requeridas de la vacante",
      ),
    );
  });

  if (dedupedOptionalSkills.length > 0 && matchedOptional.length > 0) {
    strengths.push(
      buildReason(
        "optional_skills_bonus",
        perspective === "candidate"
          ? "También coincides con skills complementarias"
          : "También coincide con skills complementarias",
        "strength",
        "skills",
        MATCH_WEIGHTS.skills,
        "low",
      ),
    );
  }

  if (missingRequired.length >= 1 && matchedRequired.length > 0) {
    warnings.push(
      buildReason(
        "partial_required_skills",
        perspective === "candidate"
          ? "Cumples parcialmente las habilidades obligatorias"
          : "Cumple parcialmente las habilidades obligatorias",
        "warning",
        "skills",
        MATCH_WEIGHTS.skills,
        "medium",
        perspective === "candidate"
          ? "Completa las habilidades más críticas en tu perfil"
          : "Reduce las habilidades obligatorias si el rol está demasiado cerrado",
      ),
    );
  }

  if (missingRequired.length >= 1) {
    criticalGaps.push("required_skills_gap");
  }
  if (missingRequired.length >= 2 || (dedupedRequiredSkills.length > 0 && matchedRequired.length === 0)) {
    criticalGaps.push("required_skills_major_gap");
  }

  return {
    score: clampScore(baseScore),
    confidenceScore: dedupedRequiredSkills.length > 0 ? 100 : 55,
    strengths,
    gaps,
    warnings,
    missingData: [],
    criticalGaps,
  };
}

function compareExperience(
  candidate: CandidateProfile,
  vacancy: Vacancy,
  summary: CandidateExperienceSummary,
  minimumYears: number | null,
  requiredSkills: string[],
  perspective: MatchPerspective,
): FactorEvaluation {
  if (minimumYears === null) {
    return {
      score: 10,
      confidenceScore: 25,
      applicability: "unknown",
      strengths: [],
      gaps: [],
      warnings: [
        buildReason(
          "vacancy_experience_unclear",
          perspective === "candidate"
            ? "La vacante no aclara la experiencia requerida; este factor es menos preciso"
            : "La vacante no aclara la experiencia requerida; este factor es menos preciso",
          "warning",
          "experience",
          MATCH_WEIGHTS.experience,
          "medium",
          "Define años mínimos de experiencia para la vacante",
        ),
      ],
      missingData: ["vacancy_experience_requirement_missing"],
      criticalGaps: [],
    };
  }

  if (summary.datedEntries === 0) {
    return {
      score: 10,
      confidenceScore: summary.confidenceScore,
      applicability: "unknown",
      strengths: [],
      gaps: [
        buildReason(
          "candidate_experience_dates_missing",
          perspective === "candidate"
            ? "No hay fechas reales suficientes para validar tu experiencia"
            : "No hay fechas reales suficientes para validar la experiencia del perfil",
          "gap",
          "experience",
          MATCH_WEIGHTS.experience,
          "high",
          perspective === "candidate"
            ? "Agrega fechas reales de experiencia para mejorar precisión"
            : "Pide fechas reales de experiencia en el perfil",
        ),
      ],
      warnings: [],
      missingData: ["candidate_experience_dates_missing"],
      criticalGaps: ["experience_uncertain"],
    };
  }

  const yearsRequirementScore = getYearsRequirementScore(summary, minimumYears);
  const relevantExperienceScore = scoreRelevantExperience(candidate, vacancy, requiredSkills);
  const evidenceQualityScore = getExperienceEvidenceQualityScore(summary);
  const baseScore =
    yearsRequirementScore * 0.35 +
    relevantExperienceScore * 0.5 +
    evidenceQualityScore * 0.15;
  const strengths: MatchReason[] = [];
  const gaps: MatchReason[] = [];
  const warnings: MatchReason[] = [];
  const criticalGaps: string[] = [];

  if (yearsRequirementScore >= 80 && relevantExperienceScore >= 75) {
    strengths.push(
      buildReason(
        "experience_match",
        perspective === "candidate"
          ? `Tus ${summary.totalYears} años estimados cubren la experiencia requerida`
          : `Los ${summary.totalYears} años estimados cubren la experiencia requerida`,
        "strength",
        "experience",
        MATCH_WEIGHTS.experience,
        "high",
      ),
    );
  } else {
    gaps.push(
      buildReason(
        "experience_gap",
        perspective === "candidate"
          ? `Estás por debajo del mínimo de ${minimumYears} años`
          : `El perfil está por debajo del mínimo de ${minimumYears} años`,
        "gap",
        "experience",
        MATCH_WEIGHTS.experience,
        "high",
        perspective === "candidate"
          ? "Agrega experiencia fechada y reciente para mejorar este factor"
          : "Ajusta el mínimo de experiencia si está demasiado alto",
      ),
    );
    if (summary.totalYears + 1 < minimumYears || relevantExperienceScore <= 10) {
      criticalGaps.push("experience_gap");
    }
  }

  if (relevantExperienceScore <= 30) {
    gaps.push(
      buildReason(
        "experience_relevance_gap",
        perspective === "candidate"
          ? "Tu experiencia documentada no aporta evidencia clara para este rol"
          : "La experiencia documentada del perfil no aporta evidencia clara para este rol",
        "gap",
        "experience",
        MATCH_WEIGHTS.experience,
        "high",
        perspective === "candidate"
          ? "Describe mejor proyectos y roles alineados con la vacante"
          : "Aclara mejor el foco real del rol y la experiencia esperada",
      ),
    );
    criticalGaps.push("experience_relevance_gap");
    criticalGaps.push("experience_gap");
  }

  if (summary.uncertainEntries > 0) {
    warnings.push(
      buildReason(
        "experience_dates_partial",
        perspective === "candidate"
          ? "Hay experiencias sin fechas claras; la lectura es parcial"
          : "Hay experiencias sin fechas claras; la lectura es parcial",
        "warning",
        "experience",
        MATCH_WEIGHTS.experience,
        "medium",
        perspective === "candidate"
          ? "Completa fechas de inicio y fin en tu historial"
          : "Pide fechas completas de experiencia",
      ),
    );
  }

  return {
    score: clampScore(baseScore),
    confidenceScore: summary.confidenceScore,
    applicability: summary.uncertainEntries > 0 ? "unknown" : "confirmed",
    strengths,
    gaps,
    warnings,
    missingData: summary.uncertainEntries > 0 ? ["candidate_experience_dates_partial"] : [],
    criticalGaps,
  };
}

function compareSeniority(
  candidate: CandidateProfile,
  summary: CandidateExperienceSummary,
  targetSeniority: MatchFactorInput["seniority"],
  perspective: MatchPerspective,
): FactorEvaluation {
  const candidateSeniority = inferCandidateSeniority(candidate, summary);
  const order = ["junior", "mid", "senior", "lead"];
  const distance = Math.abs(order.indexOf(candidateSeniority) - order.indexOf(targetSeniority));
  const isUnclear = !candidate.rol?.trim() && summary.datedEntries === 0;

  if (isUnclear) {
    return {
      score: 15,
      confidenceScore: 25,
      applicability: "unknown",
      strengths: [],
      gaps: [],
      warnings: [
        buildReason(
          "seniority_unclear",
          perspective === "candidate"
            ? "No hay evidencia suficiente para inferir seniority con precisión"
            : "No hay evidencia suficiente para inferir seniority con precisión",
          "warning",
          "seniority",
          MATCH_WEIGHTS.seniority,
          "medium",
        ),
      ],
      missingData: ["candidate_seniority_unclear"],
      criticalGaps: [],
    };
  }

  if (distance === 0) {
    return {
      score: 100,
      confidenceScore: clampScore(summary.confidenceScore * 0.7 + 30),
      strengths: [
        buildReason(
          "seniority_match",
          perspective === "candidate"
            ? "Tu seniority encaja con el nivel esperado"
            : "El seniority del perfil encaja con el nivel esperado",
          "strength",
          "seniority",
          MATCH_WEIGHTS.seniority,
          "medium",
        ),
      ],
      gaps: [],
      warnings: [],
      missingData: [],
      criticalGaps: [],
    };
  }

  return {
    score:
      distance === 1
        ? 55
        : distance === 2
          ? 20
          : 0,
    confidenceScore: clampScore(summary.confidenceScore * 0.7 + 30),
    strengths: [],
    gaps: distance >= 2
      ? [
          buildReason(
            "seniority_gap",
            perspective === "candidate"
              ? "Tu seniority está lejos del nivel de la vacante"
              : "El seniority del perfil está lejos del nivel de la vacante",
            "gap",
            "seniority",
            MATCH_WEIGHTS.seniority,
            "high",
            perspective === "candidate"
              ? "Aplica a vacantes de un nivel más cercano o fortalece tu historial"
              : "Ajusta seniority o años requeridos para la vacante",
          ),
        ]
      : [],
    warnings: distance === 1
      ? [
          buildReason(
            "seniority_partial_gap",
            perspective === "candidate"
              ? "Tu seniority está cerca, pero no encaja del todo"
              : "El seniority del perfil está cerca, pero no encaja del todo",
            "warning",
            "seniority",
            MATCH_WEIGHTS.seniority,
            "medium",
          ),
        ]
      : [],
    missingData: [],
    criticalGaps: distance >= 2 ? ["seniority_gap"] : [],
  };
}

function compareLocationAndModality(
  candidate: CandidateProfile,
  modality: MatchFactorInput["modality"],
  location: string | undefined,
  perspective: MatchPerspective,
): { location: FactorEvaluation; modality: FactorEvaluation } {
  const candidateLocation = normalizeString(candidate.ubicacion ?? "");
  const targetLocation = normalizeString(location ?? "");
  const candidateModality = detectModality(candidate.modalidadTrabajo);

  const locationEvaluation: FactorEvaluation =
    modality === "remote" || modality === "flexible"
      ? {
          score: 90,
          confidenceScore: 90,
          isNeutral: false,
          applicability: "confirmed",
          strengths: [],
          gaps: [],
          warnings: [],
          missingData: [],
          criticalGaps: [],
        }
      : !targetLocation
        ? {
            score: 25,
            confidenceScore: 25,
            applicability: "unknown",
            strengths: [],
            gaps: [],
            warnings: [
              buildReason(
                "vacancy_location_missing",
                perspective === "candidate"
                  ? "La vacante no aclara ubicación; este factor es menos preciso"
                  : "La vacante no aclara ubicación; este factor es menos preciso",
                "warning",
                "location",
                MATCH_WEIGHTS.location,
                "medium",
              ),
            ],
            missingData: ["vacancy_location_missing"],
            criticalGaps: [],
          }
        : candidateLocation && (candidateLocation.includes(targetLocation) || targetLocation.includes(candidateLocation))
          ? {
              score: 80,
              confidenceScore: 100,
              applicability: "confirmed",
              strengths: [
                buildReason(
                  "location_match",
                  perspective === "candidate"
                    ? "La ubicación es compatible con la vacante"
                    : "La ubicación es compatible con la vacante",
                  "strength",
                  "location",
                  MATCH_WEIGHTS.location,
                  "medium",
                ),
              ],
              gaps: [],
              warnings: [],
              missingData: [],
              criticalGaps: [],
            }
          : modality === "hybrid"
            ? {
                score: 70,
                confidenceScore: 90,
                applicability: "confirmed",
                strengths: [],
                gaps: [],
                warnings: [
                  buildReason(
                    "location_hybrid_warning",
                    perspective === "candidate"
                      ? "La ubicación no encaja bien para una vacante híbrida"
                      : "La ubicación no encaja bien para una vacante híbrida",
                    "warning",
                    "location",
                    MATCH_WEIGHTS.location,
                    "medium",
                    perspective === "candidate"
                      ? "Confirma si puedes asistir presencialmente"
                      : "Aclara el radio geográfico de la vacante híbrida",
                  ),
                ],
                missingData: [],
                criticalGaps: [],
              }
            : {
                score: 0,
                confidenceScore: 95,
                applicability: "confirmed",
                strengths: [],
                gaps: [
                  buildReason(
                    "location_onsite_gap",
                    perspective === "candidate"
                      ? "La ubicación no es compatible con una vacante presencial"
                      : "La ubicación no es compatible con una vacante presencial",
                    "gap",
                    "location",
                    MATCH_WEIGHTS.location,
                    "high",
                    perspective === "candidate"
                      ? "Actualiza tu disponibilidad o prioriza vacantes remotas"
                      : "Aclara si aceptas talento remoto o reubicación",
                  ),
                ],
                warnings: [],
                missingData: [],
                criticalGaps: ["location_gap"],
              };

  const modalityEvaluation: FactorEvaluation =
    modality === "unknown"
      ? {
          score: 25,
          confidenceScore: 25,
          applicability: "unknown",
          strengths: [],
          gaps: [],
          warnings: [
            buildReason(
              "vacancy_modality_missing",
              perspective === "candidate"
                ? "La vacante no aclara modalidad; este factor es menos preciso"
                : "La vacante no aclara modalidad; este factor es menos preciso",
              "warning",
              "modality",
              MATCH_WEIGHTS.modality,
              "medium",
              "Estructura mejor la modalidad de trabajo",
            ),
          ],
          missingData: ["vacancy_modality_missing"],
          criticalGaps: [],
        }
      : modality === "remote"
        ? {
            score: candidateModality === "onsite" ? 60 : 100,
            confidenceScore: 95,
            applicability: "confirmed",
            strengths: [
              buildReason(
                "modality_remote_match",
                perspective === "candidate"
                  ? "La modalidad remota es compatible con tu preferencia"
                  : "La modalidad remota es compatible con la preferencia del perfil",
                "strength",
                "modality",
                MATCH_WEIGHTS.modality,
                "medium",
              ),
            ],
            gaps: [],
            warnings: candidateModality === "onsite"
              ? [
                  buildReason(
                    "modality_remote_preference_warning",
                    perspective === "candidate"
                      ? "Tu perfil se ve más orientado a presencial que a remoto"
                      : "El perfil se ve más orientado a presencial que a remoto",
                    "warning",
                    "modality",
                    MATCH_WEIGHTS.modality,
                    "low",
                  ),
                ]
              : [],
            missingData: [],
            criticalGaps: [],
          }
        : candidateModality === modality
          ? {
              score: 100,
              confidenceScore: 100,
              applicability: "confirmed",
              strengths: [
                buildReason(
                  "modality_match",
                  perspective === "candidate"
                    ? "La modalidad coincide con tu preferencia"
                    : "La modalidad coincide con la preferencia del perfil",
                  "strength",
                  "modality",
                  MATCH_WEIGHTS.modality,
                  "high",
                ),
              ],
              gaps: [],
              warnings: [],
              missingData: [],
              criticalGaps: [],
            }
          : modality === "hybrid" && candidateModality === "remote"
            ? {
                score: 60,
                confidenceScore: 95,
                applicability: "confirmed",
                strengths: [],
                gaps: [],
                warnings: [
                  buildReason(
                    "modality_partial_gap",
                    perspective === "candidate"
                      ? "Tu preferencia remota encaja solo parcialmente con una vacante híbrida"
                      : "La preferencia remota encaja solo parcialmente con una vacante híbrida",
                    "warning",
                    "modality",
                    MATCH_WEIGHTS.modality,
                    "medium",
                    perspective === "candidate"
                      ? "Aclara tu disponibilidad para esquema híbrido"
                      : "Aclara los días presenciales requeridos",
                  ),
                ],
                missingData: [],
                criticalGaps: ["modality_partial_gap"],
              }
            : {
                score: 10,
                confidenceScore: 100,
                applicability: "confirmed",
                strengths: [],
                gaps: [
                  buildReason(
                    "modality_gap",
                    perspective === "candidate"
                      ? "La modalidad no encaja con tu preferencia actual"
                      : "La modalidad no encaja con la preferencia actual del perfil",
                    "gap",
                    "modality",
                    MATCH_WEIGHTS.modality,
                    "high",
                    perspective === "candidate"
                      ? "Actualiza tu modalidad preferida o prioriza vacantes compatibles"
                      : "Aclara si aceptas otra modalidad",
                  ),
                ],
                warnings: [],
                missingData: [],
                criticalGaps: ["modality_gap"],
              };

  return {
    location: locationEvaluation,
    modality: modalityEvaluation,
  };
}

function compareSalary(
  candidateSalary: NormalizedSalaryRange | null,
  vacancySalary: NormalizedSalaryRange | null,
  perspective: MatchPerspective,
): FactorEvaluation {
  const missingData: string[] = [];

  if (!vacancySalary || vacancySalary.confidenceScore < 60) {
    return {
      score: 20,
      confidenceScore: vacancySalary?.confidenceScore ?? 15,
      applicability: "unknown",
      strengths: [],
      gaps: [],
      warnings: [
        buildReason(
          "vacancy_salary_unclear",
          perspective === "candidate"
            ? "El salario de la vacante no está lo bastante estructurado para compararlo bien"
            : "El salario de la vacante no está lo bastante estructurado para compararlo bien",
          "warning",
          "salary",
          MATCH_WEIGHTS.salary,
          "medium",
          "Publica un rango salarial estructurado",
        ),
      ],
      missingData: ["vacancy_salary_unstructured"],
      criticalGaps: [],
    };
  }

  if (!candidateSalary || candidateSalary.confidenceScore < 60) {
    return {
      score: 20,
      confidenceScore: candidateSalary?.confidenceScore ?? 20,
      applicability: "unknown",
      strengths: [],
      gaps: [],
      warnings: [
        buildReason(
          "candidate_salary_unclear",
          perspective === "candidate"
            ? "Tu expectativa salarial no está estructurada con suficiente claridad"
            : "La expectativa salarial del perfil no está estructurada con suficiente claridad",
          "warning",
          "salary",
          MATCH_WEIGHTS.salary,
          "medium",
          perspective === "candidate"
            ? "Completa un rango salarial claro"
            : "Solicita un rango salarial más claro al candidato",
        ),
      ],
      missingData: ["candidate_salary_unstructured"],
      criticalGaps: [],
    };
  }

  if ((candidateSalary.min ?? 0) > (vacancySalary.max ?? 0)) {
    const overageRatio = ((candidateSalary.min ?? 0) - (vacancySalary.max ?? 0)) / Math.max(vacancySalary.max ?? 1, 1);
    const score =
      overageRatio <= 0.08
        ? 55
        : overageRatio <= 0.2
          ? 35
          : 15;

    return {
      score,
      confidenceScore: clampScore((candidateSalary.confidenceScore + vacancySalary.confidenceScore) / 2),
      applicability: "confirmed",
      strengths: [],
      gaps: [
        buildReason(
          "salary_above_range",
          perspective === "candidate"
            ? "Tu expectativa salarial está por encima del máximo de la vacante"
            : "La expectativa salarial del perfil está por encima del máximo de la vacante",
          "gap",
          "salary",
          MATCH_WEIGHTS.salary,
          "high",
          perspective === "candidate"
            ? "Aplica a vacantes con un rango salarial más alto"
            : "Amplía el rango salarial o ajusta el nivel esperado",
        ),
      ],
      warnings: [],
      missingData,
      criticalGaps: overageRatio > 0.2 ? ["salary_gap"] : [],
    };
  }

  if ((candidateSalary.max ?? 0) < (vacancySalary.min ?? 0)) {
    return {
      score: 75,
      confidenceScore: clampScore((candidateSalary.confidenceScore + vacancySalary.confidenceScore) / 2),
      applicability: "confirmed",
      strengths: [
        buildReason(
          "salary_below_range",
          perspective === "candidate"
            ? "La vacante está por encima de tu expectativa salarial"
            : "La vacante está por encima de la expectativa salarial del perfil",
          "strength",
          "salary",
          MATCH_WEIGHTS.salary,
          "medium",
        ),
      ],
      gaps: [],
      warnings: [],
      missingData,
      criticalGaps: [],
    };
  }

  const overlapMin = Math.max(candidateSalary.min ?? 0, vacancySalary.min ?? 0);
  const overlapMax = Math.min(candidateSalary.max ?? 0, vacancySalary.max ?? 0);
  const overlap = Math.max(0, overlapMax - overlapMin);
  const vacancySpan = Math.max(1, (vacancySalary.max ?? overlapMax) - (vacancySalary.min ?? overlapMin));
  const overlapRatio = overlap / vacancySpan;

  return {
    score: clampScore(85 + overlapRatio * 15),
    confidenceScore: clampScore((candidateSalary.confidenceScore + vacancySalary.confidenceScore) / 2),
    applicability: "confirmed",
    strengths: [
      buildReason(
        "salary_overlap",
        perspective === "candidate"
          ? "Tu expectativa salarial encaja con el rango de la vacante"
          : "La expectativa salarial del perfil encaja con el rango de la vacante",
        "strength",
        "salary",
        MATCH_WEIGHTS.salary,
        "high",
      ),
    ],
    gaps: [],
    warnings: [],
    missingData,
    criticalGaps: [],
  };
}

function compareLanguages(
  candidateLanguages: NormalizedLanguage[],
  requirements: MatchFactorInput["requiredLanguages"],
  perspective: MatchPerspective,
): FactorEvaluation {
  if (requirements.length === 0) {
    return {
      score: 0,
      confidenceScore: 60,
      isNeutral: true,
      applicability: "neutral",
      strengths: [],
      gaps: [],
      warnings: [],
      missingData: [],
      criticalGaps: [],
    };
  }

  let matched = 0;
  const gaps: MatchReason[] = [];

  for (const requirement of requirements) {
    const candidateLanguage = candidateLanguages.find(
      (item) => item.name === canonicalizeLanguageName(requirement.name),
    );

    if (!candidateLanguage) {
      gaps.push(
        buildReason(
          `missing_language_${requirement.name}`,
          perspective === "candidate"
            ? `Falta ${requirement.name} con el nivel requerido`
            : `Falta ${requirement.name} con el nivel requerido`,
          "gap",
          "languages",
          MATCH_WEIGHTS.languages,
          "high",
          perspective === "candidate"
            ? `Incluye nivel de ${requirement.name} si aplicas a este tipo de vacantes`
            : "Ajusta el idioma requerido si es opcional",
        ),
      );
      continue;
    }

    const minimumRank = getLanguageRank(requirement.levelSystem ?? candidateLanguage.levelSystem, requirement.minLevel ?? candidateLanguage.level);
    if (candidateLanguage.proficiencyRank >= minimumRank) {
      matched += 1;
      continue;
    }

    gaps.push(
      buildReason(
        `language_level_gap_${requirement.name}`,
        perspective === "candidate"
          ? `${requirement.name} está por debajo del nivel mínimo ${requirement.minLevel ?? ""}`.trim()
          : `${requirement.name} está por debajo del nivel mínimo ${requirement.minLevel ?? ""}`.trim(),
        "gap",
        "languages",
        MATCH_WEIGHTS.languages,
        "high",
        perspective === "candidate"
          ? `Actualiza el nivel real de ${requirement.name} en tu perfil`
          : "Aclara el nivel mínimo del idioma en la vacante",
      ),
    );
  }

  const ratio = matched / requirements.length;
  const strengths =
    matched === requirements.length
      ? [
          buildReason(
            "languages_match",
            perspective === "candidate"
              ? "Cumples los idiomas requeridos"
              : "Cumple los idiomas requeridos",
            "strength",
            "languages",
            MATCH_WEIGHTS.languages,
            "medium",
          ),
        ]
      : [];

  return {
    score: clampScore(ratio * 100),
    confidenceScore: candidateLanguages.length > 0 ? 90 : 30,
    applicability: candidateLanguages.length === 0 ? "unknown" : "confirmed",
    strengths,
    gaps,
    warnings: [],
    missingData: candidateLanguages.length === 0 ? ["candidate_languages_missing"] : [],
    criticalGaps: gaps.length > 0 ? ["language_gap"] : [],
  };
}

function compareEducation(
  candidate: CandidateProfile,
  requiredEducation: string[],
  perspective: MatchPerspective,
): FactorEvaluation {
  if (requiredEducation.length === 0) {
    return {
      score: 0,
      confidenceScore: 60,
      isNeutral: true,
      applicability: "neutral",
      strengths: [],
      gaps: [],
      warnings: [],
      missingData: [],
      criticalGaps: [],
    };
  }

  if ((candidate.education ?? []).length > 0) {
    const evidenceScore = getRequirementEvidenceScore(requiredEducation, candidate.education ?? []);

    return {
      score: evidenceScore,
      confidenceScore: 85,
      applicability: "confirmed",
      strengths: [
        buildReason(
          "education_match",
          perspective === "candidate"
            ? "Tu educación declarada cubre el requisito"
            : "La educación declarada cubre el requisito",
          "strength",
          "education",
          MATCH_WEIGHTS.education,
          "low",
        ),
      ],
      gaps: [],
      warnings: [],
      missingData: [],
      criticalGaps: [],
    };
  }

  return {
    score: 0,
    confidenceScore: 30,
    applicability: "unknown",
    strengths: [],
    gaps: [
      buildReason(
        "education_requirement_missing",
        perspective === "candidate"
          ? "La vacante exige formación y tu perfil no la declara"
          : "La vacante exige formación y el perfil no la declara",
        "gap",
        "education",
        MATCH_WEIGHTS.education,
        "medium",
        perspective === "candidate"
          ? "Agrega estudios o títulos relevantes en tu perfil"
          : "Aclara si el requisito educativo es obligatorio",
      ),
    ],
    warnings: [],
    missingData: ["candidate_education_missing"],
    criticalGaps: ["education_gap"],
  };
}

function compareCertifications(
  candidate: CandidateProfile,
  requiredCertifications: string[],
  perspective: MatchPerspective,
): FactorEvaluation {
  if (requiredCertifications.length === 0) {
    return {
      score: 0,
      confidenceScore: 60,
      isNeutral: true,
      applicability: "neutral",
      strengths: [],
      gaps: [],
      warnings: [],
      missingData: [],
      criticalGaps: [],
    };
  }

  if ((candidate.certifications ?? []).length > 0) {
    const evidenceScore = getRequirementEvidenceScore(requiredCertifications, candidate.certifications ?? []);

    return {
      score: evidenceScore,
      confidenceScore: 85,
      applicability: "confirmed",
      strengths: [
        buildReason(
          "certification_match",
          perspective === "candidate"
            ? "Declaras certificaciones relevantes para el rol"
            : "Declara certificaciones relevantes para el rol",
          "strength",
          "certifications",
          MATCH_WEIGHTS.certifications,
          "low",
        ),
      ],
      gaps: [],
      warnings: [],
      missingData: [],
      criticalGaps: [],
    };
  }

  return {
    score: 0,
    confidenceScore: 30,
    applicability: "unknown",
    strengths: [],
    gaps: [
      buildReason(
        "certification_requirement_missing",
        perspective === "candidate"
          ? "La vacante exige certificación y tu perfil no la declara"
          : "La vacante exige certificación y el perfil no la declara",
        "gap",
        "certifications",
        MATCH_WEIGHTS.certifications,
        "medium",
        perspective === "candidate"
          ? "Agrega certificaciones concretas a tu perfil"
          : "Aclara si la certificación es obligatoria",
      ),
    ],
    warnings: [],
    missingData: ["candidate_certifications_missing"],
    criticalGaps: ["certification_gap"],
  };
}

function compareActivity(metadata: MatchRankingMetadata = {}, perspective: MatchPerspective): FactorEvaluation {
  const candidateRecentlyActive = metadata.isRecentlyActive ?? false;
  const jobPostedRecently = metadata.isPublishedRecently ?? false;
  const signalCount = Number(candidateRecentlyActive) + Number(jobPostedRecently);
  const score = signalCount === 2 ? 60 : signalCount === 1 ? 35 : 0;
  const strengths: MatchReason[] = [];

  if (candidateRecentlyActive) {
    strengths.push(
      buildReason(
        "candidate_recent_activity",
        perspective === "candidate"
          ? "Tu perfil muestra actividad reciente"
          : "El perfil muestra actividad reciente",
        "strength",
        "activity",
        MATCH_WEIGHTS.activity,
        "low",
      ),
    );
  }

  if (jobPostedRecently) {
    strengths.push(
      buildReason(
        "job_recent_activity",
        perspective === "candidate"
          ? "La vacante fue publicada recientemente"
          : "La vacante fue publicada recientemente",
        "strength",
        "activity",
        MATCH_WEIGHTS.activity,
        "low",
      ),
    );
  }

  return {
    score,
    confidenceScore: 100,
    applicability: "confirmed",
    strengths,
    gaps: [],
    warnings: [],
    missingData: [],
    criticalGaps: [],
  };
}

function buildSummary(result: {
  perspective: MatchPerspective;
  level: MatchLevel;
  strengths: MatchReason[];
  gaps: MatchReason[];
  warnings: MatchReason[];
  confidenceScore: number;
}) {
  const primaryGap = result.gaps[0];

  if (result.confidenceScore < 45) {
    return result.perspective === "candidate"
      ? "El encaje visible es orientativo porque faltan datos clave para medirlo con precisión."
      : "El encaje visible es orientativo porque faltan datos clave para medirlo con precisión.";
  }

  if (primaryGap?.category === "skills") {
    return result.perspective === "candidate"
      ? "La compatibilidad técnica cae por habilidades obligatorias que aún no están cubiertas."
      : "La compatibilidad técnica cae por habilidades obligatorias que aún no están cubiertas.";
  }

  if (primaryGap?.category === "salary") {
    return result.perspective === "candidate"
      ? "El encaje general baja porque el rango salarial no coincide."
      : "El encaje general baja porque el rango salarial no coincide.";
  }

  if (result.level === "high") {
    return result.perspective === "candidate"
      ? "Buen encaje general con señales sólidas en habilidades, experiencia y condiciones."
      : "Buen encaje general con señales sólidas en habilidades, experiencia y condiciones.";
  }

  if (result.level === "medium") {
    return result.perspective === "candidate"
      ? "Hay compatibilidad real, pero todavía quedan brechas relevantes por corregir."
      : "Hay compatibilidad real, pero todavía quedan brechas relevantes por corregir.";
  }

  return result.perspective === "candidate"
    ? "El encaje actual es bajo por brechas críticas o por datos insuficientes."
    : "El encaje actual es bajo por brechas críticas o por datos insuficientes.";
}

function buildSuggestedAction(context: EvaluationContext, result: {
  gaps: MatchReason[];
  warnings: MatchReason[];
  confidenceScore: number;
}) {
  const primary = result.gaps[0] ?? result.warnings[0];
  if (primary?.actionLabel) {
    return primary.actionLabel;
  }

  if (result.confidenceScore < 45 && context.experience.confidenceScore < 60) {
    return context.perspective === "candidate"
      ? "Agrega fechas reales de experiencia para mejorar precisión"
      : "Pide fechas reales de experiencia para mejorar precisión";
  }

  if ((context.factors.requiredLanguages[0]?.name ?? "") === "Inglés") {
    return context.perspective === "candidate"
      ? "Incluye nivel de inglés si aplicas a vacantes internacionales"
      : "Aclara el nivel mínimo de inglés en la vacante";
  }

  if (context.factors.requiredSkills.length <= 1) {
    return "Estructura mejor las skills requeridas de la vacante";
  }

  return context.perspective === "candidate"
    ? "Corrige la brecha principal de tu perfil antes de aplicar"
    : "Corrige la brecha principal de la vacante o del pipeline";
}

function applyGlobalPenalties(
  baseVisibleScore: number,
  criticalGaps: string[],
  confidenceScore: number,
  hardEvidenceScore: number,
  visibilityPenaltyPct = 0,
) {
  let score = baseVisibleScore;
  let cap = 100;
  const hardCriticalGapCount = criticalGaps.filter((gap) => HARD_CRITICAL_GAPS.has(gap)).length;
  const hasOneCriticalSkillGap =
    criticalGaps.includes("required_skills_gap") && !criticalGaps.includes("required_skills_major_gap");

  if (hasOneCriticalSkillGap) {
    cap = Math.min(cap, 74);
  }

  if (criticalGaps.includes("required_skills_major_gap")) {
    cap = Math.min(cap, 59);
  }

  if (criticalGaps.includes("seniority_gap")) {
    cap = Math.min(cap, 64);
  }

  if (criticalGaps.includes("experience_relevance_gap")) {
    cap = Math.min(cap, 54);
  }

  if (hardCriticalGapCount === 1 && !hasOneCriticalSkillGap) {
    score = Math.min(score - 12, 62);
  }

  if (hardCriticalGapCount >= 2) {
    score = Math.min(score - 24, 40);
  } else if (criticalGaps.length === 1) {
    score = Math.min(score - 6, 70);
  }

  if (hardEvidenceScore < 40) {
    score = Math.min(score, 45);
  } else if (hardEvidenceScore < 55) {
    score = Math.min(score, 58);
  }

  if (confidenceScore < 40) {
    cap = Math.min(cap, 54);
  } else if (confidenceScore < 60) {
    cap = Math.min(cap, 68);
  } else if (confidenceScore < 75) {
    cap = Math.min(cap, 69);
  }

  if (visibilityPenaltyPct > 0) {
    score = score * (1 - Math.min(100, visibilityPenaltyPct) / 100);
    cap = Math.min(cap, Math.round(100 - visibilityPenaltyPct));
  }

  return clampScore(Math.min(score, cap));
}

export function getMatchConfidenceLabel(confidenceScore: number) {
  if (confidenceScore >= 75) {
    return "high";
  }
  if (confidenceScore >= 50) {
    return "medium";
  }
  return "low";
}

export function getMatchReasonCardLabel(reason: Pick<MatchReason, "label">) {
  return reason.label;
}

export function getRankingExplanation() {
  return "El orden también considera recencia, plan y actividad, pero el porcentaje visible sigue siendo encaje puro.";
}

export function getRankScore(
  result: Pick<MatchResult, "visibleScore">,
  metadata: MatchRankingMetadata = {},
  options?: {
    candidate?: CandidateProfile | null;
    surface?: CandidateRankingSurface;
  },
) {
  const candidate = options?.candidate;
  const surface = options?.surface ?? "candidate_feed";

  if (candidate?.role === "candidate") {
    return calculateCandidateRankScore(
      result.visibleScore,
      getCandidatePlanFeatures(candidate),
      metadata,
      surface,
    );
  }

  let rankScore = result.visibleScore;

  if (metadata.isPaused || metadata.isClosed) {
    rankScore -= 40;
  }
  if (metadata.isPublishedRecently) {
    rankScore += 4;
  }
  if (metadata.isRecentlyActive) {
    rankScore += 3;
  }
  if (metadata.isEntityActive === false) {
    rankScore -= 6;
  }
  if (typeof metadata.profileCompleteness === "number") {
    rankScore += Math.round((metadata.profileCompleteness - 0.7) * 10);
  }

  return clampScore(rankScore);
}

function buildRankingContext(
  candidate: CandidateProfile,
  options: MatchEvaluationOptions | undefined,
  vacancy: Vacancy,
): MatchRankingContext {
  const metadata = options?.ranking?.metadata ?? {
    isPublishedRecently: (vacancy.diasDesdePublicacion ?? 999) <= 14,
    isRecentlyActive: Boolean(candidate.bio || candidate.cv),
    isEntityActive: candidate.profileVisibility !== "private",
    profileCompleteness:
      [candidate.cv, candidate.bio, candidate.idiomas?.length, candidate.expectativaSalarial, candidate.modalidadTrabajo]
        .filter(Boolean)
        .length / 5,
    visibilityPenaltyPct: candidate.profileQuality?.moderationVisibilityPenaltyPct ?? 0,
  };

  return {
    baseVisibleScore: 0,
    metadata,
    candidate: options?.ranking?.candidate ?? candidate,
    surface: options?.ranking?.surface ?? "candidate_feed",
  };
}

export function evaluateMatch({
  candidate,
  vacancy,
  perspective,
  calibration,
  ranking,
}: MatchEvaluationInput): MatchResult {
  const vacancyExtraction = extractVacancyRequirements(vacancy);
  const experience = normalizeExperienceSummary(candidate.experiencia);
  const candidateSalary = normalizeCandidateSalary(candidate);
  const candidateLanguages = normalizeCandidateLanguages(candidate.idiomas);
  const candidateProfileQuality = clampScore(
    Math.min(candidate.skills.length, 6) / 6 * 20 +
      experience.confidenceScore * 0.45 +
      (candidateSalary?.confidenceScore ?? 20) * 0.15 +
      (candidateLanguages.length > 0 ? 100 : 35) * 0.2,
  );
  const qualitySignals: MatchQualitySignals = {
    ...vacancyExtraction.qualitySignals,
    candidateProfileQuality,
  };
  const baseWeights = applyMatchCalibration(MATCH_WEIGHTS, calibration);
  const context: EvaluationContext = {
    perspective,
    candidate,
    vacancy,
    factors: vacancyExtraction.factors,
    experience,
    candidateSalary,
    candidateLanguages,
  };
  const rankingContext = buildRankingContext(candidate, { ranking }, vacancy);

  const skills = compareSkills(candidate.skills, vacancyExtraction.factors.requiredSkills, vacancyExtraction.factors.optionalSkills, perspective);
  const experienceFactor = compareExperience(
    candidate,
    vacancy,
    experience,
    vacancyExtraction.factors.minimumExperienceYears,
    vacancyExtraction.factors.requiredSkills,
    perspective,
  );
  const seniority = compareSeniority(candidate, experience, vacancyExtraction.factors.seniority, perspective);
  const locationAndModality = compareLocationAndModality(candidate, vacancyExtraction.factors.modality, vacancyExtraction.factors.location, perspective);
  const salary = compareSalary(candidateSalary, vacancyExtraction.factors.salary, perspective);
  const languages = compareLanguages(candidateLanguages, vacancyExtraction.factors.requiredLanguages, perspective);
  const education = compareEducation(candidate, vacancyExtraction.factors.requiredEducation, perspective);
  const certifications = compareCertifications(candidate, vacancyExtraction.factors.requiredCertifications, perspective);
  const activity = compareActivity(ranking?.metadata ?? rankingContext.metadata, perspective);

  const breakdown: MatchBreakdown = {
    skills: skills.score,
    experience: experienceFactor.score,
    seniority: seniority.score,
    location: locationAndModality.location.score,
    modality: locationAndModality.modality.score,
    salary: salary.score,
    education: education.score,
    languages: languages.score,
    certifications: certifications.score,
    activity: activity.score,
  };
  const evaluations: Record<keyof MatchBreakdown, FactorEvaluation> = {
    skills,
    experience: experienceFactor,
    seniority,
    location: locationAndModality.location,
    modality: locationAndModality.modality,
    salary,
    education,
    languages,
    certifications,
    activity,
  };
  const weights = buildDynamicWeights({
    weights: baseWeights,
    factors: vacancyExtraction.factors,
    qualitySignals,
    evaluations,
  });
  const neutralFactors = new Set<keyof MatchBreakdown>(
    [
      ["skills", getFactorApplicability(skills) === "neutral"],
      ["experience", getFactorApplicability(experienceFactor) === "neutral"],
      ["seniority", getFactorApplicability(seniority) === "neutral"],
      ["location", getFactorApplicability(locationAndModality.location) === "neutral"],
      ["modality", getFactorApplicability(locationAndModality.modality) === "neutral"],
      ["salary", getFactorApplicability(salary) === "neutral"],
      ["education", getFactorApplicability(education) === "neutral"],
      ["languages", getFactorApplicability(languages) === "neutral"],
      ["certifications", getFactorApplicability(certifications) === "neutral"],
      ["activity", getFactorApplicability(activity) === "neutral"],
    ]
      .filter(([, isNeutral]) => Boolean(isNeutral))
      .map(([key]) => key as keyof MatchBreakdown),
  );
  const unknownFactors = new Set<keyof MatchBreakdown>(
    (Object.entries(evaluations) as Array<[keyof MatchBreakdown, FactorEvaluation]>)
      .filter(([, evaluation]) => getFactorApplicability(evaluation) === "unknown")
      .map(([key]) => key),
  );
  const softContributionMultiplier = getSoftContributionMultiplier({
    breakdown,
    weights,
    neutralFactors,
    criticalGaps: [
      ...skills.criticalGaps,
      ...experienceFactor.criticalGaps,
      ...seniority.criticalGaps,
      ...locationAndModality.location.criticalGaps,
      ...locationAndModality.modality.criticalGaps,
      ...salary.criticalGaps,
      ...languages.criticalGaps,
      ...education.criticalGaps,
      ...certifications.criticalGaps,
    ],
  });

  const baseVisibleScore = (() => {
    let weightedSum = 0;
    let totalWeight = 0;

    (Object.keys(breakdown) as Array<keyof MatchBreakdown>).forEach((key) => {
      if (neutralFactors.has(key)) {
        return;
      }

      const baseWeight = weights[key];
      let effectiveWeight = SOFT_FACTOR_KEYS.includes(key as (typeof SOFT_FACTOR_KEYS)[number])
        ? baseWeight * softContributionMultiplier
        : baseWeight;

      if (unknownFactors.has(key)) {
        effectiveWeight *= getUnknownFactorWeightMultiplier(evaluations[key].confidenceScore);
      }

      if (effectiveWeight <= 0) {
        return;
      }

      weightedSum += breakdown[key] * effectiveWeight;
      totalWeight += effectiveWeight;
    });

    return totalWeight > 0 ? clampScore(weightedSum / totalWeight) : 0;
  })();

  const missingData = [
    ...vacancyExtraction.missingData,
    ...skills.missingData,
    ...experienceFactor.missingData,
    ...locationAndModality.location.missingData,
    ...locationAndModality.modality.missingData,
    ...salary.missingData,
    ...languages.missingData,
    ...education.missingData,
    ...certifications.missingData,
  ];

  const criticalGaps = [
    ...skills.criticalGaps,
    ...experienceFactor.criticalGaps,
    ...seniority.criticalGaps,
    ...locationAndModality.location.criticalGaps,
    ...locationAndModality.modality.criticalGaps,
    ...salary.criticalGaps,
    ...languages.criticalGaps,
    ...education.criticalGaps,
    ...certifications.criticalGaps,
  ];
  const hardEvidenceWeight = HARD_FACTOR_KEYS
    .filter((key) => !neutralFactors.has(key))
    .reduce((sum, key) => sum + weights[key], 0);
  const hardEvidenceScore =
    hardEvidenceWeight > 0
      ? HARD_FACTOR_KEYS
          .filter((key) => !neutralFactors.has(key))
          .reduce((sum, key) => sum + breakdown[key] * weights[key], 0) / hardEvidenceWeight
      : 0;

  const baseConfidenceScore =
    qualitySignals.vacancyQuality * 0.4 +
      candidateProfileQuality * 0.3 +
      salary.confidenceScore * 0.1 +
      experienceFactor.confidenceScore * 0.2;
  const unknownFactorPenalty = Math.min(
    24,
    (Object.values(evaluations) as FactorEvaluation[])
      .filter((evaluation) => getFactorApplicability(evaluation) === "unknown")
      .reduce((sum, evaluation) => sum + Math.max(2, Math.round((100 - evaluation.confidenceScore) / 18)), 0),
  );
  const confidenceScore = clampScore(
    baseConfidenceScore -
      Math.min(18, experience.uncertainEntries * 6) -
      unknownFactorPenalty,
  );

  const visibleScore = applyGlobalPenalties(
    baseVisibleScore,
    criticalGaps,
    confidenceScore,
    hardEvidenceScore,
    rankingContext.metadata.visibilityPenaltyPct ?? 0,
  );
  const level = toLevel(visibleScore);

  const strengths = prioritizeReasons([
    ...skills.strengths,
    ...experienceFactor.strengths,
    ...seniority.strengths,
    ...locationAndModality.location.strengths,
    ...locationAndModality.modality.strengths,
    ...salary.strengths,
    ...languages.strengths,
    ...education.strengths,
    ...certifications.strengths,
    ...activity.strengths,
  ]).slice(0, 3);

  const gaps = prioritizeReasons([
    ...skills.gaps,
    ...experienceFactor.gaps,
    ...seniority.gaps,
    ...locationAndModality.location.gaps,
    ...locationAndModality.modality.gaps,
    ...salary.gaps,
    ...languages.gaps,
    ...education.gaps,
    ...certifications.gaps,
  ]).slice(0, 3);

  const vacancyQualityWarning =
    qualitySignals.vacancyQuality < 60
      ? buildReason(
          "vacancy_quality_low",
          "La vacante tiene información incompleta; el match puede ser menos preciso",
          "warning",
          "skills",
          MATCH_WEIGHTS.skills,
          "high",
          "Estructura mejor las skills, salario, modalidad y experiencia requerida",
        )
      : null;

  const prioritizedWarnings = prioritizeReasons([
    ...skills.warnings,
    ...experienceFactor.warnings,
    ...seniority.warnings,
    ...locationAndModality.location.warnings,
    ...locationAndModality.modality.warnings,
    ...salary.warnings,
    ...languages.warnings,
    ...education.warnings,
    ...certifications.warnings,
    ...activity.warnings,
  ]);

  const warnings = [
    ...(vacancyQualityWarning ? [vacancyQualityWarning] : []),
    ...prioritizedWarnings.filter((warning) => warning.key !== "vacancy_quality_low"),
  ].slice(0, 3);

  const partialResult: MatchResult = {
    visibleScore,
    rankingScore: visibleScore,
    confidenceScore,
    level,
    breakdown,
    strengths,
    gaps,
    warnings,
    summary: "",
    suggestedAction: undefined,
    debug: {
      missingData: [...new Set(missingData)],
      criticalGaps: [...new Set(criticalGaps)],
      qualitySignals,
    },
  };

  partialResult.summary = buildSummary({
    perspective,
    level,
    strengths,
    gaps,
    warnings,
    confidenceScore,
  });
  partialResult.suggestedAction = buildSuggestedAction(context, {
    gaps,
    warnings,
    confidenceScore,
  });
  partialResult.rankingScore = getRankScore(partialResult, rankingContext.metadata, {
    candidate: ranking?.candidate ?? candidate,
    surface: ranking?.surface ?? "candidate_feed",
  });

  return partialResult;
}

export function getCandidateJobMatch(
  candidateProfile: CandidateProfile,
  jobPosting: Vacancy,
  options?: MatchEvaluationOptions,
) {
  return evaluateMatch({
    candidate: candidateProfile,
    vacancy: jobPosting,
    perspective: options?.perspective ?? "candidate",
    calibration: options?.calibration,
    ranking: options?.ranking,
  });
}

export function getCompanyCandidateMatch(
  jobPosting: Vacancy,
  candidateProfile: CandidateProfile,
  options?: MatchEvaluationOptions,
) {
  return evaluateMatch({
    candidate: candidateProfile,
    vacancy: jobPosting,
    perspective: options?.perspective ?? "company",
    calibration: options?.calibration,
    ranking: options?.ranking,
  });
}

export function getCanonicalMatchWeights() {
  return MATCH_WEIGHTS;
}

export function getCanonicalSkillAliases() {
  return SKILL_ALIASES;
}
