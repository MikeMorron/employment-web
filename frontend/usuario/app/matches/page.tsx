"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { MatchBreakdown } from "@/components/matching/match-breakdown";
import { MatchesVacancyDetailModal } from "@/components/matching/matches-vacancy-detail-modal";
import { MatchSummaryCard } from "@/components/matching/match-summary-card";
import { RoleRouteGuard } from "@/components/role/role-route-guard";
import { MiniPageNav } from "@/components/ui/mini-page-nav";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useCandidateApplications } from "@/hooks/use-candidate-applications";
import { getOccupationTerms } from "@/components/vacancies/job-dashboard-utils";
import {
  DEFAULT_CANDIDATE_ADVICE_MINIMUM_SCORE,
  getCandidateFocusCategories,
  getCandidateRoleFallback,
  getCandidateSkillSignals,
} from "@/lib/candidate-advice";
import { useUiCopy } from "@/lib/i18n/ui-copy";
import {
  canCandidateAccessVacancy,
  getCandidatePlanFeatures,
  getPlanAwareCandidateMatchResult,
} from "@/lib/candidate-plan";
import { useVacancyFeed } from "@/hooks/use-vacancy-feed";
import { getCandidateJobMatch } from "@/lib/matching";
import { useVacancyTheme } from "@/hooks/use-vacancy-theme";
import { getVacancyFilterCategory, normalizeVacancyCategoryValue } from "@/lib/vacancy-category";
import { getLocalizedVacancyTitle } from "@/lib/vacancy-localization";
import { getVacancyPresenter } from "@/lib/vacancy-presenters";
import { getVacancyLocationLabel } from "@/lib/vacancy-ui";
import {
  MATCHES_MIN_SCORE_KEY,
  MATCHES_MIN_SCORE_KEYS,
  APPLICATION_STATUS_AUTO_CLOSE_EVENT,
  APPLICATION_STATUS_AUTO_CLOSE_KEYS,
  VERIFIED_COMPANIES_ONLY_KEYS,
  readFirstStorageValue,
} from "@/lib/app-runtime";
import { isVerifiedCompanyVacancy } from "@/lib/vacancy-filters";
import type { Vacancy } from "@/types/vacancy";
import type { User } from "@/types/user";
import { canWithdrawCandidateApplication } from "@/lib/application-status";

const INITIAL_MATCHES_TO_SHOW = 10;
const MATCHES_PAGE_STEP = 10;
const PROFILE_FALLBACK_MATCHES_LIMIT = 6;

