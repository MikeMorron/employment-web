"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CandidateProfileShowcase } from "@/components/profile/candidate-profile-showcase";
import { UserProfilePageEditor } from "@/components/profile/user-profile-page-editor";
import { useAppLanguage } from "@/hooks/use-app-language";
import { syncAuthSessionFromServer } from "@/hooks/use-auth-user";
import { useVacancyFeed } from "@/hooks/use-vacancy-feed";
import { apiRequest } from "@/lib/api";
import { AUTH_EVENT, AUTH_USER_KEY, getStoredAuthUser } from "@/lib/auth";
import { useUiCopy } from "@/lib/i18n/ui-copy";
import { buildProfileFitSignals, getReferenceVacancyForProfile } from "@/lib/profile-fit-benchmark";
import {
  isValidColombiaPhone,
  isValidWebsite,
} from "@/lib/profile-form";
import { countSummaryWords, sanitizeSummaryText, truncateSummaryText } from "@/lib/summary-text";
import {
  EMPTY_SAVE_VALIDATION_STATE,
  formatProfileDate,
  getDynamicMatchScore,
  getProfileDateStorageValue,
  getProfileScoreBreakdown,
  isEmptyExperienceItem,
  type ExperienceValidationErrors,
  type SaveValidationState,
  validateExperienceItems,
} from "@/components/profile/user-profile-page-utils";
import {
  buildOptimizationActions,
  type ProfileRewardTarget,
  type ProfileSectionKey,
} from "@/components/profile/user-profile-page-helpers";
import { useProfileAssetValidation } from "@/components/profile/use-profile-asset-validation";
import type { User } from "@/types/user";
import type {
  CandidateCertificationProfile,
  CandidateEducationProfile,
  CandidateProfessionalProfile,
  CandidateWorkPreferences,
  LanguageProficiency,
} from "@/types/profile";

