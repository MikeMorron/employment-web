"use client";

import { useEffect, useRef, useState } from "react";
import { EditCardToggleButton } from "@/components/profile/edit-card-toggle-button";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreGainBadge } from "@/components/ui/score-gain-badge";
import {
  colombiaDepartments,
  colombiaMunicipalities,
  vacancyCategoriesByLocale,
} from "@/data/colombia-locations";
import { getProfileUi } from "@/lib/ui/profile-classes";
import {
  EMPTY_CERTIFICATION_DRAFT,
  EMPTY_EDUCATION_DRAFT,
  SENIORITY_LABEL_MAP,
  type CertificationDraft,
  type EducationDraft,
} from "@/components/profile/candidate-match-profile/constants";
import {
} from "@/components/profile/candidate-match-profile/shared";
import {
  PreferencesSection,
  ProfessionalProfileSection,
} from "@/components/profile/candidate-match-profile/edit-sections";
import {
  CertificationPopup,
  EducationPopup,
  resetCertificationPopupState,
  resetEducationPopupState,
} from "@/components/profile/candidate-match-profile/popups";
import {
} from "@/components/profile/candidate-match-profile/utils";
import {
  addPreferredLocationValue,
  buildAllowedSections,
  buildNextCertificationProfile,
  buildNextEducationProfile,
  buildPreferenceSummaryItems,
  buildProfessionalSummaryItems,
  uploadCertificationImageAsset,
} from "@/components/profile/candidate-match-profile/logic";
import * as MatchingSections from "@/components/profile/candidate-match-profile/sections";
import type {
  CandidateCertificationProfile,
  CandidateEducationProfile,
  CandidateProfessionalProfile,
  CandidateWorkPreferences,
} from "@/types/profile";
import type { User } from "@/types/user";

type CandidateMatchProfileSectionProps = {
  user: User;
  isDark: boolean;
  isEditing: boolean;
  isCollapsed?: boolean;
  rewardPoints?: number;
  cardEyebrow?: string;
  cardDescription?: string;
  visibleSections?: Array<"professional" | "preferences" | "education" | "certifications">;
  onToggleCollapse?: () => void;
  onProfessionalProfileChange: (value: CandidateProfessionalProfile) => void;
  onEducationProfileChange: (value: CandidateEducationProfile) => void;
  onCertificationProfileChange: (value: CandidateCertificationProfile) => void;
  onWorkPreferencesChange: (value: CandidateWorkPreferences) => void;
};

