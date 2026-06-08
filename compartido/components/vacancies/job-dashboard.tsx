"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, Bookmark, Building2, ChevronLeft, ChevronRight, ExternalLink, MapPin, Menu, Search, UserRound, X } from "lucide-react";

import {
  colombiaDepartments,
  colombiaMunicipalities,
  vacancyCategoriesByLocale,
} from "@/data/colombia-locations";
import { BackgroundEffects } from "@/components/vacancies/background-effects";
import { LoginModal } from "@/components/auth/login-modal";
import { ApplicationStatusDialog } from "@/components/vacancies/application-status-dialog";
import { JobDetailActions } from "@/components/vacancies/job-detail-actions";
import {
  buildCompanySummaryView,
  CompanySummaryModalSection,
} from "@/components/vacancies/company-summary-modal-section";
import { CompanyMenuSheet } from "@/components/vacancies/company-menu-sheet";
import { JobDashboardFilters } from "@/components/vacancies/job-dashboard-filters";
import { MatchBreakdown } from "@/components/matching/match-breakdown";
import { MatchSummaryCard } from "@/components/matching/match-summary-card";
import { NotificationCenterModal } from "@/components/notifications/notification-center-modal";
import { JobGrid } from "@/components/vacancies/job-grid";
import { canWithdrawCandidateApplication } from "@/lib/application-status";
import { useCategoryInterest } from "@/hooks/use-category-interest";
import { useCompanyJobs } from "@/hooks/use-company-jobs";
import { useCandidateApplications } from "@/hooks/use-candidate-applications";
import { useVacancyFeed } from "@/hooks/use-vacancy-feed";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useNotifications } from "@/hooks/use-notifications";
import { useCompanyFavoriteCandidates } from "@/hooks/use-company-favorite-candidates";
import { useJobDashboardFeed } from "@/hooks/use-job-dashboard-feed";
import { useSavedVacancies } from "@/hooks/use-saved-vacancies";
import { useVacancyTheme } from "@/hooks/use-vacancy-theme";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { useUiCopy } from "@/lib/i18n/ui-copy";
import { lockPageScroll } from "@/lib/client/scroll-lock";
import { getCandidatePlanFeatures } from "@/lib/candidate-plan";
import {
  getVacancyEntityCtaLabel,
  getVacancyLocationLabel,
  getVacancyModalityLabel,
} from "@/lib/vacancy-ui";
import {
  APPLICATION_STATUS_AUTO_CLOSE_EVENT,
  APPLICATION_STATUS_AUTO_CLOSE_KEYS,
  MODAL_HISTORY_STATE_KEY,
  readFirstStorageValue,
} from "@/lib/app-runtime";
import {
  getLocalizedVacancyDescription,
  getLocalizedVacancyLongDescription,
  getLocalizedVacancyTags,
  getLocalizedVacancyTitle,
  localizeVacancyText,
} from "@/lib/vacancy-localization";
import { getVacancyPresenter } from "@/lib/vacancy-presenters";
import { slugifyCompanyName } from "@/lib/company-public-slug";
import { qualifiesAsFeaturedVacancy } from "@/lib/utils";
import {
  ALL_CATEGORY,
  ALL_MODALITY,
  ALL_OPTION,
  JOBS_PAGE_SIZE,
  defaultFilters,
  defaultSalary,
  defaultExperience,
  defaultDays,
  formatCopValue,
  formatDescriptionBlocks,
  formatExperienceValue,
  getCategoryLabel,
  getCompanyInitials,
  getDisplayCompensation,
  getLocationOptionLabel,
  getModalityLabel,
  getOccupationTerms,
  getRelevantRoleTags,
  metricBarTone,
  minSalary,
  maxSalary,
  minExperience,
  maxExperience,
  modalityOptions,
  normalizeVacancyTag,
  companySortOptions,
  sortOptions,
  statToneClass,
  type ApplicationProfilePrompt,
  type CandidateProfileViewMode,
  type FilterDraft,
  type FilterDraftUpdater,
} from "@/components/vacancies/job-dashboard-utils";
import type { Vacancy } from "@/types/vacancy";
import type { CandidateApplication } from "@/types/workflows";
import { TopBar } from "@/components/vacancies/top-bar";

function buildSelectedCompanySummary(
  job: Vacancy,
  isEnglish: boolean,
  companyName?: string | null,
) {
  return buildCompanySummaryView({
    job,
    companyName,
    getCompanyInitials,
    isEnglish,
  });
}

