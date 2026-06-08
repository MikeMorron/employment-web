"use client";

import type { MatchResult } from "@/types/matching";

const FACTOR_LABELS = {
  skills: { es: "Skills", en: "Skills" },
  experience: { es: "Experiencia", en: "Experience" },
  salary: { es: "Salario", en: "Salary" },
  modality: { es: "Modalidad", en: "Work mode" },
  location: { es: "Ubicación", en: "Location" },
  languages: { es: "Idiomas", en: "Languages" },
} as const;

function getFactorValue(result: MatchResult, key: keyof typeof FACTOR_LABELS) {
  return result.breakdown[key];
}

function isNotAvailable(result: MatchResult, key: keyof typeof FACTOR_LABELS) {
  if (key === "salary") {
    return !result.debug.qualitySignals.hasStructuredSalary;
  }

  return false;
}

export function MatchBreakdown({
  result,
  isDark,
  isEnglish = false,
  compact = false,
}: {
  result: MatchResult;
  isDark: boolean;
  isEnglish?: boolean;
  compact?: boolean;
}) {
  const visibleFactors = (compact
    ? ["skills", "experience", "salary", "modality"]
    : ["skills", "experience", "salary", "modality", "languages"]) as Array<
    keyof typeof FACTOR_LABELS
  >;

  return (
    <div className={isDark ? "rounded-[1rem] border border-white/8 bg-white/4 p-4" : "rounded-[1rem] border border-slate-200 bg-white/90 p-4"}>
      <p className={isDark ? "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400" : "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"}>
        {isEnglish ? "Breakdown" : "Desglose"}
      </p>

      <div className={`mt-3 grid gap-2 ${compact ? "" : "sm:grid-cols-2"}`}>
        {visibleFactors.map((factor) => {
          const label = isEnglish ? FACTOR_LABELS[factor].en : FACTOR_LABELS[factor].es;
          const unavailable = isNotAvailable(result, factor);
          const value = getFactorValue(result, factor);

          return (
            <div
              key={factor}
              className={isDark ? "rounded-xl border border-white/8 bg-white/3 px-3 py-2 text-xs text-slate-200" : "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{label}</span>
                <span className="font-semibold">{unavailable ? "N/D" : `${value}%`}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
