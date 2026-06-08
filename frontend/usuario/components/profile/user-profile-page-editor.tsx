"use client";

import { CandidateMatchProfileSection } from "@/components/profile/candidate-match-profile-section";
import { ExperienceSection } from "@/components/profile/experience-section";
import { JobFitSection } from "@/components/profile/job-fit-section";
import { ProfileHeader } from "@/components/profile/profile-header";
import { SkillsSection } from "@/components/profile/skills-section";
import { UserInfo } from "@/components/profile/user-info";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreGainBadge } from "@/components/ui/score-gain-badge";
import type {
  CandidateCertificationProfile,
  CandidateEducationProfile,
  CandidateProfessionalProfile,
  CandidateWorkPreferences,
  LanguageProficiency,
} from "@/types/profile";
import type { User } from "@/types/user";
import type {
  SaveValidationState,
} from "@/components/profile/user-profile-page-utils";
import type {
  ProfileRewardTarget,
  ProfileSectionKey,
} from "@/components/profile/user-profile-page-helpers";
import type { Vacancy } from "@/types/vacancy";

export function UserProfilePageEditor({
  activeProfile,
  isDark,
  canEdit,
  isEditingEnabled,
  collapsedSections,
  scoreReward,
  saveValidation,
  saveErrorSignal,
  summaryWordCount,
  completionScore,
  overallMatchScore,
  missingSkillsCount,
  optimizationGain,
  visibleForCompanies,
  companyViews,
  topPercentLabel,
  liveMatchDelta,
  missingCoreFields,
  formattedLastUpdatedAt,
  referenceVacancy,
  hasExperienceSectionData,
  hasSkillsSectionData,
  hasUserInfoSectionData,
  onHandleEdit,
  onHandleSave,
  onHandleCancel,
  onUpdateField,
  onUpdateUploadedAvatar,
  onClearUploadedAvatar,
  onUpdateUploadedCv,
  onClearUploadedCv,
  onToggleProfileSection,
  onUpdateProfessionalProfile,
  onUpdateEducationProfile,
  onUpdateCertificationProfile,
  onUpdateWorkPreferences,
  onUpdateExperience,
  onAddExperience,
  onRemoveExperience,
  onAddArrayItem,
  onRemoveArrayItem,
  onUpdateLanguages,
  onSummaryChange,
}: {
  activeProfile: User;
  isDark: boolean;
  canEdit: boolean;
  isEditingEnabled: boolean;
  collapsedSections: Record<ProfileSectionKey, boolean>;
  scoreReward: { target: ProfileRewardTarget; points: number } | null;
  saveValidation: SaveValidationState;
  saveErrorSignal: number;
  summaryWordCount: number;
  completionScore: number;
  overallMatchScore: number;
  missingSkillsCount: number;
  optimizationGain: number;
  visibleForCompanies: boolean;
  companyViews: number;
  topPercentLabel: string;
  liveMatchDelta: number;
  missingCoreFields: string[];
  formattedLastUpdatedAt: string;
  referenceVacancy: Vacancy | null;
  hasExperienceSectionData: boolean;
  hasSkillsSectionData: boolean;
  hasUserInfoSectionData: boolean;
  onHandleEdit: () => void;
  onHandleSave: () => Promise<void>;
  onHandleCancel: () => void;
  onUpdateField: (field: keyof User, value: string) => void;
  onUpdateUploadedAvatar: (avatarUrl: string) => void;
  onClearUploadedAvatar: () => void;
  onUpdateUploadedCv: (value: { fileName: string; downloadUrl?: string }) => void;
  onClearUploadedCv: () => void;
  onToggleProfileSection: (section: ProfileSectionKey) => void;
  onUpdateProfessionalProfile: (value: CandidateProfessionalProfile) => void;
  onUpdateEducationProfile: (value: CandidateEducationProfile) => void;
  onUpdateCertificationProfile: (value: CandidateCertificationProfile) => void;
  onUpdateWorkPreferences: (value: CandidateWorkPreferences) => void;
  onUpdateExperience: (
    index: number,
    field: keyof User["experiencia"][number],
    value: string | boolean | number | string[],
  ) => void;
  onAddExperience: (newExperience: User["experiencia"][number]) => void;
  onRemoveExperience: (index: number) => void;
  onAddArrayItem: (field: keyof User, value: string) => void;
  onRemoveArrayItem: (field: keyof User, value: string) => void;
  onUpdateLanguages: (languages: LanguageProficiency[]) => void;
  onSummaryChange: (value: string) => void;
}) {
  return (
    <div className="relative isolate space-y-6 overflow-hidden">
      <div
        aria-hidden="true"
        className={isDark
          ? "pointer-events-none absolute inset-x-0 top-0 -z-10 h-[24rem] bg-[radial-gradient(circle_at_top_left,rgba(13,99,255,0.18),transparent_38%),radial-gradient(circle_at_top_right,rgba(246,196,83,0.14),transparent_32%),radial-gradient(circle_at_50%_22%,rgba(255,90,103,0.10),transparent_28%)]"
          : "pointer-events-none absolute inset-x-0 top-0 -z-10 h-[24rem] bg-[radial-gradient(circle_at_top_left,rgba(13,99,255,0.14),transparent_38%),radial-gradient(circle_at_top_right,rgba(246,196,83,0.16),transparent_34%),radial-gradient(circle_at_50%_18%,rgba(255,90,103,0.10),transparent_30%)]"}
      />
      <ProfileHeader
        user={activeProfile}
        isDark={isDark}
        completionScore={completionScore}
        lastUpdatedAt={formattedLastUpdatedAt}
        visibleForCompanies={visibleForCompanies}
        companyViews={companyViews}
        topPercentLabel={topPercentLabel}
        liveMatchDelta={liveMatchDelta}
        missingCoreFields={missingCoreFields}
        rewardPoints={scoreReward?.target === "header" ? scoreReward.points : 0}
        isEditing={isEditingEnabled}
        canEdit={canEdit}
        avatarError={saveValidation.avatar}
        onEdit={onHandleEdit}
        onSave={onHandleSave}
        onCancel={onHandleCancel}
        onFieldChange={onUpdateField}
        onAvatarUploaded={onUpdateUploadedAvatar}
        onAvatarRemoved={onClearUploadedAvatar}
      />
      <GlassCard isDark={isDark} className="relative p-6">
        <ScoreGainBadge isDark={isDark} points={scoreReward?.target === "summary" ? scoreReward.points : 0} />
        <div>
          <p className={isDark ? "text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200" : "text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700"}>
            Resumen
          </p>
        </div>
        <div className="mt-4">
          <textarea
            value={activeProfile.resumenPerfil ?? ""}
            onChange={(event) => onSummaryChange(event.target.value)}
            placeholder="Describe tu experiencia, enfoque y logros..."
            rows={8}
            className={`min-h-[240px] w-full resize-y rounded-[1.25rem] border px-4 py-4 text-sm leading-7 outline-none transition sm:text-base ${
              isDark
                ? "border-white/10 bg-slate-950/40 text-slate-100 placeholder:text-slate-500 focus:border-cyan-300/40"
                : "border-sky-100 bg-white/95 text-slate-700 placeholder:text-slate-400 focus:border-sky-300"
            }`}
          />
          <p className={`mt-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {summaryWordCount}/150 palabras
          </p>
        </div>
      </GlassCard>
      <CandidateMatchProfileSection
        user={activeProfile}
        isDark={isDark}
        isEditing={isEditingEnabled}
        isCollapsed={collapsedSections.matching}
        cardEyebrow="1. Perfil base"
        cardDescription="Identidad profesional del candidato para definir encaje inicial."
        visibleSections={["professional"]}
        onToggleCollapse={() => onToggleProfileSection("matching")}
        onProfessionalProfileChange={onUpdateProfessionalProfile}
        onEducationProfileChange={onUpdateEducationProfile}
        onCertificationProfileChange={onUpdateCertificationProfile}
        onWorkPreferencesChange={onUpdateWorkPreferences}
      />
      <JobFitSection
        user={activeProfile}
        isDark={isDark}
        overallMatchScore={overallMatchScore}
        missingSkillsCount={missingSkillsCount}
        optimizationGain={optimizationGain}
        isEditing={isEditingEnabled}
        isCollapsed={collapsedSections.jobFit}
        cvRewardPoints={scoreReward?.target === "cv" ? scoreReward.points : 0}
        referenceJob={referenceVacancy}
        onToggleCollapse={() => onToggleProfileSection("jobFit")}
        onFieldChange={onUpdateField}
        onCvUploaded={onUpdateUploadedCv}
        onCvRemoved={onClearUploadedCv}
      />
      <CandidateMatchProfileSection
        user={activeProfile}
        isDark={isDark}
        isEditing={isEditingEnabled}
        cardEyebrow="2. Match & objetivo laboral"
        cardDescription="Condiciones clave del candidato para la vacante: ubicación, fecha y modalidad."
        visibleSections={["preferences"]}
        onProfessionalProfileChange={onUpdateProfessionalProfile}
        onEducationProfileChange={onUpdateEducationProfile}
        onCertificationProfileChange={onUpdateCertificationProfile}
        onWorkPreferencesChange={onUpdateWorkPreferences}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.28fr)_minmax(360px,0.72fr)] xl:items-start">
        <div className="space-y-6">
          {isEditingEnabled || hasExperienceSectionData ? (
            <ExperienceSection
              experience={activeProfile.experiencia}
              isDark={isDark}
              isEditing={isEditingEnabled}
              isCollapsed={collapsedSections.experience}
              rewardPoints={scoreReward?.target === "experience" ? scoreReward.points : 0}
              hasError={Boolean(saveValidation.experience)}
              errorMessage={saveValidation.experience ?? undefined}
              errorSignal={saveErrorSignal}
              fieldErrors={saveValidation.experienceItems}
              onToggleCollapse={() => onToggleProfileSection("experience")}
              onChange={onUpdateExperience}
              onAdd={onAddExperience}
              onRemove={onRemoveExperience}
            />
          ) : null}
          <div className="space-y-3">
            <div>
              <p className={isDark ? "text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200" : "text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700"}>
                4. Habilidades
              </p>
              <h2 className={isDark ? "mt-1 text-lg font-semibold text-white" : "mt-1 text-lg font-semibold text-slate-950"}>
                Habilidades
              </h2>
            </div>
            {isEditingEnabled || hasSkillsSectionData ? (
              <SkillsSection
                skills={activeProfile.skills}
                isDark={isDark}
                isEditing={isEditingEnabled}
                isCollapsed={collapsedSections.skills}
                rewardPoints={scoreReward?.target === "skills" ? scoreReward.points : 0}
                onToggleCollapse={() => onToggleProfileSection("skills")}
                onAdd={(value) => onAddArrayItem("skills", value)}
                onRemove={(value) => onRemoveArrayItem("skills", value)}
              />
            ) : null}
          </div>
          <CandidateMatchProfileSection
            user={activeProfile}
            isDark={isDark}
            isEditing={isEditingEnabled}
            cardEyebrow="5. Estudios"
            cardDescription="Formación académica y certificaciones que respaldan el perfil."
            visibleSections={["education", "certifications"]}
            onProfessionalProfileChange={onUpdateProfessionalProfile}
            onEducationProfileChange={onUpdateEducationProfile}
            onCertificationProfileChange={onUpdateCertificationProfile}
            onWorkPreferencesChange={onUpdateWorkPreferences}
          />
          {isEditingEnabled || hasUserInfoSectionData ? (
            <UserInfo
              user={activeProfile}
              isDark={isDark}
              isEditing={isEditingEnabled}
              isCollapsed={collapsedSections.info}
              rewardPoints={scoreReward?.target === "info" ? scoreReward.points : 0}
              phoneRequiredError={saveValidation.phone}
              phoneErrorSignal={saveErrorSignal}
              onToggleCollapse={() => onToggleProfileSection("info")}
              onFieldChange={onUpdateField}
              onProfessionalProfileChange={onUpdateProfessionalProfile}
              onLanguagesChange={onUpdateLanguages}
            />
          ) : null}
        </div>
        <aside className="space-y-4 xl:sticky xl:top-6">
        </aside>
      </div>
    </div>
  );
}