export function JobDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const notificationsButtonRef = useRef<HTMLButtonElement | null>(null);
  const profileSummaryRef = useRef<HTMLDivElement | null>(null);
  const mobileFiltersScrollRef = useRef<HTMLDivElement | null>(null);
  const applicationNoticeTimeoutRef = useRef<number | null>(null);
  const applicationStatusCloseTimeoutRef = useRef<number | null>(null);
  const applicationStatusFadeTimeoutRef = useRef<number | null>(null);
  const modalHistoryKeyRef = useRef<string | null>(null);
  const skipNextModalHistoryPushRef = useRef(false);
  const { isDark, themeReady, toggleTheme } = useVacancyTheme();
  const { isEnglish } = useAppLanguage();
  const pageUi = useUiCopy("vacanciesPage");
  const applyPromptUi = useUiCopy("vacancyApplyPromptModal");
  const detailUi = useUiCopy("vacancyDetailModal");
  const { authUser } = useAuthUser();
  const candidateViewer = authUser?.role === "candidate" ? authUser : null;
  const candidatePlanFeatures = candidateViewer ? getCandidatePlanFeatures(candidateViewer) : null;
  const canViewVacancyFeed = Boolean(authUser);
  const isCompanyViewer = authUser?.role === "company";
  const activeSortOptions = isCompanyViewer ? companySortOptions : sortOptions;
  const { vacancies: vacancyFeed } = useVacancyFeed(
    candidateViewer ? `vacancy-feed:${candidateViewer.id}` : isCompanyViewer ? "vacancy-feed:company" : "vacancy-feed:guest",
  );
  const query = searchParams.get("q") ?? "";
  const modeParam = searchParams.get("mode") ?? "";
  const categoryParam = searchParams.get("category") ?? "";
  const departmentParam = searchParams.get("dept") ?? "";
  const municipalityParam = searchParams.get("mun") ?? "";
  const [searchDraft, setSearchDraft] = useState(query);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterDraft>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<FilterDraft>(defaultFilters);
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]["value"]>("relevancia");
  const [selectedJob, setSelectedJob] = useState<Vacancy | null>(null);
  const [jobsPagination, setJobsPagination] = useState<{
    key: string;
    count: number;
  }>({
    key: "",
    count: JOBS_PAGE_SIZE,
  });
  const [matchDetailsExpanded, setMatchDetailsExpanded] = useState(false);
  const [applicationProfilePrompt, setApplicationProfilePrompt] = useState<ApplicationProfilePrompt | null>(null);
  const [applicationNotice, setApplicationNotice] = useState<string | null>(null);
  const [applicationNoticeAutoClose, setApplicationNoticeAutoClose] = useState(true);
  const [applicationStatusAutoCloseActive, setApplicationStatusAutoCloseActive] = useState(false);
  const [applicationStatusClosing, setApplicationStatusClosing] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const [scrollToggleVisible, setScrollToggleVisible] = useState(false);
  const [scrollReturnY, setScrollReturnY] = useState<number | null>(null);
  const { savedIds, pendingSavedIds, toggleSave } = useSavedVacancies();
  const { favoriteCandidateIds, pendingFavoriteIds, toggleFavoriteCandidate } = useCompanyFavoriteCandidates();
  const { allCompanyJobs } = useCompanyJobs(null);
  const { applications, applyToJob, applicationsByJobId, latestApplicationsByJobId, appliedJobIds, withdrawApplication } = useCandidateApplications(
    candidateViewer,
  );
  const { registerDetailClick } = useCategoryInterest(query);
  const [candidateViewMode, setCandidateViewMode] = useState<CandidateProfileViewMode>("details");
  const [expandedDescriptionJobId, setExpandedDescriptionJobId] = useState<string | null>(null);
  const anyModalOpen = Boolean(
    selectedJob ||
      loginOpen ||
      notificationsOpen ||
      applicationProfilePrompt ||
      selectedApplicationId ||
      companyMenuOpen,
  );
  const updateSearchParam = useCallback((key: string, value: string | null) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    const normalized = value?.trim() ?? "";

    if (!normalized) {
      nextParams.delete(key);
    } else {
      nextParams.set(key, normalized);
    }

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (pathname !== "/vacantes") {
      return;
    }

    const handleScroll = () => {
      setScrollToggleVisible(window.scrollY > 360);
      if (scrollReturnY !== null && Math.abs(window.scrollY - scrollReturnY) <= 24) {
        setScrollReturnY(null);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, scrollReturnY]);

  const handleScrollToggle = () => {
    if (scrollReturnY === null) {
      setScrollReturnY(window.scrollY);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.scrollTo({ top: scrollReturnY, behavior: "smooth" });
    setScrollReturnY(null);
  };

  useEffect(() => {
    const nextFilters: FilterDraft = {
      ...defaultFilters,
      modalidad: modalityOptions.includes(modeParam as (typeof modalityOptions)[number])
        ? modeParam
        : defaultFilters.modalidad,
      departamento: departmentParam.trim() || defaultFilters.departamento,
      municipio: municipalityParam.trim() || defaultFilters.municipio,
      categoria: categoryParam.trim() || defaultFilters.categoria,
    };

    const frame = window.requestAnimationFrame(() => {
      setDraftFilters(nextFilters);
      setAppliedFilters(nextFilters);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [categoryParam, departmentParam, modeParam, municipalityParam]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setSearchDraft(query);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchDraft !== query) {
        updateSearchParam("q", searchDraft);
      }
    }, 220);

    return () => window.clearTimeout(timer);
  }, [query, searchDraft, updateSearchParam]);
  const selectedJobPresenter = selectedJob ? getVacancyPresenter(selectedJob) : null;
  const selectedJobIsPerson = selectedJobPresenter?.isPersonProfile ?? false;
  const selectedJobPrimaryName = selectedJobPresenter?.primaryName;
  const selectedCandidateProfile = selectedJob?.candidateProfile;
  const selectedJobLocalizedTitle = selectedJob ? getLocalizedVacancyTitle(selectedJob, isEnglish) : "";
  const selectedJobLocalizedDescription = selectedJob ? getLocalizedVacancyDescription(selectedJob, isEnglish) : "";
  const selectedJobLocalizedTags = selectedJob ? getLocalizedVacancyTags(selectedJob, isEnglish) : [];
  const selectedJobLocalizedBenefits = (selectedJob?.beneficios ?? []).map((benefit) => localizeVacancyText(benefit, isEnglish));
  const selectedJobLocationLabel = getVacancyLocationLabel(selectedJob?.ubicacion);
  const selectedJobModalityLabel = getVacancyModalityLabel(selectedJob?.modalidad, isEnglish);
  const shouldHideSelectedJobModality = Boolean(
    selectedJobLocationLabel &&
    selectedJobModalityLabel &&
    selectedJobLocationLabel.trim().toLowerCase() === selectedJobModalityLabel.trim().toLowerCase(),
  );
  const isDescriptionExpanded = selectedJob
    ? expandedDescriptionJobId === selectedJob.id
    : false;
  const activeApplicationId = selectedApplicationId ?? searchParams.get("application");
  const selectedApplication = activeApplicationId
    ? applications.find((application) => application.id === activeApplicationId) ?? null
    : null;
  const topModalKey = selectedApplication
    ? "application-status"
    : applicationProfilePrompt
      ? "application-profile-prompt"
      : selectedJob
        ? "job-details"
        : null;
  const hasBlockingModalOpen = Boolean(
    selectedJob || selectedApplication || applicationProfilePrompt || loginOpen,
  );
  const showCandidateProfileView =
    selectedJobIsPerson && selectedCandidateProfile && candidateViewMode !== "details";
  const showSummaryOverlay =
    candidateViewMode === "summary" || (selectedJobIsPerson && selectedCandidateProfile && candidateViewMode === "full");
  const candidateOccupationTerms = useMemo(() => {
    if (!candidateViewer || authUser?.role !== "candidate") {
      return [];
    }

    return getOccupationTerms(authUser.rol);
  }, [authUser, candidateViewer]);
  const dashboardFeed = useJobDashboardFeed({
    vacancyFeed,
    candidateViewer,
    appliedFilters,
    query,
    sortBy,
    occupationTerms: candidateOccupationTerms,
  });
  const {
    filteredJobs,
    filteredJobsKey,
    previewJobs,
    lockedPreviewJobs,
    lockedJobsCount,
    badgeSignalsByJobId,
  } = dashboardFeed;
  const selectedJobMatch = dashboardFeed.selectedJobMatchFor(candidateViewer, selectedJob);
  const companyJobsById = useMemo(
    () => new Map(allCompanyJobs.map((job) => [job.id, job])),
    [allCompanyJobs],
  );

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
    if (!applicationNotice) {
      return;
    }

    if (applicationNoticeTimeoutRef.current) {
      window.clearTimeout(applicationNoticeTimeoutRef.current);
      applicationNoticeTimeoutRef.current = null;
    }

    if (!applicationNoticeAutoClose) {
      return;
    }

    applicationNoticeTimeoutRef.current = window.setTimeout(() => {
      setApplicationNotice(null);
      applicationNoticeTimeoutRef.current = null;
    }, 5000);

    return () => {
      if (applicationNoticeTimeoutRef.current) {
        window.clearTimeout(applicationNoticeTimeoutRef.current);
        applicationNoticeTimeoutRef.current = null;
      }
    };
  }, [applicationNotice, applicationNoticeAutoClose]);

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
    if (!selectedJob) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMatchDetailsExpanded(false);
        setSelectedJob(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedJob]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!topModalKey) {
      modalHistoryKeyRef.current = null;
      return;
    }

    if (skipNextModalHistoryPushRef.current) {
      skipNextModalHistoryPushRef.current = false;
      modalHistoryKeyRef.current = topModalKey;
      return;
    }

    if (modalHistoryKeyRef.current === topModalKey) {
      return;
    }

    window.history.pushState({ ...window.history.state, [MODAL_HISTORY_STATE_KEY]: topModalKey }, "");
    modalHistoryKeyRef.current = topModalKey;
  }, [topModalKey]);

  useEffect(() => {
    if (!topModalKey) {
      return;
    }

    const handlePopState = () => {
      skipNextModalHistoryPushRef.current = true;

      if (selectedApplicationId) {
        setSelectedApplicationId(null);
        if (searchParams.get("application")) {
          updateSearchParam("application", null);
        }
        return;
      }

      if (applicationProfilePrompt) {
        setApplicationProfilePrompt(null);
        return;
      }

      if (selectedJob) {
        setCandidateViewMode("details");
        setMatchDetailsExpanded(false);
        setSelectedJob(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [
    applicationProfilePrompt,
    pathname,
    router,
    searchParams,
    selectedApplicationId,
    selectedJob,
    topModalKey,
    updateSearchParam,
  ]);

  useEffect(() => {
    if (!hasBlockingModalOpen) {
      return;
    }

    const releaseScrollLock = lockPageScroll();

    return () => {
      releaseScrollLock();
    };
  }, [hasBlockingModalOpen]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setNotificationsOpen(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, searchParams]);

  useEffect(() => {
    const panel = searchParams.get("panel");

    if (panel !== "notifications") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setNotificationsOpen(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [searchParams]);

  const toggleNotificationsPanel = () => {
    setNotificationsOpen((current) => !current);
  };

  const visibleJobsCount =
    jobsPagination.key === filteredJobsKey ? jobsPagination.count : JOBS_PAGE_SIZE;
  const visibleJobs = useMemo(
    () => filteredJobs.slice(0, visibleJobsCount),
    [filteredJobs, visibleJobsCount],
  );
  const trackedVisibleJobIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!candidateViewer) {
      return;
    }

    const jobsToTrack = visibleJobs.filter((job) => !trackedVisibleJobIdsRef.current.has(job.id));

    if (jobsToTrack.length === 0) {
      return;
    }

    jobsToTrack.forEach((job) => {
      trackedVisibleJobIdsRef.current.add(job.id);
      void trackEvent({
        type: "view_job",
        entityId: job.id,
        metadata: {
          source: "jobs_feed",
          title: job.titulo,
        },
      });
    });
  }, [candidateViewer, visibleJobs]);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (!candidateViewer || normalizedQuery.length < 2) {
      return;
    }

    void trackEvent({
      type: "search_jobs",
      entityId: candidateViewer.id,
      source: "candidate_search",
      surface: "candidate_feed",
      metadata: {
        query: normalizedQuery,
        category: appliedFilters.categoria !== ALL_CATEGORY ? appliedFilters.categoria : undefined,
        modality: appliedFilters.modalidad !== ALL_MODALITY ? appliedFilters.modalidad : undefined,
        department: appliedFilters.departamento !== ALL_OPTION ? appliedFilters.departamento : undefined,
        municipality: appliedFilters.municipio !== ALL_OPTION ? appliedFilters.municipio : undefined,
      },
    });
  }, [
    appliedFilters.categoria,
    appliedFilters.departamento,
    appliedFilters.modalidad,
    appliedFilters.municipio,
    candidateViewer,
    query,
  ]);

  const municipalityOptions = useMemo(() => {
    if (draftFilters.departamento === ALL_OPTION) {
      return [ALL_OPTION];
    }

    return colombiaMunicipalities[draftFilters.departamento] ?? [ALL_OPTION];
  }, [draftFilters.departamento]);

  const categoryOptions = isEnglish ? vacancyCategoriesByLocale.en : vacancyCategoriesByLocale.es;

  const activeFilterCount = [
    appliedFilters.modalidad !== ALL_MODALITY,
    appliedFilters.urgente,
    appliedFilters.departamento !== ALL_OPTION,
    appliedFilters.municipio !== ALL_OPTION,
    appliedFilters.categoria !== ALL_CATEGORY && appliedFilters.categoria !== "All",
    appliedFilters.dias !== defaultDays,
    appliedFilters.salario !== defaultSalary,
    appliedFilters.experiencia !== defaultExperience,
  ].filter(Boolean).length;
  const hasCompanySearchFilters = isCompanyViewer && (activeFilterCount > 0 || searchDraft.trim().length > 0);
  const companyEmptyStateTitle = hasCompanySearchFilters
    ? "No se encontraron candidatos con estos filtros"
    : "No hay candidatos registrados por mostrar";
  const companyEmptyStateMessage = hasCompanySearchFilters
    ? "Cambia los filtros o ajusta la búsqueda para volver a ver candidatos."
    : "Todavía no hay candidatos visibles en la plataforma para esta vista.";

  const requestGuestLogin = () => {
    if (authUser) {
      return false;
    }

    setLoginOpen(true);
    return true;
  };

  const syncFilters = (updater: FilterDraftUpdater) => {
    if (requestGuestLogin()) {
      return;
    }

    setDraftFilters(updater);
    setAppliedFilters(updater);
  };

  const clearFilters = () => {
    if (requestGuestLogin()) {
      return;
    }

    syncFilters(defaultFilters);
  };

  const openSelectedCandidateSms = (job: Vacancy) => {
    const phone = job.candidateProfile?.contact.phone?.replace(/[^\d+]/g, "") ?? "";

    if (!phone || typeof window === "undefined") {
      return;
    }

    const message = encodeURIComponent(
      isEnglish
        ? `Hi ${job.candidateProfile?.fullName ?? ""}, we saw your profile on TalentSyncro and would like to contact you about an opportunity.`
        : `Hola ${job.candidateProfile?.fullName ?? ""}, vimos tu perfil en TalentSyncro y queremos contactarte por una oportunidad.`,
    );

    window.open(`sms:${phone}?body=${message}`, "_self");
  };

  const {
    notificationPreferences,
    groupedNotifications,
    effectiveReadNotificationIds,
    unreadNotificationCount,
    markAllNotificationsAsRead: markStoredNotificationsAsRead,
    toggleNotificationReadState: toggleStoredNotificationReadState,
    toggleNotificationPreference,
    removeNotifications: removeStoredNotifications,
  } = useNotifications();

  const markAllNotificationsAsRead = () => {
    markStoredNotificationsAsRead();
  };

  const toggleNotificationReadState = (id: string) => {
    toggleStoredNotificationReadState(id);
  };

  const removeNotifications = (ids: string[]) => {
    removeStoredNotifications(ids);
  };

  const scrollToProfileSummary = () => {
    profileSummaryRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const openCandidateSummary = () => {
    setCandidateViewMode("summary");
    window.setTimeout(() => {
      scrollToProfileSummary();
    }, 40);
  };

  const openSelectedEntityProfile = () => {
    if (!selectedJobIsPerson) {
      const companySlug = slugifyCompanyName(selectedJobPrimaryName ?? selectedJob?.empresa ?? "");
      if (!companySlug) {
        return;
      }

      if (typeof window !== "undefined") {
        window.open(
          `/empresa/${companySlug}`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }
    }

    openCandidateSummary();
  };

  const openCandidateFullProfile = () => {
    setCandidateViewMode("full");
  };

  const closeCandidateOverlay = () => {
    setCandidateViewMode("details");
  };

  const openJobDetails = (job: Vacancy) => {
    if (!authUser) {
      setLoginOpen(true);
      return;
    }

    void trackEvent({
      type: "click_job",
      entityId: job.id,
      metadata: {
        source: "jobs_feed",
        title: job.titulo,
      },
    });

    registerDetailClick(job);
    setCandidateViewMode("details");
    setMatchDetailsExpanded(false);
    setSelectedJob(job);
  };

  const handleToggleSave = (jobId: string) => {
    if (!authUser) {
      setLoginOpen(true);
      return;
    }

    if (isCompanyViewer) {
      void toggleFavoriteCandidate(jobId);
      return;
    }

    toggleSave(jobId);
  };

  const activeSavedIds = isCompanyViewer ? favoriteCandidateIds : savedIds;
  const activePendingSavedIds = isCompanyViewer ? pendingFavoriteIds : pendingSavedIds;

  const openApplicationDetails = (job: Vacancy) => {
    const application = applicationsByJobId[job.id];
    if (!application) {
      return;
    }

    setApplicationStatusAutoCloseActive(false);
    setApplicationStatusClosing(false);
    setSelectedApplicationId(application.id);
  };

  const requestCloseTopModal = () => {
    if (topModalKey) {
      skipNextModalHistoryPushRef.current = true;
      window.history.back();
      return;
    }
  };

  const closeApplicationDetails = () => {
    setApplicationStatusAutoCloseActive(false);
    setApplicationStatusClosing(false);
    setSelectedApplicationId(null);
    modalHistoryKeyRef.current = null;
    skipNextModalHistoryPushRef.current = false;

    if (searchParams.get("application")) {
      updateSearchParam("application", null);
    }
  };

  const canWithdrawApplication = (application: CandidateApplication | undefined) =>
    Boolean(application && canWithdrawCandidateApplication(application.status));

  const handleWithdrawApplication = (job: Vacancy) => {
    const application = applicationsByJobId[job.id];
    if (!application || !canWithdrawApplication(application)) {
      return;
    }

    withdrawApplication(application.id);
    setApplicationNotice(pageUi("applicationWithdrawn", { title: job.titulo }));
  };

  const handleApplyJob = (job: Vacancy) => {
    if (!authUser) {
      setLoginOpen(true);
      return;
    }

    if (authUser.role !== "candidate") {
      return;
    }

    if (applyingJobId) {
      return;
    }

    const activeApplication = applicationsByJobId[job.id];
    if (activeApplication) {
      setApplicationStatusAutoCloseActive(false);
      setSelectedApplicationId(activeApplication.id);
      setApplicationNotice(pageUi("alreadyApplied", { title: job.titulo }));
      return;
    }

    const candidateName = authUser.nombre;
    const experience = Array.isArray(authUser.experiencia) && authUser.experiencia.length > 0
      ? authUser.experiencia
      : null;
    const optionalCv = typeof authUser.cv === "string" && authUser.cv.trim().length > 0
      ? authUser.cv
      : null;

    const managedJob = companyJobsById.get(job.id);
    if (managedJob && managedJob.status !== "published") {
      setApplicationNotice(
        managedJob.status === "paused"
          ? pageUi("vacancyPaused")
          : pageUi("vacancyClosed"),
      );
      return;
    }

    const missingFields = [
      candidateName ? null : "name",
      experience ? null : "experience",
    ].filter(Boolean) as string[];

    if (missingFields.length > 0) {
      const completionScore = Math.max(
        40,
        100 - missingFields.length * 25 - (optionalCv ? 0 : 10),
      );

      setApplicationProfilePrompt({
        job,
        completionScore,
        missingFields,
      });
      return;
    }

    setApplyingJobId(job.id);
    window.setTimeout(() => {
      void (async () => {
        const applied = await applyToJob(job);
        setApplyingJobId(null);

        if (applied && typeof applied === "object" && "id" in applied) {
          void trackEvent({
            type: "apply_job",
            entityId: job.id,
            metadata: {
              title: job.titulo,
            },
          });
          setApplicationNotice(
            pageUi("applicationSuccess", { title: job.titulo }),
          );
          openJobDetails(job);
          setApplicationStatusClosing(false);
          setApplicationStatusAutoCloseActive(true);
          setSelectedApplicationId(applied.id);
          return;
        }

        if (typeof applied === "string") {
          setApplicationNotice(applied);
          return;
        }

        setApplicationNotice(
          activeApplication
            ? pageUi("alreadyApplied", { title: job.titulo })
            : pageUi("applicationError", { title: job.titulo }),
        );
      })();
    }, 650);
  };

  const closeJobDetails = () => {
    setCandidateViewMode("details");
    setMatchDetailsExpanded(false);
    setSelectedJob(null);
    modalHistoryKeyRef.current = null;
    skipNextModalHistoryPushRef.current = false;
  };

  const scrollMobileFilters = (direction: "left" | "right") => {
    const node = mobileFiltersScrollRef.current;
    if (!node) {
      return;
    }

    const amount = Math.max(220, Math.round(node.clientWidth * 0.7));
    node.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <main
      className={`vacancies-shell relative min-h-screen overflow-x-hidden ${
        isDark ? "bg-[#050816] text-[#eef6ff]" : "vacancies-shell-light bg-[#eef6f8] text-slate-900"
      } ${
        themeReady ? "" : "invisible"
      }`}
    >
      <BackgroundEffects />

      <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-5 sm:px-6 lg:px-8 lg:pb-24">
        {authUser && !isCompanyViewer ? (
          <TopBar
            query={searchDraft}
            onQueryChange={setSearchDraft}
            isEnglish={isEnglish}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onOpenLogin={() => setLoginOpen(true)}
            notificationCount={unreadNotificationCount}
            onToggleNotifications={toggleNotificationsPanel}
            notificationsButtonRef={notificationsButtonRef}
          />
        ) : null}

        {isCompanyViewer ? (
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setCompanyMenuOpen(true)}
              className={isDark ? "inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-sm font-semibold text-slate-100" : "inline-flex items-center gap-2 rounded-[1rem] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"}
            >
              <Menu className="h-4 w-4" />
              Menú
            </button>
          </div>
        ) : null}

        <CompanyMenuSheet
          open={companyMenuOpen}
          isDark={isDark}
          onClose={() => setCompanyMenuOpen(false)}
          onToggleTheme={toggleTheme}
        />

        <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />

        {applicationNotice ? (
          <div className="pointer-events-none fixed right-4 top-4 z-[220] flex max-w-sm flex-col gap-2">
            <div className={isDark ? "rounded-[1.2rem] border border-sky-300/22 bg-[#081120]/95 px-4 py-3 text-sm font-semibold text-sky-100 shadow-[0_20px_60px_rgba(0,0,0,0.35)]" : "rounded-[1.2rem] border border-sky-300 bg-white px-4 py-3 text-sm font-semibold text-sky-800 shadow-[0_20px_60px_rgba(148,163,184,0.28)]"}>
              {applicationNotice}
            </div>
          </div>
        ) : null}

        <ApplicationStatusDialog
          application={selectedApplication}
          autoClose={applicationNoticeAutoClose && applicationStatusAutoCloseActive}
          autoCloseMs={10000}
          closing={applicationStatusClosing}
          isOpen={Boolean(selectedApplication)}
          isDark={isDark}
          isEnglish={isEnglish}
          onClose={closeApplicationDetails}
          onWithdraw={(applicationId) => {
            const application = selectedApplication;
            if (!application || application.id !== applicationId) {
              return;
            }

            handleWithdrawApplication({
              id: application.jobId,
              titulo: application.title,
              empresa: application.companyName,
              ubicacion: application.location,
              modalidad: application.modality,
              descripcion: "",
            });
          }}
        />

        <NotificationCenterModal
          key={`${pathname}?${searchParams.toString()}`}
          open={notificationsOpen}
          isDark={isDark}
          notificationPreferences={notificationPreferences}
          groupedNotifications={groupedNotifications}
          effectiveReadNotificationIds={effectiveReadNotificationIds}
          unreadNotificationCount={unreadNotificationCount}
          showApplicationSection
          onClose={() => setNotificationsOpen(false)}
          onMarkAllNotificationsAsRead={markAllNotificationsAsRead}
          onToggleNotificationReadState={toggleNotificationReadState}
          onToggleNotificationPreference={toggleNotificationPreference}
          onRemoveNotifications={removeNotifications}
        />

        <div className="mt-7 lg:hidden">
          <div
            className={
              isDark
                ? "overflow-hidden rounded-[1.6rem] border border-white/8 bg-white/[0.03]"
                : "overflow-hidden rounded-[1.6rem] border border-slate-300 bg-white/90"
            }
          >
            <div className="px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className={isDark ? "text-xl font-semibold text-white" : "text-xl font-semibold text-slate-900"}>
                    {pageUi("filter")}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {activeFilterCount ? (
                    <span className={isDark ? "rounded-full border border-cyan-300/18 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100" : "rounded-full border border-sky-300/50 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800"}>
                      {activeFilterCount} {pageUi("activeCount")}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={
                      isDark
                        ? "ts-chip-interactive inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-medium leading-none text-slate-100"
                        : "ts-chip-interactive inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium leading-none text-slate-800"
                    }
                  >
                      {pageUi("clearFilters")}
                    </button>
                </div>
              </div>

              <div className="relative mt-4">
                <button
                  type="button"
                  aria-label="Desplazar filtros a la izquierda"
                  onClick={() => scrollMobileFilters("left")}
                  className={
                    isDark
                      ? "absolute left-0 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#081120]/92 text-slate-100 shadow-[0_12px_24px_rgba(0,0,0,0.24)]"
                      : "absolute left-0 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white/95 text-slate-700 shadow-[0_12px_24px_rgba(148,163,184,0.18)]"
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  aria-label="Desplazar filtros a la derecha"
                  onClick={() => scrollMobileFilters("right")}
                  className={
                    isDark
                      ? "absolute right-0 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#081120]/92 text-slate-100 shadow-[0_12px_24px_rgba(0,0,0,0.24)]"
                      : "absolute right-0 top-1/2 z-10 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white/95 text-slate-700 shadow-[0_12px_24px_rgba(148,163,184,0.18)]"
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <div
                  ref={mobileFiltersScrollRef}
                  className="touch-scroll-x flex gap-3 overflow-x-auto px-11 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                <label className={isDark ? "min-w-[12rem] shrink-0 rounded-[1.25rem] border border-white/8 bg-white/4 p-3" : "min-w-[12rem] shrink-0 rounded-[1.25rem] border border-slate-300 bg-white p-3"}>
                  <span className={isDark ? "mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400" : "mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"}>
                    Modalidad
                  </span>
                  <select
                    value={draftFilters.modalidad}
                    onChange={(event) => syncFilters((current) => ({ ...current, modalidad: event.target.value }))}
                    className="vacancy-select"
                  >
                    {modalityOptions.map((option) => (
                      <option key={option} value={option}>
                        {getModalityLabel(option, isEnglish)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={isDark ? "min-w-[11rem] shrink-0 rounded-[1.25rem] border border-white/8 bg-white/4 p-3" : "min-w-[11rem] shrink-0 rounded-[1.25rem] border border-slate-300 bg-white p-3"}>
                  <span className={isDark ? "mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400" : "mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"}>
                    {isCompanyViewer ? "Area de enfoque" : pageUi("categories")}
                  </span>
                  <select
                    value={draftFilters.categoria}
                    onChange={(event) => syncFilters((current) => ({ ...current, categoria: event.target.value }))}
                    className="vacancy-select"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {getCategoryLabel(option, isEnglish)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={isDark ? "min-w-[12rem] shrink-0 rounded-[1.25rem] border border-white/8 bg-white/4 p-3" : "min-w-[12rem] shrink-0 rounded-[1.25rem] border border-slate-300 bg-white p-3"}>
                  <span className={isDark ? "mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400" : "mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"}>
                    {pageUi("department")}
                  </span>
                  <select
                    value={draftFilters.departamento}
                    onChange={(event) =>
                      syncFilters((current) => ({
                        ...current,
                        departamento: event.target.value,
                        municipio: ALL_OPTION,
                      }))
                    }
                    className="vacancy-select"
                  >
                    {colombiaDepartments.map((option) => (
                      <option key={option} value={option}>
                        {getLocationOptionLabel(option, isEnglish)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={isDark ? "min-w-[12rem] shrink-0 rounded-[1.25rem] border border-white/8 bg-white/4 p-3" : "min-w-[12rem] shrink-0 rounded-[1.25rem] border border-slate-300 bg-white p-3"}>
                  <span className={isDark ? "mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400" : "mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"}>
                    {pageUi("municipality")}
                  </span>
                  <select
                    value={draftFilters.municipio}
                    onChange={(event) => syncFilters((current) => ({ ...current, municipio: event.target.value }))}
                    className="vacancy-select"
                  >
                    {municipalityOptions.map((option) => (
                      <option key={option} value={option}>
                        {getLocationOptionLabel(option, isEnglish)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={isDark ? "flex min-w-[10rem] shrink-0 items-center gap-3 rounded-[1.25rem] border border-white/8 bg-white/4 p-3" : "flex min-w-[10rem] shrink-0 items-center gap-3 rounded-[1.25rem] border border-slate-300 bg-white p-3"}>
                  <input
                    type="checkbox"
                    checked={draftFilters.urgente}
                    onChange={(event) => syncFilters((current) => ({ ...current, urgente: event.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 accent-rose-500"
                  />
                  <span className={isDark ? "text-sm font-medium text-slate-200" : "text-sm font-medium text-slate-800"}>
                    {isCompanyViewer ? (isEnglish ? "Immediate availability" : "Disponibilidad inmediata") : pageUi("urgent")}
                  </span>
                </label>

                <div className={isDark ? "min-w-[16rem] shrink-0 rounded-[1.25rem] border border-white/8 bg-white/4 p-3" : "min-w-[16rem] shrink-0 rounded-[1.25rem] border border-slate-300 bg-white p-3"}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={isDark ? "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400" : "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"}>
                      {isCompanyViewer ? (isEnglish ? "Salary expectation" : "Espectativa salarial") : pageUi("salary")}
                    </span>
                    <span className={isDark ? "text-sm font-semibold text-slate-100 whitespace-nowrap" : "text-sm font-semibold text-slate-950 whitespace-nowrap"}>{formatCopValue(draftFilters.salario)}</span>
                  </div>
                  <div className="mt-3 overflow-hidden px-1">
                    <input
                      type="range"
                      min={minSalary}
                      max={maxSalary}
                      step={100000}
                      value={draftFilters.salario}
                      onChange={(event) => syncFilters((current) => ({ ...current, salario: Number(event.target.value) }))}
                      className="vacancy-range vacancy-range-blue"
                    />
                  </div>
                </div>

                <div className={isDark ? "min-w-[15rem] shrink-0 rounded-[1.25rem] border border-white/8 bg-white/4 p-3" : "min-w-[15rem] shrink-0 rounded-[1.25rem] border border-slate-300 bg-white p-3"}>
                  <div className="flex items-center justify-between gap-3">
                    <span className={isDark ? "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400" : "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"}>
                      {pageUi("experience")}
                    </span>
                    <span className={isDark ? "text-sm font-semibold text-slate-100 whitespace-nowrap" : "text-sm font-semibold text-slate-950 whitespace-nowrap"}>{formatExperienceValue(draftFilters.experiencia, isEnglish)}</span>
                  </div>
                  <div className="mt-3 overflow-hidden px-1">
                    <input
                      type="range"
                      min={minExperience}
                      max={maxExperience}
                      step={1}
                      value={draftFilters.experiencia}
                      onChange={(event) => syncFilters((current) => ({ ...current, experiencia: Number(event.target.value) }))}
                      className="vacancy-range vacancy-range-blue"
                    />
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)] 2xl:grid-cols-[20rem_minmax(0,1fr)]">
          <aside
            className={
              isDark
                ? "hidden h-fit rounded-[1.8rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(5,12,24,0.98),rgba(7,14,27,0.96))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:block lg:sticky lg:top-6"
                : "hidden h-fit rounded-[1.8rem] border border-sky-200/80 bg-[linear-gradient(180deg,rgba(248,252,255,0.98),rgba(239,246,255,0.96))] p-5 shadow-[0_24px_70px_rgba(148,163,184,0.16)] backdrop-blur-xl lg:block lg:sticky lg:top-6"
            }
          >
            <div>
              <h2 className={isDark ? "text-2xl font-semibold text-white" : "text-2xl font-semibold text-slate-900"}>
                {pageUi("filter")}
              </h2>
            </div>
                <JobDashboardFilters
                  isDark={isDark}
                  isEnglish={isEnglish}
                  isCompanyViewer={isCompanyViewer}
                  pageUi={pageUi}
                  categoryOptions={categoryOptions}
                  draftFilters={draftFilters}
                  syncFilters={syncFilters}
                  clearFilters={clearFilters}
                />
          </aside>

          <div className="min-w-0">
            <div
              className={
                isDark
                  ? "flex flex-col gap-4 rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4"
                  : "flex flex-col gap-4 rounded-[1.6rem] border border-slate-300 bg-white/90 p-4"
              }
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {!isCompanyViewer ? (
                  <div>
                    <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200" : "text-xs font-semibold uppercase tracking-[0.22em] text-sky-700"}>
                      Resultados
                    </p>
                    <p className={isDark ? "mt-2 text-base font-semibold text-white" : "mt-2 text-base font-semibold text-slate-900"}>
                      {filteredJobs.length} vacantes visibles
                      {activeFilterCount ? ` · ${activeFilterCount} filtros activos` : ""}
                    </p>
                  </div>
                ) : null}

                <div className={`flex flex-wrap items-center gap-3 ${isCompanyViewer ? "w-full lg:flex-nowrap lg:justify-between" : ""}`}>
                  {isCompanyViewer ? (
                    <div className={isDark ? "inline-flex w-full items-center gap-3 rounded-full border border-white/8 bg-white/[0.04] px-5 py-3 text-sm text-slate-200 lg:max-w-[36rem]" : "inline-flex w-full items-center gap-3 rounded-full border border-slate-300 bg-slate-50 px-5 py-3 text-sm text-slate-700 lg:max-w-[36rem]"}>
                      <Search className="h-4 w-4" />
                      <input
                        value={searchDraft}
                        onChange={(event) => setSearchDraft(event.target.value)}
                        placeholder="Buscar talento"
                        className={isDark ? "min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-slate-400" : "min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-500"}
                      />
                      {searchDraft ? (
                        <button
                          type="button"
                          onClick={() => setSearchDraft("")}
                          className={isDark ? "inline-flex items-center justify-center rounded-full text-slate-300 transition hover:text-white" : "inline-flex items-center justify-center rounded-full text-slate-500 transition hover:text-slate-900"}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  <label
                    className={
                      isDark
                        ? "inline-flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-sm text-slate-200"
                        : "inline-flex items-center gap-3 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-700"
                    }
                  >
                    <span>{pageUi("sortBy")}</span>
                    <select
                      value={sortBy}
                      onChange={(event) =>
                        requestGuestLogin()
                          ? setSortBy((current) => current)
                          : setSortBy(event.target.value as (typeof activeSortOptions)[number]["value"])
                      }
                      className={
                        isDark
                          ? "bg-transparent text-sm font-medium text-white outline-none"
                          : "bg-transparent text-sm font-medium text-slate-900 outline-none"
                      }
                    >
                      {activeSortOptions.map((option) => (
                        <option key={option.value} value={option.value} className="text-slate-900">
                          {isEnglish ? option.labelEn : option.labelEs}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
          {appliedFilters.modalidad !== ALL_MODALITY ? (
            <button
              type="button"
              onClick={() =>
                syncFilters((current) => ({ ...current, modalidad: ALL_MODALITY }))
              }
              className="ts-chip-interactive inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-950 transition hover:border-red-300 hover:bg-red-100"
            >
              {getModalityLabel(appliedFilters.modalidad, isEnglish)}
              <X className="h-4 w-4" />
            </button>
          ) : null}
          {appliedFilters.urgente ? (
            <button
              type="button"
              onClick={() =>
                syncFilters((current) => ({ ...current, urgente: false }))
              }
              className="ts-chip-interactive inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-950 transition hover:border-red-300 hover:bg-red-100"
            >
              {isCompanyViewer ? (isEnglish ? "Immediate availability" : "Disponibilidad inmediata") : pageUi("urgent")}
              <X className="h-4 w-4" />
            </button>
          ) : null}
          {appliedFilters.departamento !== ALL_OPTION ? (
            <button
              type="button"
              onClick={() =>
                syncFilters((current) => ({
                  ...current,
                  departamento: ALL_OPTION,
                  municipio: ALL_OPTION,
                }))
              }
              className="ts-chip-interactive inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-950 transition hover:border-red-300 hover:bg-red-100"
            >
              {getLocationOptionLabel(appliedFilters.departamento, isEnglish)}
              <X className="h-4 w-4" />
            </button>
          ) : null}
          {appliedFilters.municipio !== ALL_OPTION ? (
            <button
              type="button"
              onClick={() =>
                syncFilters((current) => ({ ...current, municipio: ALL_OPTION }))
              }
              className="ts-chip-interactive inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-950 transition hover:border-red-300 hover:bg-red-100"
            >
              {getLocationOptionLabel(appliedFilters.municipio, isEnglish)}
              <X className="h-4 w-4" />
            </button>
          ) : null}
          {appliedFilters.categoria !== ALL_CATEGORY && appliedFilters.categoria !== "All" ? (
            <button
              type="button"
              onClick={() =>
                syncFilters((current) => ({ ...current, categoria: ALL_CATEGORY }))
              }
              className="ts-chip-interactive inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-950 transition hover:border-red-300 hover:bg-red-100"
            >
              {getCategoryLabel(appliedFilters.categoria, isEnglish)}
              <X className="h-4 w-4" />
            </button>
          ) : null}
          {appliedFilters.salario !== defaultSalary ? (
            <button
              type="button"
              onClick={() =>
                syncFilters((current) => ({ ...current, salario: defaultSalary }))
              }
              className="ts-chip-interactive inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-950 transition hover:border-red-300 hover:bg-red-100"
            >
              {pageUi("fromSalary", { value: formatCopValue(appliedFilters.salario) })}
              <X className="h-4 w-4" />
            </button>
          ) : null}
          {appliedFilters.experiencia !== defaultExperience ? (
            <button
              type="button"
              onClick={() =>
                syncFilters((current) => ({ ...current, experiencia: defaultExperience }))
              }
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-950 transition hover:border-red-300 hover:bg-red-100"
            >
              {pageUi("upToExperience", { value: formatExperienceValue(appliedFilters.experiencia, isEnglish) })}
              <X className="h-4 w-4" />
            </button>
          ) : null}
          {savedIds.length > 0 ? (
            <Link
              href="/guardado"
              className={
                isDark
                  ? "inline-flex items-center gap-2 rounded-full border border-[#fcd116]/16 bg-[#fcd116]/8 px-4 py-2 text-sm text-[#fde68a] transition hover:border-[#fcd116]/28 hover:bg-[#fcd116]/14"
                  : "inline-flex items-center gap-2 rounded-full border border-[#fcd116]/38 bg-[#fcd116]/10 px-4 py-2 text-sm text-[#b77900] transition hover:border-[#fcd116]/50 hover:bg-[#fcd116]/18"
              }
            >
              <Bookmark className="h-4 w-4 fill-current" />
              {pageUi("savedForLater", { count: activeSavedIds.length })}
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
          </div>

        <div className="mt-10">
          {applicationNotice ? (
            <div className={isDark ? "mb-4 rounded-[1.2rem] border border-cyan-300/18 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-100" : "mb-4 rounded-[1.2rem] border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-700"}>
              {applicationNotice}
            </div>
          ) : null}
          {candidateViewer && appliedJobIds.length >= Math.max(3, Math.round((candidatePlanFeatures?.activeApplicationsLimit ?? 7) * 0.6)) && candidatePlanFeatures?.plan !== "pro" ? (
            <div className={isDark ? "mb-4 rounded-[1.2rem] border border-amber-300/18 bg-amber-400/10 px-4 py-3 text-sm text-amber-100" : "mb-4 rounded-[1.2rem] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700"}>
              {pageUi("upgradeApplicationsHint")}
            </div>
          ) : null}
          {canViewVacancyFeed ? (
            <>
              <JobGrid
                jobs={visibleJobs}
                badgeSignalsByJobId={badgeSignalsByJobId}
                savedIds={activeSavedIds}
                pendingSavedIds={activePendingSavedIds}
                urgentFilterActive={appliedFilters.urgente}
                applicationsByJobId={latestApplicationsByJobId}
                applyingJobId={applyingJobId}
                viewerRole={authUser?.role === "candidate" || authUser?.role === "company" ? authUser.role : null}
                emptyStateTitle={isCompanyViewer ? companyEmptyStateTitle : undefined}
                emptyStateMessage={isCompanyViewer ? companyEmptyStateMessage : undefined}
                onToggleSave={handleToggleSave}
                onOpenDetails={openJobDetails}
                onViewApplication={openApplicationDetails}
              />
              {filteredJobs.length > visibleJobs.length ? (
                <div className="mt-6 flex justify-center">
                  <button
                  type="button"
                  onClick={() =>
                    setJobsPagination({
                      key: filteredJobsKey,
                      count: visibleJobsCount + JOBS_PAGE_SIZE,
                    })
                  }
                    className={
                      isDark
                        ? "inline-flex items-center justify-center rounded-full border border-cyan-300/18 bg-white/8 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/14"
                        : "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    }
                  >
                    {pageUi("seeMore")}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="space-y-5">
              <div
                className={
                  isDark
                    ? "rounded-[1.4rem] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(6,17,33,0.96),rgba(8,18,34,0.94))] px-5 py-5 text-center shadow-[0_24px_70px_rgba(0,0,0,0.34)]"
                    : "rounded-[1.4rem] border border-slate-300 bg-white/96 px-5 py-5 text-center shadow-[0_20px_54px_rgba(148,163,184,0.16)]"
                }
              >
                <p
                  className={
                    isDark
                      ? "text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200"
                      : "text-xs font-semibold uppercase tracking-[0.22em] text-sky-700"
                  }
                >
                  Acceso restringido
                </p>
                <h3
                  className={
                    isDark
                      ? "mt-3 text-2xl font-semibold text-white"
                      : "mt-3 text-2xl font-semibold text-slate-950"
                  }
                >
                  Explora una muestra y desbloquea el panel completo al iniciar sesión
                </h3>
                <p
                  className={
                    isDark
                      ? "mt-3 text-sm leading-7 text-slate-300"
                      : "mt-3 text-sm leading-7 text-slate-600"
                  }
                >
                  Puedes revisar una selección curada de vacantes. Para usar filtros, ordenar resultados, guardar oportunidades y seguir postulaciones, inicia sesión.
                </p>
              </div>

              <JobGrid
                jobs={previewJobs}
                badgeSignalsByJobId={badgeSignalsByJobId}
                savedIds={[]}
                pendingSavedIds={[]}
                urgentFilterActive={appliedFilters.urgente}
                viewerRole={null}
                previewMode
                onToggleSave={() => {}}
                onOpenDetails={openJobDetails}
              />

              {lockedPreviewJobs.length > 0 ? (
                <div className="relative">
                  <div className="pointer-events-none select-none blur-[3px] opacity-55">
                    <JobGrid
                      jobs={lockedPreviewJobs}
                      badgeSignalsByJobId={badgeSignalsByJobId}
                      savedIds={[]}
                      pendingSavedIds={[]}
                      urgentFilterActive={appliedFilters.urgente}
                      viewerRole={null}
                      previewMode
                      onToggleSave={() => {}}
                      onOpenDetails={() => {}}
                    />
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div
                      className={
                        isDark
                          ? "max-w-xl rounded-[1.6rem] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(6,17,33,0.96),rgba(8,18,34,0.94))] px-5 py-5 text-center shadow-[0_28px_80px_rgba(0,0,0,0.36)]"
                          : "max-w-xl rounded-[1.6rem] border border-slate-300 bg-white/96 px-5 py-5 text-center shadow-[0_24px_60px_rgba(148,163,184,0.22)]"
                      }
                    >
                      <p
                        className={
                          isDark
                            ? "text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200"
                            : "text-xs font-semibold uppercase tracking-[0.22em] text-sky-700"
                        }
                      >
                        Acceso completo requerido
                      </p>
                      <h3
                        className={
                          isDark
                            ? "mt-3 text-2xl font-semibold text-white"
                            : "mt-3 text-2xl font-semibold text-slate-950"
                        }
                      >
                        Inicia sesión para ver el tablero completo de vacantes
                      </h3>
                      <p
                        className={
                          isDark
                            ? "mt-3 text-sm leading-7 text-slate-300"
                            : "mt-3 text-sm leading-7 text-slate-600"
                        }
                      >
                        {lockedJobsCount.toLocaleString("es-CO")} oportunidades adicionales, guardado de vacantes y seguimiento de postulaciones están disponibles al iniciar sesión.
                      </p>
                      <button
                        type="button"
                        onClick={() => setLoginOpen(true)}
                        className="mt-5 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(76,29,149,0.26)] transition duration-300 hover:-translate-y-0.5"
                      >
                        Iniciar sesión
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
          </div>
        </div>
      </section>

      {applicationProfilePrompt ? (
        <div className="fixed inset-0 z-[180] overflow-y-auto px-4 py-4 sm:flex sm:items-center sm:justify-center sm:py-6">
          <div
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
            onClick={requestCloseTopModal}
          />
          <div className="relative mx-auto w-full max-w-lg">
            <button
              type="button"
              aria-label={applyPromptUi("closeApplicationPrompt")}
              onClick={requestCloseTopModal}
              className={
                isDark
                  ? "absolute left-0 top-6 z-20 inline-flex h-11 w-11 -translate-x-[4.25rem] items-center justify-center rounded-full border border-white/10 bg-[#081120] text-slate-200 shadow-[0_16px_40px_rgba(0,0,0,0.32)] transition hover:border-cyan-200/24 hover:bg-[#0b1729]"
                  : "absolute left-0 top-6 z-20 inline-flex h-11 w-11 -translate-x-[4.25rem] items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-[0_16px_40px_rgba(148,163,184,0.20)] transition hover:border-sky-300 hover:bg-slate-50"
              }
            >
              <X className="h-4.5 w-4.5" />
            </button>
          <div
            className={`relative z-10 w-full max-w-lg rounded-[2rem] border p-6 shadow-[0_28px_90px_rgba(0,0,0,0.32)] sm:p-7 ${
              isDark
                ? "touch-scroll-y max-h-[90dvh] overflow-y-auto border-cyan-300/14 bg-[linear-gradient(180deg,rgba(7,16,31,0.98),rgba(8,17,32,0.94))]"
                : "touch-scroll-y max-h-[90dvh] overflow-y-auto border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))]"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200" : "text-xs font-semibold uppercase tracking-[0.24em] text-sky-700"}>
              {applyPromptUi("completeProfileToApply")}
            </p>
            <h3 className={isDark ? "mt-3 text-2xl font-semibold text-white" : "mt-3 text-2xl font-semibold text-slate-900"}>
              {applyPromptUi("completeProfileToApplyFast")}
            </h3>
            <p className={isDark ? "mt-3 text-sm leading-7 text-slate-300" : "mt-3 text-sm leading-7 text-slate-700"}>
              {applyPromptUi("missingDataToApply", {
                title: getLocalizedVacancyTitle(applicationProfilePrompt.job, isEnglish),
              })}
            </p>

            <div className={isDark ? "mt-5 rounded-[1.4rem] border border-cyan-300/14 bg-white/4 p-4" : "mt-5 rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-4"}>
              <div className="flex items-center justify-between gap-3">
                <span className={isDark ? "text-sm font-medium text-slate-200" : "text-sm font-medium text-slate-700"}>
                  {applyPromptUi("currentProfile")}
                </span>
                <span className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-900"}>
                  {applyPromptUi("completedPercent", { value: applicationProfilePrompt.completionScore })}
                </span>
              </div>
              <div className={isDark ? "mt-3 h-2 rounded-full bg-white/10" : "mt-3 h-2 rounded-full bg-slate-200"}>
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400"
                  style={{ width: `${applicationProfilePrompt.completionScore}%` }}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {[
                { id: "name", label: applyPromptUi("fieldName"), optional: false },
                { id: "experience", label: applyPromptUi("fieldExperience"), optional: false },
                { id: "cv", label: applyPromptUi("fieldCvOptional"), optional: true },
              ].map((field) => {
                const missing = applicationProfilePrompt.missingFields.includes(field.id);
                return (
                  <div
                    key={field.id}
                    className={isDark ? "flex items-center justify-between rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-200" : "flex items-center justify-between rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"}
                  >
                    <span>{field.label}</span>
                    <span className={missing ? "font-semibold text-amber-500" : field.optional ? "font-semibold text-slate-500" : "font-semibold text-emerald-500"}>
                      {missing ? applyPromptUi("missing") : applyPromptUi("ready")}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={requestCloseTopModal}
                className={
                  isDark
                    ? "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/4 px-5 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-200/24 hover:bg-white/8"
                    : "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition hover:border-sky-300 hover:bg-slate-50"
                }
              >
                {applyPromptUi("later")}
              </button>
              <Link
                href="/perfil"
                onClick={() => setApplicationProfilePrompt(null)}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(76,29,149,0.26)] transition duration-300 hover:-translate-y-0.5"
              >
                {applyPromptUi("completeProfile")}
              </Link>
            </div>
          </div>
          </div>
        </div>
      ) : null}

      {selectedJob ? (
        <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-4 sm:flex sm:items-center sm:justify-center sm:py-6">
          <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" onClick={closeJobDetails} />
          <div className={`relative z-10 mx-auto w-full ${showCandidateProfileView ? "max-w-6xl" : "max-w-[60.5rem]"}`}>
            <button
              type="button"
              aria-label={detailUi("closeDetails")}
              onClick={closeJobDetails}
              className={
                isDark
                  ? "absolute left-0 top-6 z-20 inline-flex h-11 w-11 -translate-x-[4.25rem] items-center justify-center rounded-full border border-white/10 bg-[#081120] text-slate-200 shadow-[0_16px_40px_rgba(0,0,0,0.32)] transition hover:border-cyan-200/24 hover:bg-[#0b1729]"
                  : "absolute left-0 top-6 z-20 inline-flex h-11 w-11 -translate-x-[4.25rem] items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-[0_16px_40px_rgba(148,163,184,0.20)] transition hover:border-sky-300 hover:bg-slate-50"
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
            {showSummaryOverlay ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200" : "text-xs font-semibold uppercase tracking-[0.24em] text-sky-700"}>
                      {selectedJobIsPerson
                        ? candidateViewMode === "summary"
                          ? detailUi("candidateSummary")
                          : detailUi("candidateFullProfile")
                        : detailUi("jobSummary")}
                    </p>
                    <h3 className={isDark ? "mt-3 break-words pr-12 text-2xl font-semibold text-white sm:pr-0" : "mt-3 break-words pr-12 text-2xl font-semibold text-slate-900 sm:pr-0"}>
                      {selectedJobIsPerson && selectedCandidateProfile
                        ? selectedCandidateProfile.fullName
                        : getLocalizedVacancyTitle(selectedJob, isEnglish)}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={closeCandidateOverlay}
                    className={
                      isDark
                        ? "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-200/24 hover:bg-white/8"
                        : "inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
                    }
                  >
                    {detailUi("back")}
                  </button>
                </div>

                {selectedJobIsPerson && selectedCandidateProfile ? (
                <>
                <section
                  ref={profileSummaryRef}
                  className={
                    isDark
                      ? "rounded-[1.8rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(9,20,35,0.96),rgba(8,17,31,0.92))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                      : "rounded-[1.8rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,251,0.96))] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.10)]"
                  }
                >
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className={isDark ? "flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] border border-cyan-300/18 bg-cyan-300/10 text-xl font-semibold text-cyan-100" : "flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] border border-sky-300/30 bg-sky-100 text-xl font-semibold text-sky-700"}>
                        {selectedCandidateProfile.fullName
                          .split(" ")
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")}
                      </div>
                      <div className="min-w-0">
                        <h4 className={isDark ? "break-words text-2xl font-semibold text-white" : "break-words text-2xl font-semibold text-slate-900"}>
                          {selectedCandidateProfile.fullName}
                        </h4>
                        <p className={isDark ? "mt-1 break-words text-base text-cyan-100" : "mt-1 break-words text-base text-sky-700"}>
                          {selectedCandidateProfile.role}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                          <span className={isDark ? "inline-flex min-w-0 items-center gap-2 break-words text-slate-300" : "inline-flex min-w-0 items-center gap-2 break-words text-slate-700"}>
                            <MapPin className="h-4 w-4" />
                            {selectedCandidateProfile.location}
                          </span>
                          <span className={isDark ? "max-w-full break-words rounded-full border border-[#fcd116]/18 bg-[#fcd116]/10 px-3 py-1 text-sm font-semibold text-[#fde68a]" : "max-w-full break-words rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800"}>
                            {selectedCandidateProfile.expectedSalary}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-start lg:justify-end">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(76,29,149,0.26)] transition duration-300 hover:-translate-y-0.5"
                        onClick={openCandidateFullProfile}
                      >
                        {detailUi("viewFullProfile")}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </section>

                {candidateViewMode === "summary" ? (
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)]">
                    <div className="space-y-5">
                      <section className="grid gap-3 md:grid-cols-3">
                        {(selectedCandidateProfile.stats ?? []).map((stat) => (
                          <article
                            key={`${selectedJob.id}-${stat.label}`}
                            className={`rounded-[1.4rem] border p-4 ${statToneClass(isDark, stat.accent)}`}
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
                              {stat.label}
                            </p>
                            <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                          </article>
                        ))}
                      </section>

                      <section className={isDark ? "min-w-0 rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "min-w-0 rounded-[1.6rem] border border-slate-300 bg-white/90 p-5"}>
                        <div className="flex items-center justify-between gap-3">
                          <h5 className={isDark ? "text-sm font-semibold uppercase tracking-[0.18em] text-slate-300" : "text-sm font-semibold uppercase tracking-[0.18em] text-slate-600"}>
                            {detailUi("summary")}
                          </h5>
                          <span className={isDark ? "rounded-full border border-emerald-300/18 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100" : "rounded-full border border-emerald-300/60 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"}>
                            {selectedCandidateProfile.availability}
                          </span>
                        </div>
                        <p className={isDark ? "mt-3 text-sm leading-7 text-slate-300" : "mt-3 text-sm leading-7 text-slate-700"}>
                          {selectedCandidateProfile.summary}
                        </p>
                      </section>

                      <section className={isDark ? "min-w-0 rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "min-w-0 rounded-[1.6rem] border border-slate-300 bg-white/90 p-5"}>
                        <h5 className={isDark ? "text-sm font-semibold uppercase tracking-[0.18em] text-slate-300" : "text-sm font-semibold uppercase tracking-[0.18em] text-slate-600"}>
                          {detailUi("technicalSkills")}
                        </h5>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedCandidateProfile.technicalSkills.map((skill) => (
                            <span
                              key={`${selectedJob.id}-${skill}`}
                              className={isDark ? "rounded-full border border-cyan-300/14 bg-cyan-300/8 px-3 py-1.5 text-sm font-medium text-cyan-100" : "rounded-full border border-sky-300/50 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-800"}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </section>

                      <section className={isDark ? "min-w-0 rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "min-w-0 rounded-[1.6rem] border border-slate-300 bg-white/90 p-5"}>
                        <h5 className={isDark ? "text-sm font-semibold uppercase tracking-[0.18em] text-slate-300" : "text-sm font-semibold uppercase tracking-[0.18em] text-slate-600"}>
                          {detailUi("softSkills")}
                        </h5>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedCandidateProfile.softSkills.map((skill) => (
                            <span
                              key={`${selectedJob.id}-${skill}-soft`}
                              className={isDark ? "rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-200" : "rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </section>

                      <section className={isDark ? "min-w-0 rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "min-w-0 rounded-[1.6rem] border border-slate-300 bg-white/90 p-5"}>
                        <h5 className={isDark ? "text-sm font-semibold uppercase tracking-[0.18em] text-slate-300" : "text-sm font-semibold uppercase tracking-[0.18em] text-slate-600"}>
                          {detailUi("highlightedExperience")}
                        </h5>
                        <div className="mt-4 space-y-4">
                          {selectedCandidateProfile.highlightedExperience.map((experience) => (
                            <article
                              key={`${selectedJob.id}-${experience.role}-${experience.company}`}
                              className={isDark ? "rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4" : "rounded-[1.3rem] border border-slate-200 bg-slate-50/80 p-4"}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className={isDark ? "text-base font-semibold text-white" : "text-base font-semibold text-slate-900"}>
                                    {experience.role}
                                  </p>
                                  <p className={isDark ? "text-sm text-cyan-100" : "text-sm text-sky-700"}>
                                    {experience.company}
                                  </p>
                                </div>
                                <span className={isDark ? "rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300" : "rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700"}>
                                  {experience.period}
                                </span>
                              </div>
                              <p className={isDark ? "mt-3 text-sm leading-7 text-slate-300" : "mt-3 text-sm leading-7 text-slate-700"}>
                                {experience.summary}
                              </p>
                              {experience.impact ? (
                                <p className={isDark ? "mt-3 text-sm font-medium text-emerald-100" : "mt-3 text-sm font-medium text-emerald-700"}>
                                  {experience.impact}
                                </p>
                              ) : null}
                            </article>
                          ))}
                        </div>
                      </section>
                    </div>

                    <aside className="min-w-0 space-y-5">
                      <section className={isDark ? "min-w-0 rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "min-w-0 rounded-[1.6rem] border border-slate-300 bg-white/90 p-5"}>
                        <h5 className={isDark ? "text-sm font-semibold uppercase tracking-[0.18em] text-slate-300" : "text-sm font-semibold uppercase tracking-[0.18em] text-slate-600"}>
                          {detailUi("candidateSignals")}
                        </h5>
                        <div className="mt-4 space-y-4">
                          {selectedCandidateProfile.metrics.map((metric) => (
                            <div key={`${selectedJob.id}-${metric.label}`}>
                              <div className="flex items-center justify-between gap-3">
                                <span className={isDark ? "text-sm text-slate-300" : "text-sm text-slate-700"}>
                                  {metric.label}
                                </span>
                                <span className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-900"}>
                                  {metric.value}%
                                </span>
                              </div>
                              <div className={isDark ? "mt-2 h-2 rounded-full bg-white/8" : "mt-2 h-2 rounded-full bg-slate-200"}>
                                <div
                                  className={`h-2 rounded-full bg-gradient-to-r ${metricBarTone(metric.tone)}`}
                                  style={{ width: `${metric.value}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className={isDark ? "min-w-0 rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "min-w-0 rounded-[1.6rem] border border-slate-300 bg-white/90 p-5"}>
                        <h5 className={isDark ? "text-sm font-semibold uppercase tracking-[0.18em] text-slate-300" : "text-sm font-semibold uppercase tracking-[0.18em] text-slate-600"}>
                          {detailUi("publicProfile")}
                        </h5>
                        <div className="mt-4 space-y-3">
                          <div className={isDark ? "flex min-w-0 items-start gap-3 rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300" : "flex min-w-0 items-start gap-3 rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"}>
                            <ExternalLink className="h-4 w-4" />
                            <span className="min-w-0 break-words">{selectedCandidateProfile.contact.linkedin}</span>
                          </div>
                        </div>
                      </section>
                    </aside>
                  </div>
                ) : (
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                    <section className={isDark ? "min-w-0 rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "min-w-0 rounded-[1.6rem] border border-slate-300 bg-white/90 p-5"}>
                      <p className={isDark ? "break-words text-sm leading-7 text-slate-300" : "break-words text-sm leading-7 text-slate-700"}>
                        {selectedCandidateProfile.fullProfile.headline}
                      </p>

                      <div className="mt-5">
                        <h5 className={isDark ? "text-sm font-semibold uppercase tracking-[0.18em] text-slate-300" : "text-sm font-semibold uppercase tracking-[0.18em] text-slate-600"}>
                          {detailUi("keyAchievements")}
                        </h5>
                        <div className="mt-4 space-y-3">
                          {selectedCandidateProfile.fullProfile.achievements.map((achievement) => (
                            <div
                              key={`${selectedJob.id}-${achievement}`}
                              className={isDark ? "rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300" : "rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"}
                            >
                              {achievement}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5">
                        <h5 className={isDark ? "text-sm font-semibold uppercase tracking-[0.18em] text-slate-300" : "text-sm font-semibold uppercase tracking-[0.18em] text-slate-600"}>
                          {detailUi("fullTrajectory")}
                        </h5>
                        <div className="mt-4 space-y-4">
                          {selectedCandidateProfile.fullProfile.experience.map((experience) => (
                            <article
                              key={`${selectedJob.id}-${experience.role}-${experience.period}-full`}
                              className={isDark ? "rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-4" : "rounded-[1.3rem] border border-slate-200 bg-slate-50/80 p-4"}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className={isDark ? "text-base font-semibold text-white" : "text-base font-semibold text-slate-900"}>
                                    {experience.role}
                                  </p>
                                  <p className={isDark ? "text-sm text-cyan-100" : "text-sm text-sky-700"}>
                                    {experience.company}
                                  </p>
                                </div>
                                <span className={isDark ? "rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300" : "rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700"}>
                                  {experience.period}
                                </span>
                              </div>
                              <p className={isDark ? "mt-3 text-sm leading-7 text-slate-300" : "mt-3 text-sm leading-7 text-slate-700"}>
                                {experience.summary}
                              </p>
                              {experience.impact ? (
                                <p className={isDark ? "mt-3 text-sm font-medium text-emerald-100" : "mt-3 text-sm font-medium text-emerald-700"}>
                                  {experience.impact}
                                </p>
                              ) : null}
                            </article>
                          ))}
                        </div>
                      </div>
                    </section>

                    <aside className="min-w-0 space-y-5">
                      <section className={isDark ? "min-w-0 rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "min-w-0 rounded-[1.6rem] border border-slate-300 bg-white/90 p-5"}>
                        <h5 className={isDark ? "text-sm font-semibold uppercase tracking-[0.18em] text-slate-300" : "text-sm font-semibold uppercase tracking-[0.18em] text-slate-600"}>
                          {detailUi("education")}
                        </h5>
                        <div className="mt-4 space-y-3">
                          {selectedCandidateProfile.fullProfile.education.map((item) => (
                            <div
                              key={`${selectedJob.id}-${item}`}
                              className={isDark ? "rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300" : "rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"}
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className={isDark ? "min-w-0 rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "min-w-0 rounded-[1.6rem] border border-slate-300 bg-white/90 p-5"}>
                        <h5 className={isDark ? "text-sm font-semibold uppercase tracking-[0.18em] text-slate-300" : "text-sm font-semibold uppercase tracking-[0.18em] text-slate-600"}>
                          {detailUi("languages")}
                        </h5>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedCandidateProfile.fullProfile.languages.map((language) => (
                            <span
                              key={`${selectedJob.id}-${language}`}
                              className={isDark ? "rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-200" : "rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"}
                            >
                              {language}
                            </span>
                          ))}
                        </div>
                      </section>

                      {selectedCandidateProfile.fullProfile.certifications?.length ? (
                        <section className={isDark ? "min-w-0 rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "min-w-0 rounded-[1.6rem] border border-slate-300 bg-white/90 p-5"}>
                          <h5 className={isDark ? "text-sm font-semibold uppercase tracking-[0.18em] text-slate-300" : "text-sm font-semibold uppercase tracking-[0.18em] text-slate-600"}>
                            {detailUi("certifications")}
                          </h5>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {selectedCandidateProfile.fullProfile.certifications.map((item) => (
                              <span
                                key={`${selectedJob.id}-${item}-cert`}
                                className={isDark ? "rounded-full border border-cyan-300/14 bg-cyan-300/8 px-3 py-1.5 text-sm font-medium text-cyan-100" : "rounded-full border border-sky-300/50 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-800"}
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </section>
                      ) : null}
                    </aside>
                  </div>
                )}
                </>
                ) : (
                <>
                <section
                  ref={profileSummaryRef}
                  className={
                    isDark
                      ? "rounded-[1.8rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(9,20,35,0.96),rgba(8,17,31,0.92))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                      : "rounded-[1.8rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,251,0.96))] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.10)]"
                  }
                >
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className={isDark ? "flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] border border-cyan-300/18 bg-cyan-300/10 text-xl font-semibold text-cyan-100" : "flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] border border-sky-300/30 bg-sky-100 text-xl font-semibold text-sky-700"}>
                        {getCompanyInitials(selectedJobPrimaryName)}
                      </div>
                      <div className="min-w-0">
                        <h4 className={isDark ? "break-words text-2xl font-semibold text-white" : "break-words text-2xl font-semibold text-slate-900"}>
                          {selectedJobPrimaryName ?? detailUi("confidentialCompany")}
                        </h4>
                        <p className={isDark ? "mt-1 break-words text-base text-cyan-100" : "mt-1 break-words text-base text-sky-700"}>
                          {selectedJobLocalizedTitle}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                          {selectedJobLocationLabel ? (
                            <span className={isDark ? "inline-flex min-w-0 items-center gap-2 break-words text-slate-300" : "inline-flex min-w-0 items-center gap-2 break-words text-slate-700"}>
                              <MapPin className="h-4 w-4" />
                              {selectedJobLocationLabel}
                            </span>
                          ) : null}
                          <span className={isDark ? "max-w-full break-words rounded-full border border-[#fcd116]/18 bg-[#fcd116]/10 px-3 py-1 text-sm font-semibold text-[#fde68a]" : "max-w-full break-words rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800"}>
                            {getDisplayCompensation(selectedJob)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.85fr)]">
                  <div className="space-y-5">
                    <section className="grid gap-3 md:grid-cols-2">
                      <article className={`rounded-[1.4rem] border p-4 ${statToneClass(isDark, "sky")}`}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
                          {detailUi("applicants")}
                        </p>
                        <p className="mt-2 text-2xl font-semibold">{selectedJob.aplicantes ?? 0}</p>
                      </article>
                      <article className={`rounded-[1.4rem] border p-4 ${statToneClass(isDark, "emerald")}`}>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
                          {detailUi("visibility")}
                        </p>
                        <p className="mt-2 text-lg font-semibold">
                          {selectedJob.destacada || (selectedJob.vistasDosSemanas ?? 0) >= 1800
                            ? isEnglish
                              ? detailUi("highVisibility")
                              : detailUi("highVisibility")
                            : isEnglish
                              ? detailUi("standardVisibility")
                              : detailUi("standardVisibility")}
                        </p>
                      </article>
                    </section>

                    <section className={isDark ? "min-w-0 rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "min-w-0 rounded-[1.6rem] border border-slate-300 bg-white/90 p-5"}>
                      <h5 className={isDark ? "text-sm font-semibold uppercase tracking-[0.18em] text-slate-300" : "text-sm font-semibold uppercase tracking-[0.18em] text-slate-600"}>
                        {detailUi("aboutRole")}
                      </h5>
                      <p className={isDark ? "mt-3 line-clamp-2 break-words text-sm leading-7 text-slate-300" : "mt-3 line-clamp-2 break-words text-sm leading-7 text-slate-700"}>
                        {selectedJobLocalizedDescription}
                      </p>
                    </section>

                    {selectedJobLocalizedTags.length ? (
                      <section className={isDark ? "min-w-0 rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "min-w-0 rounded-[1.6rem] border border-slate-300 bg-white/90 p-5"}>
                        <h5 className={isDark ? "text-sm font-semibold uppercase tracking-[0.18em] text-slate-300" : "text-sm font-semibold uppercase tracking-[0.18em] text-slate-600"}>
                          {detailUi("coreSkills")}
                        </h5>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {selectedJobLocalizedTags
                            .filter((tag) => normalizeVacancyTag(tag) !== normalizeVacancyTag("Software / Development"))
                            .slice(0, 4)
                            .map((tag) => (
                            <span
                              key={`${selectedJob.id}-${tag}-summary`}
                              className={isDark ? "rounded-full border border-cyan-300/14 bg-cyan-300/8 px-3 py-1.5 text-sm font-medium text-cyan-100" : "rounded-full border border-sky-300/50 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-800"}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {selectedJobLocalizedBenefits.length ? (
                      <section className={isDark ? "min-w-0 rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "min-w-0 rounded-[1.6rem] border border-slate-300 bg-white/90 p-5"}>
                        <h5 className={isDark ? "text-sm font-semibold uppercase tracking-[0.18em] text-slate-300" : "text-sm font-semibold uppercase tracking-[0.18em] text-slate-600"}>
                          {detailUi("highlights")}
                        </h5>
                        <div className="mt-4 space-y-3">
                          {selectedJobLocalizedBenefits.slice(0, 3).map((benefit) => (
                            <div
                              key={`${selectedJob.id}-${benefit}-benefit`}
                              className={isDark ? "rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300" : "rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"}
                            >
                              <span className="font-medium">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    ) : null}
                  </div>

                  <aside className="min-w-0 space-y-5">
                    <section className={isDark ? "min-w-0 rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "min-w-0 rounded-[1.6rem] border border-slate-300 bg-white/90 p-5"}>
                      <h5 className={isDark ? "text-sm font-semibold uppercase tracking-[0.18em] text-slate-300" : "text-sm font-semibold uppercase tracking-[0.18em] text-slate-600"}>
                        {detailUi("keyData")}
                      </h5>
                      <div className="mt-4 space-y-3">
                        <div className={isDark ? "rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300" : "rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"}>
                          {detailUi("postedByCompany")}
                        </div>
                        <div className={isDark ? "rounded-[1.1rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300" : "rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"}>
                          {isEnglish
                            ? detailUi("postedDaysAgo", { count: selectedJob.diasDesdePublicacion ?? 0 })
                            : detailUi("postedDaysAgo", { count: selectedJob.diasDesdePublicacion ?? 0 })}
                        </div>
                      </div>
                    </section>
                  </aside>
                </div>
                </>
                )}
              </div>
            ) : (
            <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200" : "text-xs font-semibold uppercase tracking-[0.24em] text-sky-700"}>
                  {selectedJobIsPerson ? detailUi("profileDetails") : detailUi("jobDetails")}
                </p>
                <h3 className={isDark ? "mt-3 text-2xl font-semibold text-white" : "mt-3 text-2xl font-semibold text-slate-900"}>
                  {getLocalizedVacancyTitle(selectedJob, isEnglish)}
                </h3>
              </div>
            </div>

            {!selectedJobIsPerson && authUser?.role === "candidate" && selectedJobMatch ? (
              <div className="mt-4 space-y-3">
                <MatchSummaryCard
                  isDark={isDark}
                  isEnglish={isEnglish}
                  result={selectedJobMatch}
                  variant="dashboard"
                  detailsCollapsed={!matchDetailsExpanded}
                  showRankingExplanation
                  onToggleDetails={
                    candidatePlanFeatures?.showInsights
                      ? () => setMatchDetailsExpanded((current) => !current)
                      : undefined
                  }
                />
                {matchDetailsExpanded && candidatePlanFeatures?.showInsights ? (
                  <MatchBreakdown
                    isDark={isDark}
                    isEnglish={isEnglish}
                    result={selectedJobMatch}
                  />
                ) : null}
              </div>
            ) : null}

            {(() => {
              const selectedApplicationRecord = applicationsByJobId[selectedJob.id];
              const selectedCanWithdraw = canWithdrawApplication(selectedApplicationRecord);
              const selectedPrimaryActionLabel = selectedJobIsPerson
                ? isCompanyViewer
                  ? detailUi("contact")
                  : detailUi("viewDetails")
                : applyingJobId === selectedJob.id
                  ? detailUi("applying")
                  : selectedApplicationRecord
                    ? detailUi("viewApplication")
                    : detailUi("apply");

              return (
                <div className="mt-5 flex justify-start">
                  <JobDetailActions
                    isDark={isDark}
                    className="flex flex-wrap items-center gap-3"
                    primaryLabel={selectedPrimaryActionLabel}
                    onPrimary={() => {
                      if (selectedJobIsPerson) {
                        if (isCompanyViewer) {
                          openSelectedCandidateSms(selectedJob);
                        }
                        return;
                      }

                      if (selectedApplicationRecord) {
                        openApplicationDetails(selectedJob);
                        return;
                      }

                      handleApplyJob(selectedJob);
                    }}
                    primaryDisabled={applyingJobId === selectedJob.id}
                    showWithdraw={!selectedJobIsPerson && selectedCanWithdraw}
                    onWithdraw={() => handleWithdrawApplication(selectedJob)}
                    withdrawLabel={detailUi("withdrawApplication")}
                    profileLabel={getVacancyEntityCtaLabel(isEnglish, selectedJobIsPerson)}
                    onOpenProfile={openSelectedEntityProfile}
                  />
                </div>
              );
            })()}

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
              {!selectedJobIsPerson && (selectedJob.etiquetas ?? []).some((tag) => tag.toLowerCase() === "urgente") ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-red-500 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-950 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.22)]">
                  {detailUi("urgent")}
                </span>
              ) : null}
              {!selectedJobIsPerson && qualifiesAsFeaturedVacancy(selectedJob) ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#fcd116]/40 bg-[#fcd116]/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-black">
                  {detailUi("featured")}
                </span>
              ) : null}
              {!selectedJobIsPerson && typeof selectedJob.aplicantes === "number" ? (
                <span className={isDark ? "inline-flex items-center gap-2 rounded-full border border-emerald-300/18 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100" : "inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800"}>
                  {detailUi("appliedCount", { count: selectedJob.aplicantes })}
                </span>
              ) : null}
              {selectedJobPrimaryName ? (
                <span className={isDark ? "inline-flex items-center gap-2 text-sky-300" : "inline-flex items-center gap-2 text-sky-700"}>
                  {selectedJobIsPerson ? <UserRound className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
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
                  {formatDescriptionBlocks(getLocalizedVacancyLongDescription(selectedJob, isEnglish).split(/\s+/).slice(0, 1500).join(" ")).map((block, index) => (
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
                onClick={() =>
                  setExpandedDescriptionJobId((current) =>
                    current === selectedJob.id ? null : selectedJob.id,
                  )
                }
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
                    {selectedJobIsPerson ? detailUi("profileExperience") : detailUi("requiredExperience")}
                  </p>
                  <p className={isDark ? "mt-2 text-sm font-medium text-white" : "mt-2 text-sm font-medium text-slate-900"}>
                    {formatExperienceValue(selectedJob.experienciaMinimaAnos ?? 0, isEnglish)}
                  </p>
                </div>
                <div>
                  <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.18em] text-slate-400" : "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"}>
                    {selectedJobIsPerson ? detailUi("salaryExpectation") : detailUi("salaryToPay")}
                  </p>
                  <p className={isDark ? "mt-2 text-sm font-medium text-white" : "mt-2 text-sm font-medium text-slate-900"}>
                    {selectedJob.salario ?? formatCopValue((selectedJob.salarioMinimoMillones ?? 0) * 1_000_000)}
                  </p>
                </div>
              </div>

              {!selectedJobIsPerson && selectedJob.beneficios?.length ? (
                <>
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
                </>
              ) : null}

              {getRelevantRoleTags(selectedJob.etiquetas).length ? (
                <>
                  <div className="mt-5">
                    <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.18em] text-slate-400" : "text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"}>
                      {detailUi("focus")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {getRelevantRoleTags(selectedJobLocalizedTags).map((tag) => (
                        <span
                          key={`${selectedJob.id}-${tag}`}
                          className={isDark ? "rounded-full border border-white/8 bg-white/4 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-slate-300" : "rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-slate-700"}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {!selectedJobIsPerson ? (
              <div ref={profileSummaryRef}>
                <CompanySummaryModalSection
                  company={buildSelectedCompanySummary(selectedJob, isEnglish, selectedJobPrimaryName)}
                  lookupName={selectedJobPrimaryName ?? selectedJob.empresa}
                  isDark={isDark}
                  isEnglish={isEnglish}
                />
              </div>
            ) : (
              <div ref={profileSummaryRef} className={isDark ? "mt-6 rounded-[1.4rem] border border-cyan-300/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-3.5" : "mt-6 rounded-[1.4rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] p-3.5"}>
                <div className="flex items-start gap-4">
                  <div className={isDark ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-cyan-300/18 bg-cyan-300/10 text-cyan-100" : "flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-sky-300/30 bg-sky-100 text-sky-700"}>
                    <span className="text-xs font-semibold tracking-[0.12em]">
                      {getCompanyInitials(selectedJobPrimaryName)}
                    </span>
                  </div>
                  <div>
                    <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200" : "text-xs font-semibold uppercase tracking-[0.18em] text-sky-700"}>
                      {detailUi("professionalProfile")}
                    </p>
                    <p className={isDark ? "mt-2 text-base font-semibold text-white" : "mt-2 text-base font-semibold text-slate-900"}>
                      {selectedJobPrimaryName ?? detailUi("visibleProfile")}
                    </p>
                    <p className={isDark ? "mt-2 line-clamp-3 text-sm leading-6 text-slate-400" : "mt-2 line-clamp-3 text-sm leading-6 text-slate-700"}>
                      {detailUi("visibleProfileDescription")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(() => {
              const selectedApplicationRecord = applicationsByJobId[selectedJob.id];
              const selectedCanWithdraw = canWithdrawApplication(selectedApplicationRecord);
              const selectedPrimaryActionLabel = selectedJobIsPerson
                ? isCompanyViewer
                  ? detailUi("contact")
                  : detailUi("viewDetails")
                : applyingJobId === selectedJob.id
                  ? detailUi("applying")
                  : selectedApplicationRecord
                    ? detailUi("viewApplication")
                    : detailUi("apply");

              return (
                <div className="mt-8 flex flex-wrap justify-start gap-3">
                  {selectedJobIsPerson && isCompanyViewer ? (
                    <button
                      type="button"
                      onClick={() => void toggleFavoriteCandidate(selectedJob.id)}
                      disabled={pendingFavoriteIds.includes(selectedJob.id)}
                      className={
                        favoriteCandidateIds.includes(selectedJob.id)
                          ? isDark
                            ? "inline-flex items-center justify-center rounded-full border border-amber-300/24 bg-amber-400/10 px-5 py-2.5 text-sm font-medium text-amber-100 transition duration-300"
                            : "inline-flex items-center justify-center rounded-full border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-medium text-amber-800 transition duration-300"
                          : isDark
                            ? "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/4 px-5 py-2.5 text-sm font-medium text-slate-100 transition duration-300 hover:border-cyan-200/24 hover:bg-white/8"
                            : "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition duration-300 hover:border-slate-400 hover:bg-slate-50"
                      }
                    >
                      {pendingFavoriteIds.includes(selectedJob.id)
                        ? "Guardando..."
                        : favoriteCandidateIds.includes(selectedJob.id)
                          ? "Guardado"
                          : "Guardar perfil"}
                    </button>
                  ) : null}
                  <JobDetailActions
                    isDark={isDark}
                    className="flex flex-wrap justify-start gap-3"
                    primaryLabel={selectedPrimaryActionLabel}
                    onPrimary={() => {
                      if (selectedJobIsPerson) {
                        if (isCompanyViewer) {
                          openSelectedCandidateSms(selectedJob);
                        }
                        return;
                      }

                      if (selectedApplicationRecord) {
                        openApplicationDetails(selectedJob);
                        return;
                      }

                      handleApplyJob(selectedJob);
                    }}
                    primaryDisabled={applyingJobId === selectedJob.id}
                    showWithdraw={!selectedJobIsPerson && selectedCanWithdraw}
                    onWithdraw={() => handleWithdrawApplication(selectedJob)}
                    withdrawLabel={detailUi("withdrawApplication")}
                    profileLabel={getVacancyEntityCtaLabel(isEnglish, selectedJobIsPerson)}
                    onOpenProfile={openSelectedEntityProfile}
                    closeLabel={detailUi("close")}
                    onClose={closeJobDetails}
                  />
                </div>
              );
            })()}
            </>
            )}
          </div>
          </div>
        </div>
      ) : null}
      {scrollToggleVisible && !anyModalOpen && pathname === "/vacantes" ? (
        <button
          type="button"
          onClick={handleScrollToggle}
          aria-label={
            scrollReturnY === null
              ? isEnglish
                ? "Go to top"
                : "Subir al inicio"
              : isEnglish
                ? "Return to previous position"
                : "Volver a la posición anterior"
          }
          className={
            isDark
              ? "fixed bottom-4 left-1/2 z-40 inline-flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-cyan-300/20 bg-[#081120]/92 text-cyan-100 shadow-xl backdrop-blur md:bottom-auto md:left-5 md:top-1/2 md:h-11 md:w-11 md:translate-x-0 md:-translate-y-1/2"
              : "fixed bottom-4 left-1/2 z-40 inline-flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-slate-300 bg-white/94 text-slate-800 shadow-xl backdrop-blur md:bottom-auto md:left-5 md:top-1/2 md:h-11 md:w-11 md:translate-x-0 md:-translate-y-1/2"
          }
        >
          {scrollReturnY === null ? <ArrowUp className="h-4 w-4 md:h-5 md:w-5" /> : <ArrowDown className="h-4 w-4 md:h-5 md:w-5" />}
        </button>
      ) : null}
    </main>
  );
}