export function CandidateMatchProfileSection({
  user,
  isDark,
  isEditing,
  isCollapsed = false,
  rewardPoints = 0,
  cardEyebrow,
  cardDescription,
  visibleSections,
  onToggleCollapse,
  onProfessionalProfileChange,
  onEducationProfileChange,
  onCertificationProfileChange,
  onWorkPreferencesChange,
}: CandidateMatchProfileSectionProps) {
  const profileUi = getProfileUi(isDark);
  const careerDropdownRef = useRef<HTMLLabelElement | null>(null);
  const focusAreaDropdownRef = useRef<HTMLLabelElement | null>(null);
  const professionalProfile = user.professionalProfile ?? {
    preferredRoleTitles: [],
  };
  const educationProfile = user.educationProfile ?? { records: [] };
  const certificationProfile = user.certificationProfile ?? { records: [] };
  const workPreferences = user.workPreferences ?? {
    preferredWorkModes: [],
    preferredLocations: [],
    preferredEmploymentTypes: [],
  };
  const yearsOptions = [
    { value: "", label: "Sin experiencia" },
    ...Array.from({ length: 9 }, (_, index) => ({
      value: String(index + 1),
      label: String(index + 1),
    })),
    { value: "10", label: "+10" },
  ];
  const roleOptions = vacancyCategoriesByLocale.es.filter((option) => option !== "Todos" && option !== "Todas");
  const locationDepartments = colombiaDepartments.filter((item) => item !== "Todos");
  const [selectedPreferredDepartment, setSelectedPreferredDepartment] = useState("");
  const [selectedPreferredCity, setSelectedPreferredCity] = useState("");
  const [showPreferredRolePicker, setShowPreferredRolePicker] = useState(false);
  const [preferredRoleQuery, setPreferredRoleQuery] = useState("");
  const [showEducationPopup, setShowEducationPopup] = useState(false);
  const [showCertificationPopup, setShowCertificationPopup] = useState(false);
  const [educationDraft, setEducationDraft] = useState<EducationDraft>(EMPTY_EDUCATION_DRAFT);
  const [educationCareerQuery, setEducationCareerQuery] = useState("");
  const [educationFocusAreaQuery, setEducationFocusAreaQuery] = useState("");
  const [showCareerOptions, setShowCareerOptions] = useState(false);
  const [showFocusAreaOptions, setShowFocusAreaOptions] = useState(false);
  const [certificationDraft, setCertificationDraft] = useState<CertificationDraft>(EMPTY_CERTIFICATION_DRAFT);
  const [educationErrors, setEducationErrors] = useState<Partial<Record<"educationType" | "institutionName" | "startDate" | "endDate" | "region" | "city", boolean>>>({});
  const [certificationErrors, setCertificationErrors] = useState<Partial<Record<"issuer" | "certificationName" | "startedAt" | "completedAt" | "proofImageName", boolean>>>({});
  const [isCertificationUploading, setIsCertificationUploading] = useState(false);
  const [uploadingCertificationName, setUploadingCertificationName] = useState("");
  const [previewCertificationImage, setPreviewCertificationImage] = useState<{
    src: string;
    title: string;
  } | null>(null);
  const certificationFileInputRef = useRef<HTMLInputElement | null>(null);
  const filteredPreferredRoleOptions = roleOptions
    .filter((option) => !(professionalProfile.preferredRoleTitles ?? []).includes(option))
    .filter((option) =>
      preferredRoleQuery.trim()
        ? option.toLowerCase().includes(preferredRoleQuery.trim().toLowerCase())
        : true,
    )
    .slice(0, 3);

  const preferredCityOptions = selectedPreferredDepartment
    ? (colombiaMunicipalities[selectedPreferredDepartment] ?? []).filter((item) => item !== "Todos")
    : [];

  const educationCityOptions = educationDraft.region
    ? (colombiaMunicipalities[educationDraft.region] ?? []).filter((item) => item !== "Todos")
    : [];

  useEffect(() => {
    if (!showEducationPopup) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (careerDropdownRef.current && !careerDropdownRef.current.contains(target)) {
        setShowCareerOptions(false);
      }

      if (focusAreaDropdownRef.current && !focusAreaDropdownRef.current.contains(target)) {
        setShowFocusAreaOptions(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowCareerOptions(false);
        setShowFocusAreaOptions(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showEducationPopup]);

  const uploadCertificationImage = async (file: File) => {
    setIsCertificationUploading(true);
    setCertificationErrors((current) => ({ ...current, proofImageName: false }));

    try {
      const { provisionalName, payload } = await uploadCertificationImageAsset({
        issuer: certificationDraft.issuer,
        certificationName: certificationDraft.certificationName,
        firstName: user.nombre,
        file,
      });
      setUploadingCertificationName(provisionalName);

      setCertificationDraft((current) => ({
        ...current,
        proofImageName: payload.displayFileName,
        proofImageAssetId: payload.assetId,
        proofImageAssetPublicId: payload.assetPublicId,
        proofImageUrl: payload.fullUrl,
        proofImageThumbnailUrl: payload.thumbUrl,
        proofImageStoredFileName: "",
        proofImageThumbnailStoredFileName: "",
      }));
    } catch {
      setCertificationDraft((current) => ({
        ...current,
        proofImageName: "",
        proofImageAssetId: "",
        proofImageAssetPublicId: "",
        proofImageUrl: "",
        proofImageThumbnailUrl: "",
        proofImageStoredFileName: "",
        proofImageThumbnailStoredFileName: "",
      }));
      setCertificationErrors((current) => ({ ...current, proofImageName: true }));
    } finally {
      setIsCertificationUploading(false);
      setUploadingCertificationName("");
    }
  };

  const professionalSummaryItems = buildProfessionalSummaryItems(
    professionalProfile,
    SENIORITY_LABEL_MAP,
  );
  const preferenceSummaryItems = buildPreferenceSummaryItems(workPreferences);
  const hasProfessionalSectionData = professionalSummaryItems.some(Boolean);
  const hasPreferencesSectionData = preferenceSummaryItems.some(Boolean);
  const hasEducationSectionData = educationProfile.records.length > 0;
  const hasCertificationSectionData = certificationProfile.records.length > 0;
  const allowedSections = buildAllowedSections(visibleSections);
  const showProfessionalSection = allowedSections.has("professional");
  const showPreferencesSection = allowedSections.has("preferences");
  const showEducationSection = allowedSections.has("education");
  const showCertificationSection = allowedSections.has("certifications");
  const hasAnyMatchingData =
    (showProfessionalSection && hasProfessionalSectionData) ||
    (showPreferencesSection && hasPreferencesSectionData) ||
    (showEducationSection && hasEducationSectionData) ||
    (showCertificationSection && hasCertificationSectionData);

  const updateProfessionalProfile = (
    field: keyof CandidateProfessionalProfile,
    value: string | boolean | number | string[] | undefined,
  ) => {
    onProfessionalProfileChange({
      ...professionalProfile,
      [field]: value,
    });
  };

  const updateWorkPreferences = (
    field: keyof CandidateWorkPreferences,
    value: string | boolean | number | string[],
  ) => {
    onWorkPreferencesChange({
      ...workPreferences,
      [field]: value,
    });
  };

  const addPreferredLocation = () => {
    if (!selectedPreferredDepartment || !selectedPreferredCity) {
      return;
    }

    const currentValues = workPreferences.preferredLocations ?? [];
    const nextValues = addPreferredLocationValue(
      selectedPreferredDepartment,
      selectedPreferredCity,
      currentValues,
    );
    if (nextValues === currentValues) {
      return;
    }

    updateWorkPreferences("preferredLocations", nextValues);
    setSelectedPreferredDepartment("");
    setSelectedPreferredCity("");
  };

  const confirmEducation = () => {
    const nextErrors = {
      educationType: !educationDraft.educationType,
      institutionName: !educationDraft.institutionName.trim(),
      startDate: !educationDraft.startDate,
      endDate: !educationDraft.endDate,
      region: !educationDraft.region,
      city: !educationDraft.city,
    };

    setEducationErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    onEducationProfileChange(
      buildNextEducationProfile(educationProfile, educationDraft),
    );
    setEducationErrors({});
    setEducationDraft(EMPTY_EDUCATION_DRAFT);
    setEducationCareerQuery("");
    setEducationFocusAreaQuery("");
    setShowCareerOptions(false);
    setShowFocusAreaOptions(false);
    setShowEducationPopup(false);
  };

  const confirmCertification = () => {
    const nextErrors = {
      issuer: !certificationDraft.issuer.trim(),
      certificationName: !certificationDraft.certificationName.trim(),
      startedAt: !certificationDraft.startedAt,
      completedAt: !certificationDraft.completedAt,
      proofImageName: !certificationDraft.proofImageAssetPublicId || !certificationDraft.proofImageThumbnailUrl,
    };

    setCertificationErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean) || isCertificationUploading) {
      return;
    }

    onCertificationProfileChange(
      buildNextCertificationProfile(certificationProfile, certificationDraft),
    );
    setCertificationErrors({});
    setCertificationDraft(EMPTY_CERTIFICATION_DRAFT);
    setShowCertificationPopup(false);
  };

  const removeEducationRecord = (index: number) => {
    onEducationProfileChange({
      ...educationProfile,
      records: educationProfile.records.filter((_, itemIndex) => itemIndex !== index),
    });
  };

  const removeCertificationRecord = (index: number) => {
    onCertificationProfileChange({
      records: certificationProfile.records.filter((_, itemIndex) => itemIndex !== index),
    });
  };

  if (!isEditing && !hasAnyMatchingData) {
    return null;
  }

  return (
    <>
      <GlassCard isDark={isDark} className="relative p-6">
        <ScoreGainBadge isDark={isDark} points={rewardPoints} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={isDark ? "text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200" : "text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700"}>
              {cardEyebrow ?? "Perfil para matching"}
            </p>
            {cardDescription ? (
              <p className={isDark ? "mt-2 max-w-3xl text-sm text-slate-300" : "mt-2 max-w-3xl text-sm text-slate-600"}>
                {cardDescription}
              </p>
            ) : null}
          </div>
          {isEditing && onToggleCollapse ? (
            <EditCardToggleButton isCollapsed={isCollapsed} isDark={isDark} onClick={onToggleCollapse} />
          ) : null}
        </div>

        {isEditing && isCollapsed ? null : (
        <div className="mt-4 grid gap-6">
          {showProfessionalSection && (isEditing || hasProfessionalSectionData) ? (
            <ProfessionalProfileSection
              isDark={isDark}
              isEditing={isEditing}
              profileUi={profileUi}
              roleOptions={roleOptions}
              yearsOptions={yearsOptions}
              professionalProfile={professionalProfile}
              professionalSummaryItems={professionalSummaryItems}
              showPreferredRolePicker={showPreferredRolePicker}
              preferredRoleQuery={preferredRoleQuery}
              filteredPreferredRoleOptions={filteredPreferredRoleOptions}
              onTogglePreferredRolePicker={() => setShowPreferredRolePicker((current) => !current)}
              onPreferredRoleQueryChange={setPreferredRoleQuery}
              onUpdateProfessionalProfile={updateProfessionalProfile}
            />
          ) : null}

          {showPreferencesSection && (isEditing || hasPreferencesSectionData) ? (
            <PreferencesSection
              isDark={isDark}
              isEditing={isEditing}
              profileUi={profileUi}
              locationDepartments={locationDepartments}
              preferredCityOptions={preferredCityOptions}
              selectedPreferredDepartment={selectedPreferredDepartment}
              selectedPreferredCity={selectedPreferredCity}
              preferenceSummaryItems={preferenceSummaryItems}
              workPreferences={workPreferences}
              onSelectedPreferredDepartmentChange={(value) => {
                setSelectedPreferredDepartment(value);
                setSelectedPreferredCity("");
              }}
              onSelectedPreferredCityChange={setSelectedPreferredCity}
              onAddPreferredLocation={addPreferredLocation}
              onUpdateWorkPreferences={updateWorkPreferences}
            />
          ) : null}

          {showEducationSection && (isEditing || hasEducationSectionData) ? (
            <MatchingSections.CandidateEducationSection
              isDark={isDark}
              isEditing={isEditing}
              sectionCardClassName={profileUi.sectionCard}
              addButtonClassName={profileUi.buttonSecondary}
              records={educationProfile.records}
              onAdd={() => setShowEducationPopup(true)}
              onRemove={removeEducationRecord}
            />
          ) : null}

          {showCertificationSection && (isEditing || hasCertificationSectionData) ? (
            <MatchingSections.CandidateCertificationSection
              isDark={isDark}
              isEditing={isEditing}
              sectionCardClassName={profileUi.sectionCard}
              addButtonClassName={profileUi.buttonSecondary}
              records={certificationProfile.records}
              onAdd={() => setShowCertificationPopup(true)}
              onRemove={removeCertificationRecord}
              onPreview={setPreviewCertificationImage}
            />
          ) : null}
        </div>
        )}
      </GlassCard>

      <EducationPopup
        isDark={isDark}
        profileUi={profileUi}
        showEducationPopup={showEducationPopup}
        educationDraft={educationDraft}
        educationErrors={educationErrors}
        educationCareerQuery={educationCareerQuery}
        educationFocusAreaQuery={educationFocusAreaQuery}
        showCareerOptions={showCareerOptions}
        showFocusAreaOptions={showFocusAreaOptions}
        locationDepartments={locationDepartments}
        educationCityOptions={educationCityOptions}
        careerDropdownRef={careerDropdownRef}
        focusAreaDropdownRef={focusAreaDropdownRef}
        onCancel={() =>
          resetEducationPopupState({
            onEducationErrorsChange: setEducationErrors,
            onEducationDraftChange: setEducationDraft,
            onEducationCareerQueryChange: setEducationCareerQuery,
            onEducationFocusAreaQueryChange: setEducationFocusAreaQuery,
            onShowCareerOptionsChange: setShowCareerOptions,
            onShowFocusAreaOptionsChange: setShowFocusAreaOptions,
            onShowEducationPopupChange: setShowEducationPopup,
          })
        }
        onConfirm={confirmEducation}
        onEducationDraftChange={setEducationDraft}
        onEducationErrorsChange={setEducationErrors}
        onEducationCareerQueryChange={setEducationCareerQuery}
        onEducationFocusAreaQueryChange={setEducationFocusAreaQuery}
        onShowCareerOptionsChange={setShowCareerOptions}
        onShowFocusAreaOptionsChange={setShowFocusAreaOptions}
      />

      <CertificationPopup
        isDark={isDark}
        profileUi={profileUi}
        showCertificationPopup={showCertificationPopup}
        certificationDraft={certificationDraft}
        certificationErrors={certificationErrors}
        isCertificationUploading={isCertificationUploading}
        uploadingCertificationName={uploadingCertificationName}
        certificationFileInputRef={certificationFileInputRef}
        onCancel={() =>
          resetCertificationPopupState({
            onCertificationErrorsChange: setCertificationErrors,
            onIsCertificationUploadingChange: setIsCertificationUploading,
            onUploadingCertificationNameChange: setUploadingCertificationName,
            onCertificationDraftChange: setCertificationDraft,
            onShowCertificationPopupChange: setShowCertificationPopup,
          })
        }
        onConfirm={confirmCertification}
        onUploadCertificationImage={uploadCertificationImage}
        onCertificationDraftChange={setCertificationDraft}
        onCertificationErrorsChange={setCertificationErrors}
        onPreviewCertificationImageChange={setPreviewCertificationImage}
      />

      <MatchingSections.CandidateCertificationPreviewModal
        isDark={isDark}
        previewCertificationImage={previewCertificationImage}
        onClose={() => setPreviewCertificationImage(null)}
      />
    </>
  );
}
