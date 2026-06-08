import { motion } from "framer-motion";
import {
  Bookmark,
  LoaderCircle,
  MapPin,
} from "lucide-react";

import { getVacancyPresenter } from "@/lib/vacancy-presenters";
import {
  isActiveCandidateApplicationStatus,
  normalizeCandidateApplicationStatus,
} from "@/lib/application-status";
import {
  getVacancyModalityLabel,
  getVacancyPrimaryCta,
} from "@/lib/vacancy-ui";
import {
  getLocalizedVacancyDescription,
  getLocalizedVacancyTags,
  getLocalizedVacancyTitle,
} from "@/lib/vacancy-localization";
import type { VacancyBadgeSignals } from "@/lib/vacancy-popularity";
import { qualifiesAsFeaturedVacancy } from "@/lib/utils";
import type { Vacancy } from "@/types/vacancy";
import { useAppLanguage } from "@/hooks/use-app-language";
import type { CandidateApplication } from "@/types/workflows";
import { getVacancyLocationLabel } from "@/lib/vacancy-ui";

function clampText(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }

  return value.slice(0, limit).trimEnd();
}

function metadataTone(index: number) {
  if (index === 0) {
    return "border-[#fcd116]/16 bg-[#fcd116]/6 text-[#fde68a]";
  }

  if (index === 1) {
    return "border-white/14 bg-white/12 text-white";
  }

  return "border-white/10 bg-white/5 text-slate-200";
}

function getBadgeLabel(kind: "featured" | "urgent", isEnglish: boolean) {
  if (isEnglish) {
    if (kind === "featured") return "Featured";
    return "Urgent";
  }

  if (kind === "featured") return "Destacado";
  return "Urgente";
}