function normalizeValue(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesCandidateFocusCategory(candidate: User | null, job: Vacancy) {
  const focusCategories = getCandidateFocusCategories(candidate);

  if (focusCategories.length === 0) {
    return false;
  }

  const vacancyCategory = getVacancyFilterCategory(job);
  const normalizedVacancyCategory = vacancyCategory
    ? normalizeVacancyCategoryValue(vacancyCategory)
    : "";
  const haystack = [
    job.titulo,
    job.descripcion,
    job.descripcionCompleta,
    ...(job.etiquetas ?? []),
  ]
    .filter(Boolean)
    .map((value) => normalizeVacancyCategoryValue(String(value)))
    .join(" ");

  return focusCategories.some((focusCategory) => {
    const normalizedFocusCategory = normalizeVacancyCategoryValue(focusCategory);

    return (
      normalizedVacancyCategory === normalizedFocusCategory ||
      haystack.includes(normalizedFocusCategory)
    );
  });
}

function matchesCandidateRoleFallback(candidate: User | null, job: Vacancy) {
  const roleFallback = getCandidateRoleFallback(candidate);
  if (!roleFallback) {
    return false;
  }

  const roleTerms = getOccupationTerms(roleFallback);
  if (roleTerms.length === 0) {
    return false;
  }

  const haystack = [
    job.titulo,
    job.descripcion,
    job.descripcionCompleta,
    ...(job.etiquetas ?? []),
  ]
    .filter(Boolean)
    .map((value) => normalizeVacancyCategoryValue(String(value)))
    .join(" ");

  return roleTerms.some((term) => haystack.includes(normalizeVacancyCategoryValue(term)));
}

function matchesCandidateSkillSignals(candidate: User | null, job: Vacancy) {
  const skillSignals = getCandidateSkillSignals(candidate);

  if (skillSignals.length === 0) {
    return false;
  }

  const haystack = [
    job.titulo,
    job.descripcion,
    job.descripcionCompleta,
    ...(job.etiquetas ?? []),
  ]
    .filter(Boolean)
    .map((value) => normalizeVacancyCategoryValue(String(value)))
    .join(" ");

  return skillSignals.some((skill) => haystack.includes(normalizeVacancyCategoryValue(skill)));
}

function isOutsideCandidateArea(candidate: User | null, job: Vacancy) {
  if (!candidate) {
    return false;
  }

  const normalizedLocation = normalizeValue(getVacancyLocationLabel(job.ubicacion) ?? job.ubicacion);
  const normalizedModality = normalizeValue(job.modalidad);

  if (!normalizedLocation || normalizedLocation === "remoto" || normalizedModality === "remoto") {
    return false;
  }

  const preferredLocations = [
    candidate.ubicacion,
    candidate.locationProfile?.city,
    candidate.locationProfile?.region,
    ...(candidate.workPreferences?.preferredLocations ?? []),
  ]
    .map((value) => normalizeValue(typeof value === "string" ? value : null))
    .filter(Boolean);

  if (preferredLocations.length === 0) {
    return false;
  }

  return preferredLocations.every(
    (location) => !normalizedLocation.includes(location) && !location.includes(normalizedLocation),
  );
}

export default function MatchesPage() {
  const { isDark, themeReady, toggleTheme } = useVacancyTheme();
  const { authUser } = useAuthUser();
  const { isEnglish } = useAppLanguage();
  const t = useUiCopy("matches");
  const [selectedJob, setSelectedJob] = useState<Vacancy | null>(null);
  const [minimumVisibleScore, setMinimumVisibleScore] = useState(() => {
    if (typeof window === "undefined") {
      return DEFAULT_CANDIDATE_ADVICE_MINIMUM_SCORE;
    }

    const raw = readFirstStorageValue(window.localStorage, MATCHES_MIN_SCORE_KEYS);
    const parsed = Number(raw);

    if (!Number.isFinite(parsed)) {
      return DEFAULT_CANDIDATE_ADVICE_MINIMUM_SCORE;
    }

    return Math.max(0, Math.min(100, Math.round(parsed)));
  });
  const [verifiedCompaniesOnly] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return readFirstStorageValue(window.localStorage, VERIFIED_COMPANIES_ONLY_KEYS) === "true";
  });
  const [visibleMatchesCount, setVisibleMatchesCount] = useState(INITIAL_MATCHES_TO_SHOW);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [applicationNotice, setApplicationNotice] = useState("");
  const [applicationNoticeAutoClose, setApplicationNoticeAutoClose] = useState(true);
  const [applicationStatusAutoCloseActive, setApplicationStatusAutoCloseActive] = useState(false);
  const [applicationStatusClosing, setApplicationStatusClosing] = useState(false);
  const applicationStatusFadeTimeoutRef = useRef<number | null>(null);
  const applicationStatusCloseTimeoutRef = useRef<number | null>(null);
  const candidate = authUser?.role === "candidate" ? authUser : null;
  const focusCategories = useMemo(() => getCandidateFocusCategories(candidate), [candidate]);
  const roleFallback = useMemo(() => getCandidateRoleFallback(candidate), [candidate]);
  const { vacancies } = useVacancyFeed(
    candidate ? `vacancy-feed:${candidate.id}` : "vacancy-feed:guest",
  );
  const {
    applications,
    applicationsByJobId,
    applyToJob,
    withdrawApplication,
  } = useCandidateApplications(candidate);
  const selectedApplication =
    selectedApplicationId
      ? applications.find((application) => application.id === selectedApplicationId) ?? null
      : null;
  const candidatePlanFeatures = candidate ? getCandidatePlanFeatures(candidate) : null;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const readPreference = () => {
      const storedValue = readFirstStorageValue(window.localStorage, APPLICATION_STATUS_AUTO_CLOSE_KEYS);
      setApplicationNoticeAutoClose(storedValue !== "false");
    };

    readPreference();
    window.addEventListener("storage", readPreference);
    window.addEventListener(APPLICATION_STATUS_AUTO_CLOSE_EVENT, readPreference);

    return () => {
      window.removeEventListener("storage", readPreference);
      window.removeEventListener(APPLICATION_STATUS_AUTO_CLOSE_EVENT, readPreference);
    };
  }, []);

  useEffect(() => {
    if (applicationStatusFadeTimeoutRef.current) {
      window.clearTimeout(applicationStatusFadeTimeoutRef.current);
      applicationStatusFadeTimeoutRef.current = null;
    }

    if (applicationStatusCloseTimeoutRef.current) {
      window.clearTimeout(applicationStatusCloseTimeoutRef.current);
      applicationStatusCloseTimeoutRef.current = null;
    }

    if (!selectedApplication || !applicationNoticeAutoClose || !applicationStatusAutoCloseActive) {
      return;
    }

    applicationStatusFadeTimeoutRef.current = window.setTimeout(() => {
      setApplicationStatusClosing(true);
    }, 9700);

    applicationStatusCloseTimeoutRef.current = window.setTimeout(() => {
      setSelectedApplicationId(null);
      setApplicationStatusAutoCloseActive(false);
      setApplicationStatusClosing(false);
      applicationStatusCloseTimeoutRef.current = null;
    }, 10000);

    return () => {
      if (applicationStatusFadeTimeoutRef.current) {
        window.clearTimeout(applicationStatusFadeTimeoutRef.current);
        applicationStatusFadeTimeoutRef.current = null;
      }

      if (applicationStatusCloseTimeoutRef.current) {
        window.clearTimeout(applicationStatusCloseTimeoutRef.current);
        applicationStatusCloseTimeoutRef.current = null;
      }
    };
  }, [applicationNoticeAutoClose, applicationStatusAutoCloseActive, selectedApplication]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(MATCHES_MIN_SCORE_KEY, String(minimumVisibleScore));
    } catch {
      // ignore storage failures
    }
  }, [minimumVisibleScore]);

  const rankedMatches = useMemo(() => {
    if (!candidate) {
      return [];
    }

    const accessibleVacancies = vacancies.filter((job) => canCandidateAccessVacancy(candidate, job));
    const candidateVisibleVacancies = verifiedCompaniesOnly
      ? accessibleVacancies.filter(isVerifiedCompanyVacancy)
      : accessibleVacancies;
    const focusMatches =
      focusCategories.length > 0
        ? candidateVisibleVacancies.filter((job) => matchesCandidateFocusCategory(candidate, job))
        : [];
    const roleMatches = candidateVisibleVacancies.filter((job) => matchesCandidateRoleFallback(candidate, job));
    const skillMatches = candidateVisibleVacancies.filter((job) => matchesCandidateSkillSignals(candidate, job));

    const targetVacancies =
      focusMatches.length > 0
        ? focusMatches
        : roleMatches.length > 0
          ? roleMatches
          : skillMatches.length > 0
            ? skillMatches
            : candidateVisibleVacancies;

    return targetVacancies
      .map((job) => {
        const match = getCandidateJobMatch(candidate, job, {
          ranking: {
            metadata: {
              isPublishedRecently: (job.diasDesdePublicacion ?? 999) <= 14,
              isEntityActive: true,
              isRecentlyActive: true,
              profileCompleteness:
                [job.descripcion, job.ubicacion, job.salario || job.salarioMinimoMillones, job.modalidad]
                  .filter(Boolean)
                  .length / 4,
            },
            candidate,
            surface: "candidate_matches",
          },
        });

        return {
          job,
          match: getPlanAwareCandidateMatchResult(match, candidate),
          rankScore: match.rankingScore,
          outsideArea: isOutsideCandidateArea(candidate, job),
        };
      })
      .sort((a, b) => b.rankScore - a.rankScore);
  }, [candidate, focusCategories, vacancies, verifiedCompaniesOnly]);

  const primaryMatches = useMemo(
    () =>
      rankedMatches.filter(
        ({ match, outsideArea }) => match.visibleScore >= minimumVisibleScore && !outsideArea,
      ),
    [minimumVisibleScore, rankedMatches],
  );

  const fallbackPrimaryMatches = useMemo(
    () =>
      rankedMatches
        .filter(({ outsideArea }) => !outsideArea)
        .slice(0, PROFILE_FALLBACK_MATCHES_LIMIT),
    [rankedMatches],
  );

  const shouldUseFallbackMatches =
    minimumVisibleScore === DEFAULT_CANDIDATE_ADVICE_MINIMUM_SCORE && primaryMatches.length === 0;

  const displayPrimaryMatches = shouldUseFallbackMatches ? fallbackPrimaryMatches : primaryMatches;

  const visiblePrimaryMatches = displayPrimaryMatches.slice(0, visibleMatchesCount);
  const selectedJobMatch =
    selectedJob && candidate
      ? rankedMatches.find((item) => item.job.id === selectedJob.id)?.match ?? null
      : null;
  if (!authUser) {
    return null;
  }

  const hasFocusCategories = focusCategories.length > 0;
  const isUsingFallbackMatches = shouldUseFallbackMatches && displayPrimaryMatches.length > 0;

  const openJobDetails = (job: Vacancy) => {
    setSelectedJob(job);
  };

  const closeJobDetails = () => {
    setSelectedJob(null);
  };

  const openApplicationDetails = (job: Vacancy) => {
    const application = applicationsByJobId[job.id];
    if (!application) {
      return;
    }

    setApplicationStatusAutoCloseActive(false);
    setApplicationStatusClosing(false);
    setSelectedApplicationId(application.id);
  };

  const closeApplicationDetails = () => {
    setApplicationStatusAutoCloseActive(false);
    setApplicationStatusClosing(false);
    setSelectedApplicationId(null);
  };

  const handleApplyJob = async (job: Vacancy) => {
    if (!candidate || applyingJobId) {
      return;
    }

    const activeApplication = applicationsByJobId[job.id];
    if (activeApplication) {
      setApplicationStatusAutoCloseActive(false);
      setSelectedApplicationId(activeApplication.id);
      return;
    }

    setApplyingJobId(job.id);
    const applied = await applyToJob(job);
    setApplyingJobId(null);

    if (applied && typeof applied === "object" && "id" in applied) {
      setApplicationNotice("");
      setApplicationStatusClosing(false);
      setApplicationStatusAutoCloseActive(true);
      setSelectedApplicationId(applied.id);
      return;
    }

    if (typeof applied === "string") {
      setApplicationNotice(applied);
      return;
    }
  };

  const handleWithdrawApplication = (job: Vacancy) => {
    const application = applicationsByJobId[job.id];
    if (!application || !canWithdrawCandidateApplication(application.status)) {
      return;
    }

    withdrawApplication(application.id);
    setApplicationStatusAutoCloseActive(false);
    setSelectedApplicationId(null);
  };

  const renderMatchCard = (
    {
      job,
      match,
      outsideArea,
    }: {
      job: Vacancy;
      match: ReturnType<typeof getPlanAwareCandidateMatchResult>;
      outsideArea: boolean;
    },
    badgeLabel: string,
  ) => {
    const presenter = getVacancyPresenter(job);

    return (
      <article
        key={job.id}
        className={isDark ? "rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "rounded-[1.6rem] border border-slate-300 bg-white/92 p-5"}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200" : "text-xs font-semibold uppercase tracking-[0.18em] text-sky-700"}>
              {badgeLabel}
            </p>
            <h2 className={isDark ? "mt-2 text-xl font-semibold text-white" : "mt-2 text-xl font-semibold text-slate-950"}>
              {getLocalizedVacancyTitle(job, isEnglish)}
            </h2>
            <p className={isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-600"}>
              {presenter.primaryName ?? t("publishedOpportunity")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={isDark ? "rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-slate-200" : "rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-700"}>
              {job.ubicacion}
            </span>
            {outsideArea ? (
              <span className={isDark ? "rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-100" : "rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700"}>
                {isEnglish ? "Outside your core area" : "Fuera de tu zona principal"}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-4">
          <MatchSummaryCard
            isDark={isDark}
            isEnglish={isEnglish}
            result={match}
            showRankingExplanation
          />
        </div>

        {candidatePlanFeatures?.showInsights ? (
          <div className="mt-3">
            <MatchBreakdown isDark={isDark} isEnglish={isEnglish} result={match} />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => openJobDetails(job)}
            className="ts-action-primary inline-flex items-center gap-2 rounded-[1rem] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            {t("openVacancy")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </article>
    );
  };

  return (
    <RoleRouteGuard allowedRole="candidate">
      <main className={`min-h-screen px-5 py-10 ${isDark ? "vacancies-shell text-[#eef6ff]" : "vacancies-shell-light text-slate-900"} ${themeReady ? "" : "invisible"}`}>
        <div className="mx-auto max-w-6xl space-y-6">
          <MiniPageNav isDark={isDark} onToggleTheme={toggleTheme} />
          {applicationNotice ? (
            <div className={isDark ? "rounded-[1.2rem] border border-amber-300/18 bg-amber-400/10 px-4 py-3 text-sm text-amber-100" : "rounded-[1.2rem] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"}>
              {applicationNotice}
            </div>
          ) : null}

          <section className={isDark ? "rounded-[1.8rem] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(7,16,31,0.94),rgba(8,17,32,0.90))] p-6" : "rounded-[1.8rem] border border-slate-300 bg-white/92 p-6"}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200" : "text-xs font-semibold uppercase tracking-[0.22em] text-sky-700"}>
                  {t("eyebrow")}
                </p>
                <h1 className={isDark ? "mt-3 text-3xl font-semibold text-white" : "mt-3 text-3xl font-semibold text-slate-950"}>
                  {t("title")}
                </h1>
                <p className={isDark ? "mt-3 max-w-3xl text-sm leading-7 text-slate-300" : "mt-3 max-w-3xl text-sm leading-7 text-slate-700"}>
                  {isEnglish
                    ? "Here you will see opportunities aligned with your profile, expected salary, location, and work mode recommended by the platform."
                    : "Aquí verás las oportunidades que alinean con tu perfil, salario esperado, ubicación y modalidad recomendados por la plataforma."}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.3rem] border border-white/8 bg-white/4 px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">

                <span className={isDark ? "rounded-full border border-cyan-300/16 bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-100" : "rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700"}>
                  {minimumVisibleScore}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={minimumVisibleScore}
                onChange={(event) => {
                  setMinimumVisibleScore(Number(event.target.value));
                  setVisibleMatchesCount(INITIAL_MATCHES_TO_SHOW);
                }}
                className="mt-4 h-2 w-full cursor-pointer accent-sky-500"
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className={isDark ? "text-2xl font-semibold text-white" : "text-2xl font-semibold text-slate-950"}>
                  {isUsingFallbackMatches
                    ? isEnglish
                      ? "Closest matches with your current profile"
                      : "Coincidencias más cercanas con tu perfil actual"
                    : isEnglish
                      ? "Matches inside your core area"
                      : "Coincidencias dentro de tu zona objetivo"}
                </h2>
                <p className={isDark ? "mt-2 text-sm text-slate-300" : "mt-2 text-sm text-slate-700"}>
                  {isUsingFallbackMatches
                    ? isEnglish
                      ? "Nothing is above your current threshold, so we keep your best available matches visible."
                      : "Nada supera tu umbral actual, así que mantenemos visibles tus mejores coincidencias disponibles."
                    : isEnglish
                      ? `${displayPrimaryMatches.length} opportunities pass your current threshold.`
                      : `${displayPrimaryMatches.length} oportunidades superan tu umbral actual.`}
                </p>
              </div>
              <span className={isDark ? "rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-slate-300" : "rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700"}>
                {visiblePrimaryMatches.length}/{displayPrimaryMatches.length}
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {visiblePrimaryMatches.map((item) =>
                renderMatchCard(item, isEnglish ? "Recommended match" : "Coincidencia recomendada"),
              )}
            </div>

            {displayPrimaryMatches.length > visibleMatchesCount ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleMatchesCount((current) => current + MATCHES_PAGE_STEP)}
                  className={isDark ? "inline-flex items-center gap-2 rounded-[1rem] border border-cyan-300/18 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14" : "inline-flex items-center gap-2 rounded-[1rem] border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"}
                >
                  {isEnglish ? "View more matches" : "Ver más coincidencias"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </section>

        </div>

        <MatchesVacancyDetailModal
          key={selectedJob?.id ?? "matches-vacancy-detail-closed"}
          open={Boolean(selectedJob)}
          isDark={isDark}
          isEnglish={isEnglish}
          selectedJob={selectedJob}
          selectedJobMatch={selectedJobMatch}
          candidatePlanFeatures={candidatePlanFeatures}
          applyingJobId={applyingJobId}
          selectedApplication={selectedApplication}
          selectedApplicationRecord={selectedJob ? applicationsByJobId[selectedJob.id] : undefined}
          applicationStatusAutoClose={applicationNoticeAutoClose && applicationStatusAutoCloseActive}
          applicationStatusClosing={applicationStatusClosing}
          onOpenApplication={openApplicationDetails}
          onApply={handleApplyJob}
          onWithdraw={handleWithdrawApplication}
          onCloseApplication={closeApplicationDetails}
          onClose={closeJobDetails}
        />
      </main>
    </RoleRouteGuard>
  );
}
