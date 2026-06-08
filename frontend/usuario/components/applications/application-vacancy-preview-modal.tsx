"use client";
import { Building2, MapPin, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  buildCompanySummaryView,
  CompanySummaryModalSection,
} from "@/components/vacancies/company-summary-modal-section";
import { slugifyCompanyName } from "@/lib/company-public-slug";
import { useUiCopy } from "@/lib/i18n/ui-copy";
import {
  formatCopValue,
  formatDescriptionBlocks,
  formatExperienceValue,
  getCompanyInitials,
  getRelevantRoleTags,
  normalizeVacancyTag,
} from "@/components/vacancies/job-dashboard-utils";
import {
  getVacancyLocationLabel,
  getVacancyModalityLabel,
} from "@/lib/vacancy-ui";
import {
  getLocalizedVacancyLongDescription,
  getLocalizedVacancyTags,
  getLocalizedVacancyTitle,
  localizeVacancyText,
} from "@/lib/vacancy-localization";
import { qualifiesAsFeaturedVacancy } from "@/lib/utils";
import type { Vacancy } from "@/types/vacancy";

type ApplicationVacancyPreviewModalProps = {
  open: boolean;
  isDark: boolean;
  isEnglish: boolean;
  selectedJob: Vacancy | null;
  primaryActionLabel?: string;
  primaryActionDisabled?: boolean;
  onPrimaryAction?: (job: Vacancy) => void;
  onClose: () => void;
};

