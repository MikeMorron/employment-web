"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import {
  canWithdrawCandidateApplication,
  getCandidateApplicationStatusLabel,
  getCandidateApplicationVisibleGroupLabel,
  getApplicationVisibleGroup,
  VISIBLE_APPLICATION_GROUPS,
} from "@/lib/application-status";
import { useUiCopy } from "@/lib/i18n/ui-copy";
import {
  formatApplicationDate,
  getApplicationBadgeTone,
  getCurrentGroupIndex,
  getGroupHelperCopyKey,
  getGroupIndex,
  getStepDate,
  isNegativeClosedStatus,
  isWithdrawnStatus,
} from "@/components/vacancies/application-status-dialog-helpers";
import type { CandidateApplication } from "@/types/workflows";

export function ApplicationStatusDialog({
  application,
  autoClose = false,
  autoCloseMs = 10000,
  closing = false,
  isOpen,
  isDark,
  isEnglish = false,
  onClose,
  onWithdraw,
}: {
  application: CandidateApplication | null;
  autoClose?: boolean;
  autoCloseMs?: number;
  closing?: boolean;
  isOpen: boolean;
  isDark: boolean;
  isEnglish?: boolean;
  onClose: () => void;
  onWithdraw: (applicationId: string) => void;
}) {
  const t = useUiCopy("applicationStatusDialog");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !application) {
    return null;
  }

  const currentGroup = getApplicationVisibleGroup(application.status);
  const currentGroupIndex = getCurrentGroupIndex(application.status);
  const withdrawEnabled = canWithdrawCandidateApplication(application.status);
  const substatusLabel = getCandidateApplicationStatusLabel(application.status, isEnglish);
  const isNegativeClosure = currentGroup === "cerrada" && isNegativeClosedStatus(application.status);
  const isWithdrawnClosure = currentGroup === "cerrada" && isWithdrawnStatus(application.status);

  return (
    <div className="fixed inset-0 z-[140] overflow-y-auto bg-slate-950/60 px-4 py-4 backdrop-blur-md sm:flex sm:items-center sm:justify-center sm:py-6">
      <div ref={scrollContainerRef} className="relative mx-auto w-full max-w-[44rem]">
        <div className="absolute left-0 top-7 z-[145] -translate-x-[5.6rem] sm:top-8 sm:-translate-x-[6.6rem]">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeTracking")}
            className={isDark ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4 text-slate-100 transition hover:border-white/16 hover:bg-white/8" : "inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className={`${isDark ? "touch-scroll-y w-full max-h-[90dvh] overflow-y-auto rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,16,31,0.98),rgba(8,17,32,0.96))] p-4 shadow-[0_32px_90px_rgba(0,0,0,0.48)] transition duration-300 sm:p-6" : "touch-scroll-y w-full max-h-[90dvh] overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_32px_90px_rgba(15,23,42,0.16)] transition duration-300 sm:p-6"} ${closing ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200" : "text-xs font-semibold uppercase tracking-[0.18em] text-sky-700"}>
              {t("applicationTracking")}
            </p>
            <h2 className={isDark ? "mt-2 text-[1.45rem] font-semibold leading-tight text-white sm:text-[1.7rem]" : "mt-2 text-[1.45rem] font-semibold leading-tight text-slate-950 sm:text-[1.7rem]"}>
              {application.title}
            </h2>
            <p className={isDark ? "mt-1 text-[13px] text-slate-300 sm:text-sm" : "mt-1 text-[13px] text-slate-600 sm:text-sm"}>
              {application.companyName}
            </p>
            <p className={isDark ? "mt-2.5 max-w-2xl text-[13px] leading-5.5 text-slate-300 sm:text-sm" : "mt-2.5 max-w-2xl text-[13px] leading-5.5 text-slate-600 sm:text-sm"}>
              {t(getGroupHelperCopyKey(currentGroup))}
            </p>
          </div>

          <div className="flex items-start gap-3">
            {autoClose ? (
              <div
                className={isDark ? "relative h-10 w-10 text-sky-300" : "relative h-10 w-10 text-sky-500"}
                aria-hidden="true"
              >
                <svg className="-rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity="0.18"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="3"
                    strokeDasharray="97.39"
                    strokeDashoffset="97.39"
                    style={{ animation: `ts-application-status-fill ${autoCloseMs}ms linear forwards` }}
                  />
                </svg>
              </div>
            ) : null}
            <div className="flex flex-col items-end gap-1.5">
              <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${getApplicationBadgeTone(application.status)}`}>
                {getCandidateApplicationVisibleGroupLabel(currentGroup, isEnglish)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <div className={isDark ? "rounded-[1.15rem] border border-white/8 bg-white/4 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]" : "rounded-[1.15rem] border border-slate-200 bg-slate-50/90 p-3.5"}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t("appliedOn")}</p>
            <p className={isDark ? "mt-1.5 text-sm font-semibold text-white" : "mt-1.5 text-sm font-semibold text-slate-900"}>
              {formatApplicationDate(application.appliedAt, isEnglish)}
            </p>
          </div>

          <div className={isDark ? "rounded-[1.15rem] border border-white/8 bg-white/4 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]" : "rounded-[1.15rem] border border-slate-200 bg-slate-50/90 p-3.5"}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t("lastUpdate")}</p>
            <p className={isDark ? "mt-1.5 text-sm font-semibold text-white" : "mt-1.5 text-sm font-semibold text-slate-900"}>
              {formatApplicationDate(application.lastUpdatedAt, isEnglish)}
            </p>
          </div>

          <div className={isDark ? "rounded-[1.15rem] border border-white/8 bg-white/4 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]" : "rounded-[1.15rem] border border-slate-200 bg-slate-50/90 p-3.5"}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t("modality")}</p>
            <p className={isDark ? "mt-1.5 text-sm font-semibold text-white" : "mt-1.5 text-sm font-semibold text-slate-900"}>
              {application.modality}
            </p>
          </div>

          <div className={isDark ? "rounded-[1.15rem] border border-white/8 bg-white/4 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]" : "rounded-[1.15rem] border border-slate-200 bg-slate-50/90 p-3.5"}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t("match")}</p>
            <p className={isDark ? "mt-1.5 text-sm font-semibold text-white" : "mt-1.5 text-sm font-semibold text-slate-900"}>
              {application.fitLabel}
            </p>
          </div>
        </div>

        <div className={isDark ? "mt-5 rounded-[1.4rem] border border-white/8 bg-white/4 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]" : "mt-5 rounded-[1.4rem] border border-slate-200 bg-slate-50/90 p-4"}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className={isDark ? "text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-400" : "text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-500"}>
                {t("applicationStages")}
              </p>
              <p className={isDark ? "mt-1 text-[16px] text-slate-300" : "mt-1 text-[16px] text-slate-600"}>
                {t("simplifiedView")}
              </p>
            </div>
            <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${getApplicationBadgeTone(application.status)}`}>
              {substatusLabel}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {VISIBLE_APPLICATION_GROUPS.map((group, index) => {
              const groupIndex = getGroupIndex(group);
              const completed = groupIndex < currentGroupIndex || group === currentGroup;
              const current = group === currentGroup;
              const stepDate = getStepDate(application, group);
              const isFirstStage = group === "postulada";
              const useNegativeClosedTone = isNegativeClosure && !isFirstStage;
              const useWithdrawnTone = isWithdrawnClosure && !isFirstStage;

              const cardTone = useWithdrawnTone
                ? isDark
                  ? "border-violet-400/18 bg-violet-400/8"
                  : "border-violet-200 bg-violet-50/80"
                : useNegativeClosedTone
                ? isDark
                  ? "border-rose-400/18 bg-rose-400/8"
                  : "border-rose-200 bg-rose-50/80"
                : current
                  ? isDark
                    ? "border-sky-400/18 bg-sky-400/8"
                    : "border-sky-200 bg-sky-50/80"
                  : completed
                    ? isDark
                      ? "border-emerald-400/14 bg-emerald-400/6"
                      : "border-emerald-200 bg-emerald-50/70"
                    : isDark
                      ? "border-white/8 bg-white/[0.02]"
                      : "border-slate-200 bg-white/80";

              const stepTone = useWithdrawnTone
                ? "border-violet-400 bg-violet-400 text-white shadow-[0_10px_24px_rgba(139,92,246,0.24)]"
                : useNegativeClosedTone
                ? "border-rose-400 bg-rose-400 text-white shadow-[0_10px_24px_rgba(244,63,94,0.24)]"
                : current
                  ? "border-sky-400 bg-sky-400 text-white shadow-[0_10px_24px_rgba(14,165,233,0.25)]"
                  : completed
                    ? "border-emerald-400 bg-emerald-400 text-[#03291d]"
                    : isDark
                      ? "border-white/12 bg-white/[0.03] text-slate-400"
                      : "border-slate-300 bg-white text-slate-400";

              const stageLabelTone = useWithdrawnTone
                ? isDark
                  ? "text-[15px] font-semibold text-violet-100"
                  : "text-[15px] font-semibold text-violet-800"
                : useNegativeClosedTone
                ? isDark
                  ? "text-[15px] font-semibold text-rose-100"
                  : "text-[15px] font-semibold text-rose-800"
                : current
                  ? isDark
                    ? "text-[15px] font-semibold text-white"
                    : "text-[15px] font-semibold text-slate-950"
                  : isDark
                    ? "text-[15px] font-medium text-slate-200"
                    : "text-[15px] font-medium text-slate-700";

              const metaTone = useWithdrawnTone
                ? isDark
                  ? "text-[12px] text-violet-200/80"
                  : "text-[12px] text-violet-600"
                : useNegativeClosedTone
                ? isDark
                  ? "text-[12px] text-rose-200/80"
                  : "text-[12px] text-rose-600"
                : isDark
                  ? "text-[12px] text-slate-400"
                  : "text-[12px] text-slate-500";

              const helperTone = useWithdrawnTone
                ? isDark
                  ? "mt-1 text-[12.5px] leading-5 text-violet-100/80"
                  : "mt-1 text-[12.5px] leading-5 text-violet-700"
                : useNegativeClosedTone
                ? isDark
                  ? "mt-1 text-[12.5px] leading-5 text-rose-100/80"
                  : "mt-1 text-[12.5px] leading-5 text-rose-700"
                : isDark
                  ? "mt-1 text-[12.5px] leading-5 text-slate-400"
                  : "mt-1 text-[12.5px] leading-5 text-slate-500";

              const footerTone = useWithdrawnTone
                ? isDark
                  ? "mt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-violet-200/80"
                  : "mt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-violet-500"
                : useNegativeClosedTone
                ? isDark
                  ? "mt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-rose-200/80"
                  : "mt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-rose-500"
                : isDark
                  ? "mt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500"
                  : "mt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400";

              return (
                <div
                  key={group}
                  className={`min-w-0 rounded-[1rem] border px-3.5 py-3 transition ${cardTone}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition ${stepTone}`}>
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className={stageLabelTone}>
                          {getCandidateApplicationVisibleGroupLabel(group, isEnglish)}
                        </p>
                        <span className={metaTone}>
                          {stepDate ? formatApplicationDate(stepDate, isEnglish) : t("pending")}
                        </span>
                      </div>
                      {!(current && group === "postulada") ? (
                        <p className={helperTone}>
                          {current
                            ? substatusLabel
                            : t(getGroupHelperCopyKey(group))}
                        </p>
                      ) : null}
                      <p className={footerTone}>
                        {current
                          ? t("currentStage")
                          : completed
                            ? t("completed")
                            : t("pending")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
            {t("updatedByCompany")}
          </div>

          <div className="flex flex-wrap gap-3">
            {withdrawEnabled ? (
              <button
                type="button"
                onClick={() => onWithdraw(application.id)}
                className={isDark ? "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/4 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-white/16 hover:bg-white/8" : "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"}
              >
                {t("withdrawApplication")}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(76,29,149,0.26)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(76,29,149,0.28)]"
            >
              {t("close")}
            </button>
          </div>
        </div>
        </div>
        <style jsx global>{`
          @keyframes ts-application-status-fill {
            from {
              stroke-dashoffset: 97.39;
            }
            to {
              stroke-dashoffset: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
