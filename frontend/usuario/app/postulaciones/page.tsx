"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { BookmarkMinus, ChevronRight, Clock3, FileText, RotateCcw, X } from "lucide-react";
import { ApplicationVacancyPreviewModal } from "@/components/applications/application-vacancy-preview-modal";
import { RoleRouteGuard } from "@/components/role/role-route-guard";
import { RoleEmptyState } from "@/components/role/role-empty-state";
import { MiniPageNav } from "@/components/ui/mini-page-nav";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useCandidateApplications } from "@/hooks/use-candidate-applications";
import { useSavedVacancies } from "@/hooks/use-saved-vacancies";
import { useVacancyFeed } from "@/hooks/use-vacancy-feed";
import {
  canWithdrawCandidateApplication,
  getCandidateApplicationStatusLabel,
  getCandidateApplicationTone,
  getCandidateApplicationVisibleGroupLabel,
  getApplicationVisibleGroup,
  isActiveCandidateApplicationStatus,
} from "@/lib/application-status";
import { useUiCopy } from "@/lib/i18n/ui-copy";
import { getLocalizedVacancyTitle } from "@/lib/vacancy-localization";
import { useVacancyTheme } from "@/hooks/use-vacancy-theme";
import type { Vacancy } from "@/types/vacancy";