export function ApplicationVacancyPreviewModal({
  open,
  isDark,
  isEnglish,
  selectedJob,
  primaryActionLabel,
  primaryActionDisabled = false,
  onPrimaryAction,
  onClose,
}: ApplicationVacancyPreviewModalProps) {
  const detailUi = useUiCopy("vacancyDetailModal");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  const selectedJobPrimaryName =
    selectedJob?.publicadorNombre ?? selectedJob?.empresa ?? undefined;
  const selectedJobLocalizedTitle = selectedJob ? getLocalizedVacancyTitle(selectedJob, isEnglish) : "";
  const selectedJobLocalizedTags = selectedJob ? getLocalizedVacancyTags(selectedJob, isEnglish) : [];
  const selectedJobLocalizedBenefits = (selectedJob?.beneficios ?? []).map((benefit) =>
    localizeVacancyText(benefit, isEnglish),
  );
  const selectedJobLocationLabel = getVacancyLocationLabel(selectedJob?.ubicacion);
  const selectedJobModalityLabel = getVacancyModalityLabel(selectedJob?.modalidad, isEnglish);
  const shouldHideSelectedJobModality = Boolean(
    selectedJobLocationLabel &&
      selectedJobModalityLabel &&
      selectedJobLocationLabel.trim().toLowerCase() === selectedJobModalityLabel.trim().toLowerCase(),
  );

  const companySummary = useMemo(() => {
    if (!selectedJob) {
      return null;
    }

    return buildCompanySummaryView({
      job: selectedJob,
      companyName: selectedJobPrimaryName,
      getCompanyInitials,
      isEnglish,
    });
  }, [isEnglish, selectedJob, selectedJobPrimaryName]);

  if (!open || !selectedJob || !companySummary) {
    return null;
  }

  const openSelectedEntityProfile = () => {
    const companySlug = slugifyCompanyName(selectedJobPrimaryName ?? selectedJob.empresa ?? "");
    if (!companySlug) {
      return;
    }

    if (typeof window !== "undefined") {
      window.open(`/empresa/${companySlug}`, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto px-4 py-4 sm:flex sm:items-center sm:justify-center sm:py-6">
      <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative z-10 mx-auto w-full max-w-[60.5rem]">
        <button
          type="button"
          aria-label={detailUi("closeDetails")}
          onClick={onClose}
          className={
            isDark
              ? "absolute left-0 top-6 z-20 inline-flex h-11 w-11 -translate-x-[4.25rem] items-center justify-center rounded-full border border-white/10 bg-[#081120] text-slate-200 shadow-[0_16px_40px_rgba(0,0,0,0.32)] transition hover:border-cyan-200/24 hover:bg-[#0b1729]"
              : "absolute left-0 top-6 z-20 inline-flex h-11 w-11 -translate-x-[4.25rem] items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-[0_16px_40px_rgba(148,163,184,0.20)] transition hover:border-sky-300 hover:bg-slate-50]"
          }
        >
          <X className="h-4.5 w-4.5" />
        </button>
        <div
          className={
            isDark
              ? "touch-scroll-y relative max-h-[90dvh] w-full overflow-y-auto rounded-[2rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(7,16,31,0.98),rgba(8,17,32,0.94))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.42)] sm:p-7"
              : "touch-scroll-y relative max-h-[90dvh] w-full overflow-y-auto rounded-[2rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-6 shadow-[0_24px_70px_rgba(148,163,184,0.20)] sm:p-7"
          }
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200" : "text-xs font-semibold uppercase tracking-[0.24em] text-sky-700"}>
                {detailUi("jobDetails")}
              </p>
              <h3 className={isDark ? "mt-3 text-2xl font-semibold text-white" : "mt-3 text-2xl font-semibold text-slate-900"}>
                {selectedJobLocalizedTitle}
              </h3>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
            {(selectedJob.etiquetas ?? []).some((tag) => tag.toLowerCase() === "urgente") ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-red-500 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-950 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.22)]">
                {detailUi("urgent")}
              </span>
            ) : null}
            {qualifiesAsFeaturedVacancy(selectedJob) ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#fcd116]/40 bg-[#fcd116]/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-black">
                {detailUi("featured")}
              </span>
            ) : null}
            {typeof selectedJob.aplicantes === "number" ? (
              <span className={isDark ? "inline-flex items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100" : "inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800"}>
                {detailUi("appliedCount", { count: selectedJob.aplicantes })}
              </span>
            ) : null}
            {selectedJobPrimaryName ? (
              <span className={isDark ? "inline-flex items-center gap-2 text-sky-300" : "inline-flex items-center gap-2 text-sky-700"}>
                <Building2 className="h-4 w-4" />
                {selectedJobPrimaryName}
              </span>
            ) : null}
            {selectedJobLocationLabel ? (
              <span className={isDark ? "inline-flex items-center gap-2 text-slate-300" : "inline-flex items-center gap-2 text-slate-700"}>
                <MapPin className="h-4 w-4" />
                {selectedJobLocationLabel}
              </span>
            ) : null}
            {selectedJobModalityLabel && !shouldHideSelectedJobModality ? (
              <span className={isDark ? "rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-300" : "rounded-full border border-slate-300 bg-white px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-700"}>
                {selectedJobModalityLabel}
              </span>
            ) : null}
          </div>

          <div className={isDark ? "mt-6 rounded-[1.5rem] border border-white/8 bg-white/4 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]" : "mt-6 rounded-[1.5rem] border border-slate-300 bg-white/88 p-4 shadow-[0_12px_24px_rgba(148,163,184,0.08)]"}>
            <div
              className={`touch-scroll-y overflow-y-auto pr-2 transition-[max-height] duration-300 ease-out ${
                isDescriptionExpanded
                  ? "max-h-[min(52dvh,32rem)]"
                  : "max-h-[150px] overflow-hidden pr-0"
              }`}
            >
              <div className="space-y-3">
                {formatDescriptionBlocks(
                  getLocalizedVacancyLongDescription(selectedJob, isEnglish).split(/\s+/).slice(0, 1500).join(" "),
                ).map((block, index) => (
                  <p
                    key={`${selectedJob.id}-description-${index}`}
                    className={isDark ? "text-sm leading-7 text-slate-300" : "text-sm leading-7 text-slate-700"}
                  >
                    {block}
                  </p>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsDescriptionExpanded((current) => !current)}
              className={isDark ? "mt-3 inline-flex items-center gap-2 text-xs font-semibold text-cyan-200 transition hover:text-cyan-100" : "mt-3 inline-flex items-center gap-2 text-xs font-semibold text-sky-700 transition hover:text-sky-800"}
            >
              {isDescriptionExpanded
                ? detailUi("hideFullDescription")
                : detailUi("viewFullDescription")}
            </button>
          </div>

          <div className={isDark ? "mt-5 rounded-[1.5rem] border border-white/8 bg-white/4 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]" : "mt-5 rounded-[1.5rem] border border-slate-300 bg-white/88 p-4 shadow-[0_12px_24px_rgba(148,163,184,0.08)]"}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.18em] text-slate-400" : "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"}>
                  {detailUi("requiredExperience")}
                </p>
                <p className={isDark ? "mt-2 text-sm font-medium text-white" : "mt-2 text-sm font-medium text-slate-900"}>
                  {formatExperienceValue(selectedJob.experienciaMinimaAnos ?? 0, isEnglish)}
                </p>
              </div>
              <div>
                <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.18em] text-slate-400" : "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"}>
                  {detailUi("salaryToPay")}
                </p>
                <p className={isDark ? "mt-2 text-sm font-medium text-white" : "mt-2 text-sm font-medium text-slate-900"}>
                  {selectedJob.salario ?? formatCopValue((selectedJob.salarioMinimoMillones ?? 0) * 1_000_000)}
                </p>
              </div>
            </div>

            {selectedJobLocalizedBenefits.length ? (
              <div className="mt-5">
                <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.18em] text-slate-400" : "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"}>
                  {detailUi("extraBenefits")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedJobLocalizedBenefits.map((benefit) => (
                    <span
                      key={`${selectedJob.id}-${benefit}`}
                      className={isDark ? "rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs font-medium text-slate-300" : "rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"}
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {getRelevantRoleTags(selectedJob.etiquetas).length ? (
              <div className="mt-5">
                <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.18em] text-slate-400" : "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"}>
                  {detailUi("focus")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedJobLocalizedTags
                    .filter((tag) => normalizeVacancyTag(tag) !== normalizeVacancyTag("Software / Development"))
                    .slice(0, 6)
                    .map((tag) => (
                      <span
                        key={`${selectedJob.id}-${tag}`}
                        className={isDark ? "rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-slate-300" : "rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-slate-700"}
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              </div>
            ) : null}
          </div>

          <CompanySummaryModalSection
            company={companySummary}
            lookupName={selectedJobPrimaryName ?? selectedJob.empresa}
            isDark={isDark}
            isEnglish={isEnglish}
          />
          <div className="mt-8 flex flex-wrap justify-start gap-3">
            {primaryActionLabel && onPrimaryAction ? (
              <button
                type="button"
                disabled={primaryActionDisabled}
                onClick={() => onPrimaryAction(selectedJob)}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(76,29,149,0.26)] transition duration-300 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-80"
              >
                {primaryActionLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={openSelectedEntityProfile}
              className={
                isDark
                  ? "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/4 px-5 py-2.5 text-sm font-medium text-slate-100 transition duration-300 hover:border-cyan-200/24 hover:bg-white/8"
                  : "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition duration-300 hover:border-slate-400 hover:bg-slate-50"
              }
            >
              {isEnglish ? "View company" : "Ver empresa"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition duration-300 hover:border-slate-400 hover:bg-slate-50"
            >
              {detailUi("close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
