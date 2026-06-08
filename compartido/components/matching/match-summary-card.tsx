"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { MatchResult } from "@/types/matching";
import { getMatchConfidenceLabel, getMatchReasonCardLabel } from "@/lib/matching";

function MatchBullet({
  kind,
}: {
  kind: "strength" | "gap" | "warning";
}) {
  if (kind === "strength") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 shrink-0">
        <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.18" />
        <path
          d="M4.5 8.2l2.1 2.1 4.9-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }

  if (kind === "gap") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 shrink-0">
        <path
          d="M8 2.2l5.8 10.1a.9.9 0 01-.78 1.35H2.98A.9.9 0 012.2 12.3L8 2.2z"
          fill="currentColor"
          opacity="0.18"
        />
        <path
          d="M8 5.3v3.8m0 2.1h.01"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 shrink-0">
      <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.18" />
      <path
        d="M8 4.6v4.2m0 2.4h.01"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function levelClass(level: MatchResult["level"], isDark: boolean) {
  if (level === "high") {
    return isDark
      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
      : "border-emerald-300 bg-emerald-50 text-emerald-700";
  }

  if (level === "medium") {
    return isDark
      ? "border-amber-300/20 bg-amber-400/10 text-amber-100"
      : "border-amber-300 bg-amber-50 text-amber-700";
  }

  return isDark
    ? "border-rose-300/20 bg-rose-400/10 text-rose-100"
    : "border-rose-300 bg-rose-50 text-rose-700";
}

function levelLabel(level: MatchResult["level"], isEnglish: boolean) {
  if (isEnglish) {
    if (level === "high") return "Strong fit";
    if (level === "medium") return "Good potential";
    return "Low fit";
  }

  if (level === "high") return "Buen encaje";
  if (level === "medium") return "Encaje medio";
  return "Encaje bajo";
}

function levelRingClass(level: MatchResult["level"], isDark: boolean) {
  if (level === "high") {
    return isDark ? "text-emerald-300" : "text-emerald-600";
  }

  if (level === "medium") {
    return isDark ? "text-amber-300" : "text-amber-600";
  }

  return isDark ? "text-rose-300" : "text-rose-600";
}

function getGapInsights(result: MatchResult) {
  return result.gaps.slice(0, 2);
}

function getCombinedGapInsights(result: MatchResult) {
  return getGapInsights(result).map((reason) => getMatchReasonCardLabel(reason));
}

export function MatchSummaryCard({
  result,
  isDark,
  compact = false,
  isEnglish = false,
  detailsCollapsed = false,
  onToggleDetails,
  showRankingExplanation = false,
  variant = "default",
}: {
  result: MatchResult;
  isDark: boolean;
  compact?: boolean;
  isEnglish?: boolean;
  detailsCollapsed?: boolean;
  onToggleDetails?: () => void;
  showRankingExplanation?: boolean;
  variant?: "default" | "dashboard";
}) {
  const visibleStrengths = result.strengths.slice(0, compact ? 2 : 3);
  const visibleWarnings = result.warnings.slice(0, compact ? 1 : 2);
  const combinedGapInsights = getCombinedGapInsights(result);
  const showDetails = !detailsCollapsed;
  const confidenceLabel = getMatchConfidenceLabel(result.confidenceScore);
  const [ringAnimated, setRingAnimated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setRingAnimated(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const ringSize = 72;
  const ringStroke = 6;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const normalizedScore = Math.max(0, Math.min(100, result.visibleScore));
  const ringOffset = ringCircumference - (ringAnimated ? normalizedScore / 100 : 0) * ringCircumference;

  return (
    <div className={isDark ? "rounded-[1rem] border border-white/8 bg-white/4 p-4" : "rounded-[1rem] border border-slate-200 bg-white/90 p-4"}>
      {variant === "dashboard" ? (
        <div className="flex items-center gap-4">
          <div className="relative h-[72px] w-[72px] shrink-0">
            <svg viewBox={`0 0 ${ringSize} ${ringSize}`} className="-rotate-90 h-full w-full" aria-hidden="true">
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth={ringStroke}
                className={isDark ? "text-white/8" : "text-slate-200"}
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth={ringStroke}
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                className={levelRingClass(result.level, isDark)}
                style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={isDark ? "text-base font-semibold leading-none text-white" : "text-base font-semibold leading-none text-slate-950"}>
                {normalizedScore}%
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Match</p>
            <p className={isDark ? "mt-1 text-sm font-medium text-slate-200" : "mt-1 text-sm font-medium text-slate-700"}>
              {levelLabel(result.level, isEnglish)}
            </p>
            <p className={isDark ? "mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-400" : "mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-500"}>
              {isEnglish ? "Confidence" : "Confianza"} {confidenceLabel === "high" ? (isEnglish ? "high" : "alta") : confidenceLabel === "medium" ? (isEnglish ? "medium" : "media") : (isEnglish ? "low" : "baja")}
            </p>
            <p className={isDark ? "mt-3 text-sm leading-6 text-slate-300" : "mt-3 text-sm leading-6 text-slate-700"}>
              {result.summary}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Match</p>
            <p className={isDark ? "mt-1 text-2xl font-semibold text-white" : "mt-1 text-2xl font-semibold text-slate-950"}>
              {result.visibleScore}% {isEnglish ? "match" : "match"}
            </p>
            <p className={isDark ? "mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-400" : "mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-500"}>
              {isEnglish ? "Confidence" : "Confianza"} {confidenceLabel === "high" ? (isEnglish ? "high" : "alta") : confidenceLabel === "medium" ? (isEnglish ? "medium" : "media") : (isEnglish ? "low" : "baja")}
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${levelClass(result.level, isDark)}`}>
            {levelLabel(result.level, isEnglish)}
          </span>
        </div>
      )}

      {variant !== "dashboard" ? (
        <p className={isDark ? "mt-4 text-sm leading-6 text-slate-300" : "mt-4 text-sm leading-6 text-slate-700"}>
          {result.summary}
        </p>
      ) : null}
      {showRankingExplanation && result.rankingScore !== result.visibleScore ? (
        <p className={isDark ? "mt-2 text-xs leading-5 text-slate-400" : "mt-2 text-xs leading-5 text-slate-500"}>
          {isEnglish
            ? "List order also considers recency, plan, and activity. The visible percentage remains pure fit."
            : "El orden de la lista también considera recencia, plan y actividad. El porcentaje visible sigue siendo encaje puro."}
        </p>
      ) : null}

      {showDetails ? (
        <>
          <div className="mt-3 space-y-2">
            {visibleStrengths.map((reason) => (
              <div key={reason.key} className={isDark ? "flex items-start gap-2 rounded-xl border border-emerald-300/12 bg-emerald-400/6 px-3 py-2 text-xs text-emerald-100" : "flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"}>
                <MatchBullet kind="strength" />
                <span>{getMatchReasonCardLabel(reason)}</span>
              </div>
            ))}
            {!compact && visibleWarnings.map((reason) => (
              <div key={reason.key} className={isDark ? "flex items-start gap-2 rounded-xl border border-amber-300/12 bg-amber-400/6 px-3 py-2 text-xs text-amber-100" : "flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700"}>
                <MatchBullet kind="warning" />
                <span>{getMatchReasonCardLabel(reason)}</span>
              </div>
            ))}
          </div>

          {combinedGapInsights.length ? (
            <div className={isDark ? "mt-4 rounded-xl border border-rose-300/12 bg-rose-400/6 px-3 py-3" : "mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3"}>
              <p className={isDark ? "text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-100" : "text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700"}>
                {isEnglish ? "Why this match is low" : "Por qué este match es bajo"}
              </p>
              <div className="mt-2 space-y-1.5">
                {combinedGapInsights.map((item) => (
                  <p key={item} className={isDark ? "text-xs text-rose-100" : "text-xs text-rose-700"}>
                    • {item}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {onToggleDetails ? (
        <button
          type="button"
          onClick={onToggleDetails}
          className={isDark ? "mt-3 inline-flex items-center gap-2 text-xs font-semibold text-cyan-200 transition hover:text-cyan-100" : "mt-3 inline-flex items-center gap-2 text-xs font-semibold text-sky-700 transition hover:text-sky-800"}
        >
          <ChevronDown className={`h-4 w-4 transition duration-200 ${showDetails ? "rotate-180" : ""}`} />
          {showDetails
            ? isEnglish ? "Hide details" : "Ocultar detalle"
            : isEnglish ? "Show details" : "Mostrar detalle"}
        </button>
      ) : null}
    </div>
  );
}