export default function PostulacionesPage() {
  const { isDark, themeReady, toggleTheme } = useVacancyTheme();
  const { isEnglish } = useAppLanguage();
  const searchParams = useSearchParams();
  const t = useUiCopy("applications");
  const common = useUiCopy("common");
  const { authUser } = useAuthUser();
  const candidateViewer = authUser?.role === "candidate" ? authUser : null;
  const {
    applications,
    archivedApplications,
    withdrawApplication,
    advanceApplication,
    seededRecommendations,
  } = useCandidateApplications(candidateViewer);
  const { savedVacancies, savedVacanciesLoading, toggleSave } = useSavedVacancies();
  const { vacancies } = useVacancyFeed(
    candidateViewer ? `vacancy-feed:${candidateViewer.id}` : "vacancy-feed:guest",
  );
  const savedOnly = searchParams.get("saved") === "1";
  const dateLocale = isEnglish ? "en-US" : "es-CO";
  const [selectedPosting, setSelectedPosting] = useState<Vacancy | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmWithdrawId, setConfirmWithdrawId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const visibleApplications = useMemo(
    () =>
      applications.filter(
        (application) =>
          isActiveCandidateApplicationStatus(application.status) ||
          ["offer_accepted", "offer_rejected", "rejected", "not_selected"].includes(
            String(application.status),
          ),
      ),
    [applications],
  );
  const vacanciesById = useMemo(
    () => new Map(vacancies.map((job) => [job.id, job])),
    [vacancies],
  );

  function formatLocalizedDate(value: string) {
    return new Intl.DateTimeFormat(dateLocale).format(new Date(value));
  }

  function buildSimilarJobsHref(application: (typeof applications)[number]) {
    const relatedVacancy = vacanciesById.get(application.jobId);
    const params = new URLSearchParams();
    const inferredCategory = relatedVacancy?.etiquetas?.[0]?.trim() || application.title.trim();

    if (inferredCategory) {
      params.set("q", inferredCategory);
      params.set("category", inferredCategory);
    }

    if (relatedVacancy?.modalidad?.trim()) {
      params.set("mode", relatedVacancy.modalidad.trim());
    }

    if (relatedVacancy?.departamento?.trim()) {
      params.set("dept", relatedVacancy.departamento.trim());
    }

    if (relatedVacancy?.municipio?.trim()) {
      params.set("mun", relatedVacancy.municipio.trim());
    }

    const query = params.toString();
    return query ? `/vacantes?${query}` : "/vacantes";
  }

  async function handleWithdrawApplication(applicationId: string) {
    setWithdrawingId(applicationId);

    try {
      await withdrawApplication(applicationId);
      setConfirmWithdrawId(null);
    } finally {
      setWithdrawingId(null);
    }
  }

  return (
    <RoleRouteGuard allowedRole="candidate">
      <main
        className={`min-h-screen px-5 py-10 ${isDark ? "vacancies-shell text-[#eef6ff]" : "vacancies-shell-light text-slate-900"} ${themeReady ? "" : "invisible"}`}
      >
        <div className="mx-auto max-w-6xl space-y-6">
          <MiniPageNav isDark={isDark} onToggleTheme={toggleTheme} />

          <section
            className={
              isDark
                ? "rounded-[1.8rem] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(7,16,31,0.94),rgba(8,17,32,0.90))] p-6"
                : "rounded-[1.8rem] border border-slate-300 bg-white/92 p-6"
            }
          >
            <p
              className={
                isDark
                  ? "text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200"
                  : "text-xs font-semibold uppercase tracking-[0.22em] text-sky-700"
              }
            >
              {t("pipeline")}
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-4">
              {[
                {
                  label: t("activeApplications"),
                  value: visibleApplications.filter((item) => isActiveCandidateApplicationStatus(item.status)).length,
                },
                {
                  label: t("inReview"),
                  value: visibleApplications.filter((item) => getApplicationVisibleGroup(item.status) === "revision").length,
                },
                {
                  label: t("decision"),
                  value: visibleApplications.filter((item) => getApplicationVisibleGroup(item.status) === "decision").length,
                },
                {
                  label: t("savedJobs"),
                  value: archivedApplications.length,
                  expandable: true,
                },
              ].map((item) => (
                <article
                  key={item.label}
                  className={
                    isDark
                      ? "rounded-[1.3rem] border border-white/8 bg-white/4 p-4"
                      : "rounded-[1.3rem] border border-slate-300 bg-slate-50/90 p-4"
                  }
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className={isDark ? "text-3xl font-semibold text-white" : "text-3xl font-semibold text-slate-950"}>
                      {item.value}
                    </p>
                    {"expandable" in item && item.expandable ? (
                      <button
                        type="button"
                        onClick={() => setHistoryOpen(true)}
                        className={
                          isDark
                            ? "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/4 text-slate-100"
                            : "inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700"
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {visibleApplications.length === 0 ? (
            <RoleEmptyState
              isDark={isDark}
              eyebrow={t("eyebrow")}
              title={t("emptyTitle")}
              copy={t("emptyCopy")}
              primaryHref="/vacantes"
              primaryLabel={t("exploreJobs")}
            />
          ) : (
            <section className="grid gap-4">
              {visibleApplications.map((application) => (
                <article
                  key={application.id}
                  className={
                    isDark
                      ? "rounded-[1.6rem] border border-white/8 bg-white/4 p-5"
                      : "rounded-[1.6rem] border border-slate-300 bg-white/92 p-5"
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className={isDark ? "text-xl font-semibold text-white" : "text-xl font-semibold text-slate-950"}>
                        {application.title}
                      </p>
                      <p className={isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-600"}>
                        {application.companyName} · {application.location} · {application.modality}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getCandidateApplicationTone(application.status)}`}
                    >
                      {getCandidateApplicationVisibleGroupLabel(
                        getApplicationVisibleGroup(application.status),
                        isEnglish,
                      )}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{t("applied")}</p>
                      <p className={isDark ? "mt-1 text-sm text-slate-200" : "mt-1 text-sm text-slate-700"}>
                        {formatLocalizedDate(application.appliedAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{t("status")}</p>
                      <p className={isDark ? "mt-1 text-sm text-slate-200" : "mt-1 text-sm text-slate-700"}>
                        {getCandidateApplicationStatusLabel(application.status, isEnglish)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{t("fit")}</p>
                      <p className={isDark ? "mt-1 text-sm text-slate-200" : "mt-1 text-sm text-slate-700"}>
                        {application.fitLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{t("history")}</p>
                      <p className={isDark ? "mt-1 text-sm text-slate-200" : "mt-1 text-sm text-slate-700"}>
                        {t("historyUpdated")} {formatLocalizedDate(application.lastUpdatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {canWithdrawCandidateApplication(application.status) ? (
                      <>
                        <button
                          type="button"
                          onClick={() => advanceApplication(application.id)}
                          className="ts-action-primary inline-flex items-center gap-2 rounded-[1rem] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                        >
                          <Clock3 className="h-4 w-4" />
                          {t("simulateNextStatus")}
                        </button>
                        {confirmWithdrawId === application.id ? (
                          <div
                            className={
                              isDark
                                ? "inline-flex items-center gap-2 rounded-[1rem] border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-50"
                                : "inline-flex items-center gap-2 rounded-[1rem] border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900"
                            }
                          >
                            <RotateCcw className="h-4 w-4" />
                            <span>{isEnglish ? "Confirm?" : "¿Confirmar?"}</span>
                            <button
                              type="button"
                              onClick={() => handleWithdrawApplication(application.id)}
                              disabled={withdrawingId === application.id}
                              className={
                                isDark
                                  ? "rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-300"
                                  : "rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                              }
                            >
                              {isEnglish ? "Yes" : "Sí"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmWithdrawId(null)}
                              disabled={withdrawingId === application.id}
                              className={
                                isDark
                                  ? "rounded-full border border-white/12 px-3 py-1 text-xs font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                                  : "rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                              }
                            >
                              {isEnglish ? "No" : "No"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmWithdrawId(application.id)}
                            className={
                              isDark
                                ? "ts-action-secondary inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-semibold text-slate-100"
                                : "ts-action-secondary inline-flex items-center gap-2 rounded-[1rem] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                            }
                          >
                            <RotateCcw className="h-4 w-4" />
                            {t("withdrawApplication")}
                          </button>
                        )}
                      </>
                    ) : null}
                    {vacanciesById.get(application.jobId) ? (
                      <button
                        type="button"
                        onClick={() => setSelectedPosting(vacanciesById.get(application.jobId) ?? null)}
                        className={
                          isDark
                            ? "ts-action-secondary inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-semibold text-slate-100"
                            : "ts-action-secondary inline-flex items-center gap-2 rounded-[1rem] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                        }
                      >
                        <FileText className="h-4 w-4" />
                        {isEnglish ? "View posting" : "Ver publicación"}
                      </button>
                    ) : null}
                    <Link
                      href={buildSimilarJobsHref(application)}
                      className={
                        isDark
                          ? "ts-action-secondary inline-flex items-center gap-2 rounded-[1rem] border border-cyan-300/20 bg-cyan-300/10 px-4 py-2.5 text-sm font-semibold text-cyan-100"
                          : "ts-action-secondary inline-flex items-center gap-2 rounded-[1rem] border border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700"
                      }
                    >
                      <FileText className="h-4 w-4" />
                      {t("viewSimilarJobs")}
                    </Link>
                  </div>
                </article>
              ))}
            </section>
          )}

          {!savedVacanciesLoading && savedVacancies.length > 0 ? (
            <section
              className={
                isDark
                  ? "rounded-[1.6rem] border border-white/8 bg-white/4 p-5"
                  : "rounded-[1.6rem] border border-slate-300 bg-white/92 p-5"
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className={isDark ? "text-lg font-semibold text-white" : "text-lg font-semibold text-slate-950"}>
                    {t("savedSectionTitle")}
                  </h2>
                </div>
                <Link
                  href="/guardado"
                  className={
                    isDark
                      ? "inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-semibold text-slate-100"
                      : "inline-flex items-center gap-2 rounded-[1rem] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                  }
                >
                  {isEnglish ? "Open saved list" : "Abrir guardado"}
                </Link>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(savedOnly ? savedVacancies : savedVacancies.slice(0, 2)).map((job) => (
                  <div
                    key={job.id}
                    className={
                      isDark
                        ? "rounded-[1.1rem] border border-white/8 bg-white/3 px-4 py-3"
                        : "rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3"
                    }
                  >
                    <p className={isDark ? "font-medium text-white" : "font-medium text-slate-900"}>
                      {getLocalizedVacancyTitle(job, isEnglish)}
                    </p>
                    <p className={isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-600"}>
                      {job.empresa ?? common("companyFallback")} · {job.ubicacion ?? common("colombia")}
                    </p>
                    <p className={isDark ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-500"}>
                      {job.modalidad} · {job.salario || t("salaryPending")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPosting(job)}
                        className={
                          isDark
                            ? "inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100"
                            : "inline-flex items-center gap-2 rounded-full border border-sky-300 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700"
                        }
                      >
                        {t("openJobBoard")}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSave(job.id)}
                        className={
                          isDark
                            ? "inline-flex items-center gap-2 rounded-full border border-rose-300/18 bg-rose-400/10 px-3 py-1.5 text-xs font-semibold text-rose-100"
                            : "inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700"
                        }
                      >
                        <BookmarkMinus className="h-3.5 w-3.5" />
                        {t("removeSaved")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <ApplicationVacancyPreviewModal
            open={Boolean(selectedPosting)}
            isDark={isDark}
            isEnglish={isEnglish}
            selectedJob={selectedPosting}
            onClose={() => setSelectedPosting(null)}
          />
          {historyOpen ? (
            <div
              className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/60 px-4"
              onClick={() => setHistoryOpen(false)}
            >
              <div
                className={
                  isDark
                    ? "w-full max-w-3xl rounded-[1.6rem] border border-white/10 bg-[#081120] p-5"
                    : "w-full max-w-3xl rounded-[1.6rem] border border-slate-300 bg-white p-5"
                }
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className={isDark ? "text-lg font-semibold text-white" : "text-lg font-semibold text-slate-950"}>
                      {isEnglish
                        ? "Deleted or rejected in the last 30 days"
                        : "Eliminadas o rechazadas en los últimos 30 días"}
                    </h3>
                    <p className={isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-600"}>
                      {isEnglish
                        ? "This history stays available for one month."
                        : "Este historial se mantiene disponible durante un mes."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHistoryOpen(false)}
                    className={
                      isDark
                        ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4 text-slate-100"
                        : "inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700"
                    }
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {archivedApplications.length > 0 ? (
                    archivedApplications.map((application) => (
                      <article
                        key={application.id}
                        className={
                          isDark
                            ? "rounded-[1rem] border border-white/8 bg-white/3 p-4"
                            : "rounded-[1rem] border border-slate-200 bg-slate-50 p-4"
                        }
                      >
                        <p className={isDark ? "font-semibold text-white" : "font-semibold text-slate-900"}>
                          {application.title}
                        </p>
                        <p className={isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-600"}>
                          {application.companyName} ·{" "}
                          {getCandidateApplicationStatusLabel(application.status, isEnglish)}
                        </p>
                        <p className={isDark ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-500"}>
                          {formatLocalizedDate(application.lastUpdatedAt)}
                        </p>
                      </article>
                    ))
                  ) : (
                    <p className={isDark ? "text-sm text-slate-300" : "text-sm text-slate-600"}>
                      {isEnglish
                        ? "No deleted or rejected applications in the last 30 days."
                        : "No hay postulaciones eliminadas o rechazadas en los últimos 30 días."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </RoleRouteGuard>
  );
}