export function JobCard({
  job,
  badgeSignals,
  urgentFilterActive = false,
  saved,
  savePending = false,
  application,
  isApplying = false,
  viewerRole = null,
  previewMode = false,
  onToggleSave,
  onOpenDetails,
  onViewApplication,
}: {
  job: Vacancy;
  badgeSignals?: VacancyBadgeSignals;
  urgentFilterActive?: boolean;
  saved: boolean;
  savePending?: boolean;
  application?: CandidateApplication;
  isApplying?: boolean;
  viewerRole?: "candidate" | "company" | null;
  previewMode?: boolean;
  onToggleSave: (id: string) => void;
  onOpenDetails: (job: Vacancy) => void;
  onViewApplication?: (job: Vacancy) => void;
}) {
  const { isEnglish } = useAppLanguage();
  const isBoosted = badgeSignals?.isFeatured ?? qualifiesAsFeaturedVacancy(job);
  const isUrgent =
    job.publicadorTipo === "empresa" &&
    (job.etiquetas ?? []).some((tag) => tag.toLowerCase() === "urgente");
  const visibleTitle = getLocalizedVacancyTitle(job, isEnglish);
  const { displayCategory, displaySalary: visibleSalary, isPersonProfile, applicantsCount } =
    getVacancyPresenter(job);
  const visibleCategoryLabel = displayCategory
    ? (getLocalizedVacancyTags({ ...job, etiquetas: [displayCategory] }, isEnglish)[0] ?? displayCategory)
    : null;
  const normalizedLocation = getVacancyLocationLabel(job.ubicacion)?.trim().toLowerCase();
  const visibleModality = getVacancyModalityLabel(job.modalidad, isEnglish);
  const normalizedModality = visibleModality?.trim().toLowerCase();
  const shouldHideDuplicateModality = normalizedLocation && normalizedModality && normalizedLocation === normalizedModality;
  const visiblePreviewText = clampText(getLocalizedVacancyDescription(job, isEnglish), 88);
  const normalizedStatus = application ? normalizeCandidateApplicationStatus(application.status) : null;
  const hasActiveApplication = Boolean(application && isActiveCandidateApplicationStatus(application.status));
  const isWithdrawn = normalizedStatus === "withdrawn";
  const isClosedProcess =
    Boolean(application) &&
    !hasActiveApplication &&
    !isWithdrawn;
  const defaultPrimaryCtaText = getVacancyPrimaryCta({
    isEnglish,
    isPersonProfile,
    isBoosted,
    isUrgent,
    application,
    isApplying,
  });
  const primaryCtaText =
    previewMode
      ? isEnglish
        ? "Preview"
        : "Vista previa"
      : isPersonProfile && viewerRole === "company"
      ? isEnglish
        ? "View details"
        : "Ver detalles"
      : defaultPrimaryCtaText;

  const statusBadgeText = isClosedProcess
    ? isEnglish ? "Closed" : "Cerrado"
    : isWithdrawn
      ? isEnglish ? "Withdrawn" : "Retirada"
      : hasActiveApplication
        ? isEnglish ? "Applied" : "Aplicaste"
        : null;
  const statusBadgeClassName = isClosedProcess || isWithdrawn
    ? "border-rose-300/20 bg-rose-300/8 text-rose-100"
    : "border-emerald-300/20 bg-emerald-300/8 text-emerald-100";
  const visibleBadges = urgentFilterActive
    ? ([isUrgent ? "urgent" : null].filter(Boolean) as Array<"urgent">)
    : ([
        isUrgent ? "urgent" : null,
        isBoosted ? "featured" : null,
      ].filter(Boolean) as Array<"featured" | "urgent">);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`vacancy-card group relative flex h-full flex-col overflow-hidden rounded-[1.7rem] border transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(8,145,178,0.14)] ${
        isBoosted ? "vacancy-card-featured px-4 pb-2 pt-4 sm:px-5 sm:pb-3 sm:pt-5" : "px-5 pb-2.5 pt-5 sm:px-6 sm:pb-3 sm:pt-6"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {visibleBadges.map((badge) => (
            <span
              key={`${job.id}-${badge}`}
              className={
                badge === "urgent"
                  ? "inline-flex items-center rounded-full border border-red-500 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-950 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.22)]"
                  : "inline-flex items-center rounded-full border border-fuchsia-300/24 bg-fuchsia-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-fuchsia-100"
              }
            >
              {getBadgeLabel(badge, isEnglish)}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={() => {
              if (previewMode) {
                return;
              }

              onToggleSave(job.id);
            }}
            aria-label={
              isPersonProfile && viewerRole === "company"
                ? saved
                  ? "Quitar candidato guardado"
                  : "Guardar candidato"
                : saved
                  ? "Quitar vacante guardada"
                  : "Guardar vacante"
            }
            disabled={previewMode || savePending}
            whileHover={previewMode || savePending ? undefined : { y: -2, scale: 1.03 }}
            whileTap={previewMode || savePending ? undefined : { scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className={`job-card-save-icon inline-flex h-10 w-10 items-center justify-center rounded-full border transition duration-300 ${
              previewMode
                ? "cursor-default border-white/10 bg-transparent text-white/40 opacity-70"
                : savePending
                ? "cursor-wait border-[#fcd116]/32 bg-[#fcd116]/16 text-[#fde68a] opacity-90"
                : saved
                ? "border-[#fcd116]/32 bg-[#fcd116]/16 text-[#fde68a] shadow-[0_0_22px_rgba(252,209,22,0.12)]"
                : "border-white/10 bg-transparent text-white hover:border-cyan-200/24 hover:bg-white/8 hover:text-white"
            }`}
          >
            <motion.span
              animate={{
                scale: saved ? 1.08 : 1,
                rotate: saved ? -8 : 0,
              }}
              transition={{ type: "spring", stiffness: 340, damping: 20 }}
              className="inline-flex"
            >
              <Bookmark className={`h-4.5 w-4.5 ${saved ? "fill-current" : ""}`} />
            </motion.span>
          </motion.button>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="max-w-2xl text-[1.05rem] font-semibold leading-tight text-white sm:text-[1.2rem]">
          {visibleTitle}
        </h3>
        <div className="pt-1">
          {visibleCategoryLabel ? (
            <p className="min-w-0 truncate text-sm font-medium text-slate-200">
              {visibleCategoryLabel}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2.5 overflow-hidden">
        {visibleSalary ? (
          <span className={`vacancy-card-meta-pill inline-flex min-w-0 max-w-full items-center rounded-full border px-3 py-1.5 font-semibold ${metadataTone(0)}`}>
            <span className="truncate">{visibleSalary}</span>
          </span>
        ) : null}
        {visibleModality && !shouldHideDuplicateModality ? (
          <span className={`vacancy-card-meta-pill inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 font-medium ${metadataTone(1)}`}>
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{visibleModality}</span>
          </span>
        ) : null}
      </div>

      <div
        data-no-auto-translate="true"
        className="mt-3 rounded-[1.2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
      >
        <p className="overflow-hidden text-sm leading-6 text-slate-300 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]">
          {visiblePreviewText}
        </p>
      </div>

      <div className="mt-auto flex items-start justify-between gap-3 pt-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col items-start gap-2">
            <motion.button
              type="button"
              disabled={isApplying || isClosedProcess}
              onClick={() => {
                if (previewMode) {
                  onOpenDetails(job);
                  return;
                }

                if (isPersonProfile) {
                  onOpenDetails(job);
                  return;
                }

                if (hasActiveApplication) {
                  onViewApplication?.(job);
                  return;
                }

                if (isClosedProcess) {
                  return;
                }

                onOpenDetails(job);
              }}
              whileHover={previewMode || isClosedProcess ? undefined : { y: -2, scale: 1.01 }}
              whileTap={previewMode || isClosedProcess ? undefined : { scale: 0.985 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className={`job-card-detail-cta inline-flex max-w-[9.75rem] items-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(76,29,149,0.26)] transition duration-300 sm:max-w-[10.25rem] ${
                previewMode
                  ? "cursor-default bg-white/10 text-white/80 shadow-none"
                  : isClosedProcess
                  ? "cursor-not-allowed bg-slate-500/80 opacity-85 shadow-none"
                  : isApplying
                    ? "scale-[0.99] cursor-wait bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 opacity-90"
                    : "cursor-pointer bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_20px_42px_rgba(59,130,246,0.24)]"
              }`}
            >
              {isApplying ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
              <span className="job-card-detail-text truncate">{primaryCtaText}</span>
            </motion.button>
          </div>
        </div>

        <div className="flex max-w-[8.5rem] shrink-0 flex-col items-end gap-1.5 text-right sm:max-w-[9rem]">
          {statusBadgeText ? (
            <span className={`inline-flex max-w-full items-center rounded-full border px-2 py-1 text-[10px] font-semibold sm:text-[11px] ${statusBadgeClassName}`}>
              <span className="truncate">
                {statusBadgeText}
              </span>
            </span>
          ) : null}

          {applicantsCount ? (
            <div className="inline-flex max-w-full items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/8 px-2 py-1 text-[10px] font-semibold text-emerald-100 sm:text-[11px]">
              <span className="truncate">{applicantsCount} {isEnglish ? "applied" : "aplicaron"}</span>
            </div>
          ) : null}
        </div>
      </div>
    </motion.article>
  );
}
