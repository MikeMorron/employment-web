"use client";

import { useState } from "react";
import { BookMarked, BookmarkMinus } from "lucide-react";
import { ApplicationVacancyPreviewModal } from "@/frontend/usuario/components/applications/application-vacancy-preview-modal";
import { RoleEmptyState } from "@/compartido/components/role/role-empty-state";
import { MiniPageNav } from "@/compartido/components/ui/mini-page-nav";
import { GlobalLoadingScreen } from "@/compartido/components/ui/global-loading-screen";
import { useAppLanguage } from "@/compartido/hooks/use-app-language";
import { useAuthUser } from "@/compartido/hooks/use-auth-user";
import { useCandidateApplications } from "@/hooks/use-candidate-applications";
import { usePreviewSelection } from "@/compartido/hooks/use-preview-selection";
import { useUiCopy } from "@/compartido/lib/i18n/ui-copy";
import { getLocalizedVacancyTitle } from "@/compartido/lib/vacancy-localization";
import { useVacancyTheme } from "@/compartido/theme/use-vacancy-theme";
import { useSavedVacancies } from "@/frontend/usuario/hooks/use-saved-vacancies";
import type { Vacancy } from "@/compartido/types/vacancy";

export default function GuardadoUsuarioPage() {
  const { isDark, themeReady, toggleTheme } = useVacancyTheme();
  const { isEnglish } = useAppLanguage();
  const t = useUiCopy("savedPage");
  const common = useUiCopy("common");
  const { authUser, authLoading } = useAuthUser();
  const { savedVacancies, savedVacanciesLoading, toggleSave } = useSavedVacancies();
  const { selected, hasSelection, openPreview, closePreview } = usePreviewSelection<Vacancy>();
  const candidateViewer = authUser?.role === "candidate" ? authUser : null;
  const { applicationsByJobId, applyToJob } = useCandidateApplications(candidateViewer);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  async function handleApply(job: Vacancy) {
    if (applicationsByJobId[job.id] || applyingJobId) {
      setFeedback(isEnglish ? "You already applied to this vacancy." : "Ya te postulaste a esta vacante.");
      return;
    }

    setApplyingJobId(job.id);
    const result = await applyToJob(job);
    setApplyingJobId(null);
    if (typeof result === "string") {
      setFeedback(result);
      return;
    }
    setFeedback(
      result
        ? isEnglish
          ? "Application sent."
          : "Postulación enviada."
        : isEnglish
          ? "The application could not be sent."
          : "No se pudo enviar la postulación.",
    );
  }

  if (authLoading || !authUser || authUser.role !== "candidate" || savedVacanciesLoading) {
    return <GlobalLoadingScreen />;
  }

  return (
    <main className={`min-h-screen px-5 py-10 ${isDark ? "vacancies-shell text-[#eef6ff]" : "vacancies-shell-light text-slate-900"} ${themeReady ? "" : "invisible"}`}>
      <div className="mx-auto max-w-6xl space-y-6">
        <MiniPageNav isDark={isDark} onToggleTheme={toggleTheme} />

        <section className={isDark ? "rounded-[1.8rem] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(7,16,31,0.94),rgba(8,17,32,0.90))] p-6" : "rounded-[1.8rem] border border-slate-300 bg-white/92 p-6"}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <h1 className={isDark ? "text-3xl font-semibold text-white" : "text-3xl font-semibold text-slate-950"}>
                {t("candidateTitle")}
              </h1>
              <p className={isDark ? "mt-3 text-sm leading-7 text-slate-300" : "mt-3 text-sm leading-7 text-slate-600"}>
                {t("candidateCopy")}
              </p>
            </div>
            <span className={isDark ? "inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100" : "inline-flex items-center gap-2 rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700"}>
              <BookMarked className="h-4.5 w-4.5" />
              {savedVacancies.length}
            </span>
          </div>
        </section>

        {savedVacancies.length === 0 ? (
          <RoleEmptyState
            isDark={isDark}
            eyebrow={t("eyebrow")}
            title={t("emptyCandidateTitle")}
            copy={t("emptyCandidateCopy")}
            primaryHref="/vacantes"
            primaryLabel={t("exploreJobs")}
          />
        ) : (
          <section className="space-y-4">
            {savedVacancies.map((job) => (
              <article
                key={job.id}
                className={
                  isDark
                    ? "rounded-[1.6rem] border border-white/8 bg-white/4 p-5"
                    : "rounded-[1.6rem] border border-slate-300 bg-white/92 p-5"
                }
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className={isDark ? "text-lg font-semibold text-white" : "text-lg font-semibold text-slate-950"}>
                      {getLocalizedVacancyTitle(job, isEnglish)}
                    </p>
                    <p className={isDark ? "mt-2 text-sm text-slate-300" : "mt-2 text-sm text-slate-600"}>
                      {job.empresa ?? common("companyFallback")} · {job.ubicacion ?? common("colombia")}
                    </p>
                    <p className={isDark ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-500"}>
                      {job.modalidad ?? t("modalityPending")} · {job.salario ?? t("salaryPending")}
                    </p>
                    <p className={isDark ? "mt-3 text-sm leading-6 text-slate-300" : "mt-3 text-sm leading-6 text-slate-700"}>
                      {job.descripcion}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-3 lg:w-auto lg:flex-col">
                    <button
                      type="button"
                      onClick={() => openPreview(job)}
                      className="ts-action-primary inline-flex items-center justify-center gap-2 rounded-[1rem] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      {t("openBoard")}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSave(job.id)}
                      className={isDark ? "inline-flex items-center justify-center gap-2 rounded-[1rem] border border-rose-300/18 bg-rose-400/10 px-4 py-2.5 text-sm font-semibold text-rose-100" : "inline-flex items-center justify-center gap-2 rounded-[1rem] border border-rose-300 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700"}
                    >
                      <BookmarkMinus className="h-4 w-4" />
                      {t("removeSaved")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
        {feedback ? (
          <div className={isDark ? "rounded-[1.2rem] border border-emerald-300/18 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100" : "rounded-[1.2rem] border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"}>
            {feedback}
          </div>
        ) : null}
      </div>
      <ApplicationVacancyPreviewModal
        open={hasSelection}
        isDark={isDark}
        isEnglish={isEnglish}
        selectedJob={selected}
        primaryActionLabel={
          selected && applicationsByJobId[selected.id]
            ? isEnglish
              ? "Applied"
              : "Postulada"
            : applyingJobId === selected?.id
              ? isEnglish
                ? "Applying..."
                : "Postulando..."
              : isEnglish
                ? "Apply"
                : "Postularme"
        }
        primaryActionDisabled={Boolean(selected && (applicationsByJobId[selected.id] || applyingJobId === selected.id))}
        onPrimaryAction={handleApply}
        onClose={closePreview}
      />
    </main>
  );
}