export function UserProfilePage({
  user,
  isDark,
  canEdit = true,
}: {
  user: User;
  isDark: boolean;
  canEdit?: boolean;
}) {
  const { isEnglish } = useAppLanguage();
  const t = useUiCopy("profile");
  const rewardTimeoutRef = useRef<number | null>(null);
  const [profile, setProfile] = useState<User>(user);
  const [draft, setDraft] = useState<User>(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<ProfileSectionKey, boolean>>({
    editorOverview: false,
    jobFit: false,
    matching: false,
    skills: false,
    categories: false,
    experience: false,
    info: false,
    optimization: false,
    comparison: false,
  });
  const [pendingFocusTarget, setPendingFocusTarget] = useState<string | null>(null);
  const [scoreReward, setScoreReward] = useState<{
    target: ProfileRewardTarget;
    points: number;
  } | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>("2026-03-25");
  const [saveValidation, setSaveValidation] = useState<SaveValidationState>(
    EMPTY_SAVE_VALIDATION_STATE,
  );
  const [saveErrorSignal, setSaveErrorSignal] = useState(0);
  const [summaryWordCount, setSummaryWordCount] = useState(countSummaryWords(user.resumenPerfil ?? ""));

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setProfile(user);
      setDraft(user);
      setSummaryWordCount(countSummaryWords(user.resumenPerfil ?? ""));
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [user]);

  useEffect(() => {
    return () => {
      if (rewardTimeoutRef.current) {
        window.clearTimeout(rewardTimeoutRef.current);
      }
    };
  }, []);

  function showScoreReward(
    target: ProfileRewardTarget,
    points: number,
  ) {
    if (points <= 0) {
      return;
    }

    if (rewardTimeoutRef.current) {
      window.clearTimeout(rewardTimeoutRef.current);
    }

    setScoreReward({ target, points });
    rewardTimeoutRef.current = window.setTimeout(() => setScoreReward(null), 1800);
  }

  function toggleProfileSection(section: ProfileSectionKey) {
    setCollapsedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  function getBreakdownDelta(
    previousProfile: User,
    nextProfile: User,
    target: "header" | "summary" | "skills" | "categories" | "experience" | "info" | "cv",
  ) {
    const previous = getProfileScoreBreakdown(previousProfile);
    const next = getProfileScoreBreakdown(nextProfile);

    switch (target) {
      case "header":
        return next.basicInfoScore - previous.basicInfoScore;
      case "summary":
        return next.profilePersonalScore - previous.profilePersonalScore;
      case "categories":
        return next.profilePersonalScore - previous.profilePersonalScore;
      case "skills":
        return next.skillsScore - previous.skillsScore;
      case "experience":
        return next.experienceScore - previous.experienceScore;
      case "info":
        return next.additionalScore - previous.additionalScore;
      case "cv":
        return next.cvScore - previous.cvScore;
    }
  }

  function syncAuthUserProfile(nextProfile: User) {
    if (!canEdit || typeof window === "undefined") {
      return;
    }

    const authRaw = window.localStorage.getItem(AUTH_USER_KEY);

    if (!authRaw) {
      return;
    }

    try {
      const authUser = JSON.parse(authRaw) as User;
      if (authUser.id !== nextProfile.id) {
        return;
      }
      const mergedUser = {
        ...authUser,
        ...nextProfile,
      };

      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(mergedUser));
      window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: mergedUser }));
    } catch {
      // Ignore malformed auth payloads; profile state is still persisted separately.
    }
  }

  function scheduleAuthUserProfileSync(nextProfile: User | null) {
    if (!nextProfile) {
      return;
    }

    queueMicrotask(() => {
      syncAuthUserProfile(nextProfile);
    });
  }

  function updateField(field: keyof User, value: string) {
    setDraft((current) => {
      const nextProfileBase = {
        ...current,
        [field]: value,
      };
      const nextProfile =
        field === "expectativaSalarialMin" || field === "expectativaSalarialMax"
          ? {
              ...nextProfileBase,
              // Keep the legacy aggregate field in sync so old readers do not resurrect deleted values.
              expectativaSalarial:
                field === "expectativaSalarialMin"
                  ? value || nextProfileBase.expectativaSalarialMax || ""
                  : nextProfileBase.expectativaSalarialMin || value || "",
            }
          : nextProfileBase;

      const target: ProfileRewardTarget | null =
        field === "nombre" || field === "rol" || field === "telefono"
          ? "header"
          : field === "resumenPerfil"
            ? "summary"
            : field === "idiomas" ||
                field === "website"
              ? "info"
                : field === "cv"
                  ? "cv"
                : null;

      if (target) {
        showScoreReward(target, getBreakdownDelta(current, nextProfile, target));
      }

      if (field === "telefono" && saveValidation.phone) {
        setSaveValidation((current) => ({ ...current, phone: null }));
      }

      return nextProfile;
    });
  }

  function updateUploadedCv(value: { fileName: string; downloadUrl?: string }) {
    let nextProfileForAuth: User | null = null;

    setDraft((current) => {
      const nextDraft = {
        ...current,
        cv: value.fileName,
        cvDownloadUrl: value.downloadUrl ?? current.cvDownloadUrl,
      };
      showScoreReward("cv", getBreakdownDelta(current, nextDraft, "cv"));
      return nextDraft;
    });

    setProfile((current) => {
      const nextProfile = {
        ...current,
        cv: value.fileName,
        cvDownloadUrl: value.downloadUrl ?? current.cvDownloadUrl,
      };
      nextProfileForAuth = nextProfile;
      return nextProfile;
    });
    scheduleAuthUserProfileSync(nextProfileForAuth);

    setLastUpdatedAt(getProfileDateStorageValue());
  }

  function clearUploadedCv() {
    let nextProfileForAuth: User | null = null;

    setDraft((current) => ({
      ...current,
      cv: "",
      cvDownloadUrl: "",
    }));

    setProfile((current) => {
      const nextProfile = {
        ...current,
        cv: "",
        cvDownloadUrl: "",
      };
      nextProfileForAuth = nextProfile;
      return nextProfile;
    });
    scheduleAuthUserProfileSync(nextProfileForAuth);
  }

  function updateUploadedAvatar(avatarUrl: string) {
    let nextProfileForAuth: User | null = null;

    setDraft((current) => ({
      ...current,
      avatar: avatarUrl,
    }));

    setProfile((current) => {
      const nextProfile = {
        ...current,
        avatar: avatarUrl,
      };
      nextProfileForAuth = nextProfile;
      return nextProfile;
    });
    scheduleAuthUserProfileSync(nextProfileForAuth);
  }

  function clearUploadedAvatar() {
    let nextProfileForAuth: User | null = null;

    setDraft((current) => ({
      ...current,
      avatar: "",
    }));

    setProfile((current) => {
      const nextProfile = {
        ...current,
        avatar: "",
      };
      nextProfileForAuth = nextProfile;
      return nextProfile;
    });
    scheduleAuthUserProfileSync(nextProfileForAuth);
  }

  function updateLanguages(languages: LanguageProficiency[]) {
    setDraft((current) => {
      const nextProfile = {
        ...current,
        idiomas: languages,
      };

      showScoreReward("info", getBreakdownDelta(current, nextProfile, "info"));
      return nextProfile;
    });
  }

  function updateProfessionalProfile(nextProfile: CandidateProfessionalProfile) {
    setDraft((current) => ({
      ...current,
      professionalProfile: nextProfile,
    }));
  }

  function updateEducationProfile(nextProfile: CandidateEducationProfile) {
    setDraft((current) => {
      const nextEducationLabels = nextProfile.records
        .map((item) => item.degreeTitle.trim())
        .filter(Boolean);

      return {
        ...current,
        educationProfile: nextProfile,
        education: nextEducationLabels,
      };
    });
  }

  function updateCertificationProfile(nextProfile: CandidateCertificationProfile) {
    setDraft((current) => ({
      ...current,
      certificationProfile: nextProfile,
      certifications: nextProfile.records
        .map((item) => item.certificationName.trim())
        .filter(Boolean),
    }));
  }

  function updateWorkPreferences(nextPreferences: CandidateWorkPreferences) {
    setDraft((current) => ({
      ...current,
      workPreferences: nextPreferences,
    }));
  }

  function addArrayItem(field: keyof User, value: string) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return;
    }

    setDraft((current) => {
      const existingValues = Array.isArray(current[field]) ? (current[field] as string[]) : [];

      if (existingValues.includes(trimmedValue)) {
        return current;
      }

      if (field === "skills" && existingValues.length >= 20) {
        return current;
      }

      const nextProfile = {
        ...current,
        [field]: [...existingValues, trimmedValue],
        ...(field === "skills"
          ? {
              structuredSkills: [
                ...(current.structuredSkills ?? []),
                {
                  skillName: trimmedValue,
                  canonicalSkill: trimmedValue.toLowerCase().replace(/\s+/g, "_"),
                  skillLevel: "intermediate" as const,
                  yearsExperience: 1,
                  isCoreSkill: false,
                  evidenceSource: "manual",
                },
              ],
            }
          : {}),
      };

      const target = field === "skills" ? "skills" : field === "categoriasEnfoque" ? "categories" : null;
      if (target) {
        showScoreReward(target, getBreakdownDelta(current, nextProfile, target));
      }

      return nextProfile;
    });
  }

  function removeArrayItem(field: keyof User, value: string) {
    setDraft((current) => {
      const existingValues = Array.isArray(current[field]) ? (current[field] as string[]) : [];

      return {
        ...current,
        [field]: existingValues.filter((item) => item !== value),
        ...(field === "skills"
          ? {
              structuredSkills: (current.structuredSkills ?? []).filter(
                (item) => item.skillName !== value,
              ),
            }
          : {}),
      };
    });
  }

  function updateExperience(
    index: number,
    field: keyof User["experiencia"][number],
    value: string | boolean | number | string[],
  ) {
    if (
      (field === "rol" ||
        field === "empresa" ||
        field === "fechaInicio" ||
        field === "fechaFin") &&
      saveValidation.experienceItems[index]?.[field]
    ) {
      setSaveValidation((current) => ({
        ...current,
        experienceItems: {
          ...current.experienceItems,
          [index]: {
            ...current.experienceItems[index],
            [field]: undefined,
          },
        },
      }));
    }

    setDraft((current) => {
      const nextProfile = {
        ...current,
        experiencia: current.experiencia.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item,
        ),
      };

      showScoreReward("experience", getBreakdownDelta(current, nextProfile, "experience"));
      return nextProfile;
    });
  }

  function addExperience(newExperience: User["experiencia"][number]) {
    if (
      !newExperience.rol.trim() ||
      !newExperience.empresa.trim() ||
      !newExperience.fechaInicio?.trim()
    ) {
      return;
    }

    setDraft((current) => {
      const nextProfile = {
        ...current,
        experiencia: [...current.experiencia, newExperience],
      };

      showScoreReward("experience", getBreakdownDelta(current, nextProfile, "experience"));
      return nextProfile;
    });
  }

  function removeExperience(index: number) {
    setSaveValidation((current) => {
      const nextErrors: ExperienceValidationErrors = {};

      Object.entries(current.experienceItems).forEach(([rawIndex, value]) => {
        const numericIndex = Number(rawIndex);

        if (numericIndex === index) {
          return;
        }

        nextErrors[numericIndex > index ? numericIndex - 1 : numericIndex] = value;
      });

      return {
        ...current,
        experienceItems: nextErrors,
      };
    });

    setDraft((current) => ({
      ...current,
      experiencia: current.experiencia.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function handleEdit() {
    if (!canEdit) {
      return;
    }

    setDraft(profile);
    setSaveValidation(EMPTY_SAVE_VALIDATION_STATE);
    setIsEditing(true);
  }

  async function handleSave() {
    if (!canEdit) {
      return;
    }

    await syncAuthSessionFromServer();
    const latestAuthUser = getStoredAuthUser();
    if (!latestAuthUser || latestAuthUser.role !== "candidate" || latestAuthUser.id !== profile.id) {
      setSaveValidation({
        phone: null,
        experience: null,
        experienceItems: {},
        avatar: t("invalidSession"),
      });
      setSaveErrorSignal((current) => current + 1);
      return;
    }

    const normalizedPhone = (draft.telefono ?? "").trim();
    const phoneError =
      normalizedPhone && !isValidColombiaPhone(normalizedPhone)
        ? t("requiredField")
        : null;
    const { cleanedItems, errors: experienceItems } = validateExperienceItems(draft.experiencia);
    const hasExperienceErrors = Object.keys(experienceItems).length > 0;

    if (phoneError || hasExperienceErrors) {
      setSaveValidation({
        phone: phoneError,
        experience: hasExperienceErrors
          ? t("requiredExperience")
          : null,
        experienceItems,
        avatar: null,
      });
      setSaveErrorSignal((current) => current + 1);
      setPendingFocusTarget(phoneError ? "telefono-input" : "experience-section");
      return;
    }

    const nextProfile = {
      ...draft,
      telefono: normalizedPhone,
      experiencia: cleanedItems,
    };

    setSaveValidation(EMPTY_SAVE_VALIDATION_STATE);
    const response = await apiRequest<{ ok: boolean; user?: User }>("/api/profile/me", {
      method: "PATCH",
      body: JSON.stringify(nextProfile),
    });

    if (!response.ok || !response.data?.user) {
      const responseMessage =
        response.data && typeof response.data === "object" && "message" in response.data
          ? response.data.message
          : null;
      setSaveValidation({
        phone: null,
        experience: null,
        experienceItems: {},
        avatar:
          typeof responseMessage === "string" && responseMessage.trim()
            ? responseMessage
            : t("saveFailed"),
      });
      setSaveErrorSignal((current) => current + 1);
      return;
    }

    setProfile(response.data.user);
    setDraft(response.data.user);
    syncAuthUserProfile(response.data.user);
    setLastUpdatedAt(getProfileDateStorageValue());
    setIsEditing(false);
  }

  function handleCancel() {
    if (!canEdit) {
      return;
    }

    setDraft(profile);
    setSaveValidation(EMPTY_SAVE_VALIDATION_STATE);
    setIsEditing(false);
  }

  useProfileAssetValidation({
    profile,
    setDraft,
    setProfile,
    scheduleAuthUserProfileSync,
  });

  const isEditingEnabled = canEdit && isEditing;
  const activeProfile = isEditingEnabled ? draft : profile;
  const { vacancies: vacancyFeed } = useVacancyFeed(`vacancy-feed:${profile.id}`);
  const profileScoreBreakdown = getProfileScoreBreakdown(activeProfile);
  const referenceVacancy = useMemo(
    () => getReferenceVacancyForProfile(activeProfile, vacancyFeed),
    [activeProfile, vacancyFeed],
  );
  const fitSignals = useMemo(
    () => buildProfileFitSignals(activeProfile, referenceVacancy),
    [activeProfile, referenceVacancy],
  );
  const completionScore = profileScoreBreakdown.total;
  const overallMatchScore = getDynamicMatchScore(activeProfile);
  const savedMatchScore = getDynamicMatchScore(profile);
  const liveMatchDelta = overallMatchScore - savedMatchScore;
  const missingSkillsCount = fitSignals.filter(
    (skill) => skill.score < skill.target,
  ).length;
  const optimizationGain = Math.max(0, 100 - completionScore);
  const visibleForCompanies = true;
  const companyViews = 14 + activeProfile.experiencia.length * 4;
  const topPercentLabel =
    overallMatchScore >= 85 ? t("top20Candidates") : overallMatchScore >= 70 ? t("top35Candidates") : t("top55Candidates");
  const formattedLastUpdatedAt = formatProfileDate(lastUpdatedAt, isEnglish);
  const missingCoreFields = [
    activeProfile.nombre.trim() ? null : "nombre",
    activeProfile.rol.trim() ? null : "rol",
    isValidColombiaPhone(activeProfile.telefono) ? null : "telefono",
    sanitizeSummaryText(activeProfile.resumenPerfil ?? "") ? null : "resumen",
  ].filter(Boolean) as string[];
  const hasSkillsSectionData = activeProfile.skills.length > 0;
  const hasExperienceSectionData = activeProfile.experiencia.some((item) => !isEmptyExperienceItem(item));
  const normalizedWebsiteValue = (activeProfile.website ?? "").trim();
  const hasUserInfoSectionData =
    isValidColombiaPhone(activeProfile.telefono) ||
    (Boolean(normalizedWebsiteValue) && isValidWebsite(normalizedWebsiteValue)) ||
    Boolean(activeProfile.professionalProfile?.socialLinks?.x?.trim()) ||
    Boolean(activeProfile.professionalProfile?.socialLinks?.facebook?.trim()) ||
    Boolean(activeProfile.professionalProfile?.socialLinks?.instagram?.trim()) ||
    Boolean(activeProfile.professionalProfile?.socialLinks?.telegram?.trim()) ||
    Boolean(activeProfile.professionalProfile?.socialLinks?.linkedin?.trim()) ||
    Boolean(activeProfile.professionalProfile?.socialLinks?.github?.trim()) ||
    (activeProfile.idiomas?.length ?? 0) > 0;

  const optimizationActions = useMemo(
    () =>
      buildOptimizationActions({
        activeProfile,
        fitSignals,
        t,
        isEnglish,
      }),
    [activeProfile, fitSignals, isEnglish, t],
  );

  useEffect(() => {
    if (!pendingFocusTarget) {
      return;
    }

    const focusTarget = () => {
      const trigger = document.querySelector<HTMLElement>(`[data-profile-focus="${pendingFocusTarget}"]`);
      if (!trigger) {
        return false;
      }

      trigger.scrollIntoView({ behavior: "smooth", block: "center" });

      if (pendingFocusTarget === "skills-add-button" || pendingFocusTarget === "experience-add-button") {
        trigger.click();
        window.setTimeout(() => {
          const followUpTarget =
            pendingFocusTarget === "skills-add-button" ? "skills-input" : "experience-input";
          const followUp = document.querySelector<HTMLElement>(`[data-profile-focus="${followUpTarget}"]`);
          followUp?.focus();
        }, 180);
      } else if ("focus" in trigger) {
        window.setTimeout(() => trigger.focus(), 180);
      }

      setPendingFocusTarget(null);
      return true;
    };

    const timeoutId = window.setTimeout(focusTarget, isEditingEnabled ? 140 : 260);
    return () => window.clearTimeout(timeoutId);
  }, [isEditingEnabled, pendingFocusTarget]);

  if (!isEditingEnabled) {
    return (
      <CandidateProfileShowcase
        user={activeProfile}
        isDark={isDark}
        isEnglish={isEnglish}
        canEdit={canEdit}
        completionScore={completionScore}
        lastUpdatedAt={formattedLastUpdatedAt}
        optimizationActions={optimizationActions.map(({ key, title, impact }) => ({
          key,
          title,
          impact,
        }))}
        onEdit={handleEdit}
      />
    );
  }

  return (
    <UserProfilePageEditor
      activeProfile={activeProfile}
      isDark={isDark}
      canEdit={canEdit}
      isEditingEnabled={isEditingEnabled}
      collapsedSections={collapsedSections}
      scoreReward={scoreReward}
      saveValidation={saveValidation}
      saveErrorSignal={saveErrorSignal}
      summaryWordCount={summaryWordCount}
      completionScore={completionScore}
      overallMatchScore={overallMatchScore}
      missingSkillsCount={missingSkillsCount}
      optimizationGain={optimizationGain}
      visibleForCompanies={visibleForCompanies}
      companyViews={companyViews}
      topPercentLabel={topPercentLabel}
      liveMatchDelta={liveMatchDelta}
      missingCoreFields={missingCoreFields}
      formattedLastUpdatedAt={formattedLastUpdatedAt}
      referenceVacancy={referenceVacancy}
      hasExperienceSectionData={hasExperienceSectionData}
      hasSkillsSectionData={hasSkillsSectionData}
      hasUserInfoSectionData={hasUserInfoSectionData}
      onHandleEdit={handleEdit}
      onHandleSave={handleSave}
      onHandleCancel={handleCancel}
      onUpdateField={updateField}
      onUpdateUploadedAvatar={updateUploadedAvatar}
      onClearUploadedAvatar={clearUploadedAvatar}
      onUpdateUploadedCv={updateUploadedCv}
      onClearUploadedCv={clearUploadedCv}
      onToggleProfileSection={toggleProfileSection}
      onUpdateProfessionalProfile={updateProfessionalProfile}
      onUpdateEducationProfile={updateEducationProfile}
      onUpdateCertificationProfile={updateCertificationProfile}
      onUpdateWorkPreferences={updateWorkPreferences}
      onUpdateExperience={updateExperience}
      onAddExperience={addExperience}
      onRemoveExperience={removeExperience}
      onAddArrayItem={addArrayItem}
      onRemoveArrayItem={removeArrayItem}
      onUpdateLanguages={updateLanguages}
      onSummaryChange={(value) => {
        const nextValue = truncateSummaryText(value, 150);
        setSummaryWordCount(countSummaryWords(nextValue));
        updateField("resumenPerfil", nextValue);
      }}
    />
  );
}
