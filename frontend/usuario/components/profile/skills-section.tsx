import { useState } from "react";
import { EditCardToggleButton } from "@/components/profile/edit-card-toggle-button";
import { GlassCard } from "@/components/ui/glass-card";
import { ScoreGainBadge } from "@/components/ui/score-gain-badge";
import { TagPill } from "@/components/ui/tag-pill";
import { SKILLS_CATALOG } from "@/data/skills-catalog";
import { useUiCopy } from "@/lib/i18n/ui-copy";
import { getProfileUi } from "@/lib/ui/profile-classes";

const MAX_SKILLS = 20;

type SkillsSectionProps = {
  skills: string[];
  isDark: boolean;
  isEditing: boolean;
  isCollapsed?: boolean;
  rewardPoints?: number;
  onToggleCollapse?: () => void;
  onAdd: (value: string) => void;
  onRemove: (skill: string) => void;
};

export function SkillsSection({
  skills,
  isDark,
  isEditing,
  isCollapsed = false,
  rewardPoints = 0,
  onToggleCollapse,
  onAdd,
  onRemove,
}: SkillsSectionProps) {
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [skillQuery, setSkillQuery] = useState("");
  const t = useUiCopy("profile");
  const profileUi = getProfileUi(isDark);
  const skillOptions = SKILLS_CATALOG;
  const normalizedSkillQuery = skillQuery
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const filteredSkillOptions = skillOptions
    .filter((option) => !skills.includes(option))
    .filter((option) => {
      if (!normalizedSkillQuery) {
        return true;
      }

      return option
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(normalizedSkillQuery);
    })
    .slice(0, normalizedSkillQuery ? 8 : 6);
  const canAddMoreSkills = skills.length < MAX_SKILLS;

  return (
    <GlassCard isDark={isDark} className="relative p-6" data-profile-focus="skills-section">
      <ScoreGainBadge isDark={isDark} points={rewardPoints} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-950"}`}>{t("skillsTitle")}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {isEditing ? (
            <button
              type="button"
              onClick={() => setIsAddingSkill(true)}
              className={`${profileUi.buttonSecondary} px-4 py-2`}
              data-profile-focus="skills-add-button"
              disabled={!canAddMoreSkills}
            >
              {canAddMoreSkills ? t("addSkill") : t("skillLimit", { count: MAX_SKILLS })}
            </button>
          ) : null}
          {isEditing && onToggleCollapse ? (
            <EditCardToggleButton isCollapsed={isCollapsed} isDark={isDark} onClick={onToggleCollapse} />
          ) : null}
        </div>
      </div>
      {isEditing && isCollapsed ? null : isEditing ? (
        <div className="mt-4 space-y-4">
          {isAddingSkill ? (
            <div className={`${profileUi.sectionCard} p-4`}>
              <label className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {t("searchSkill")}
              </label>
              <input
                type="text"
                value={skillQuery}
                onChange={(event) => setSkillQuery(event.target.value)}
                className={`mt-2 ${profileUi.input}`}
                data-profile-focus="skills-input"
                placeholder={t("searchSkillPlaceholder")}
              />
              <p className={`mt-2 text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                {t("searchSkillHelp", { count: MAX_SKILLS })}
              </p>
              <div className="mt-3 grid gap-2">
                {filteredSkillOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onAdd(option);
                      setIsAddingSkill(false);
                      setSkillQuery("");
                    }}
                    className={isDark ? "rounded-[1rem] border border-cyan-300/16 bg-white/6 px-3 py-2 text-left text-sm text-slate-100 transition hover:border-cyan-300/28 hover:bg-white/10" : "rounded-[1rem] border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"}
                  >
                    {option}
                  </button>
                ))}
                {normalizedSkillQuery && filteredSkillOptions.length === 0 ? (
                  <div className={isDark ? "rounded-[1rem] border border-white/8 bg-white/4 px-3 py-2 text-sm text-slate-300" : "rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"}>
                    {t("noSkillMatches", { query: skillQuery })}
                  </div>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSkill(false);
                    setSkillQuery("");
                  }}
                  className={`${profileUi.buttonSecondary} px-4 py-2`}
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2.5">
            {skills.map((skill) => (
              <TagPill
                key={skill}
                tone="match"
                isDark={isDark}
                action={
                  <button
                    type="button"
                    onClick={() => onRemove(skill)}
                    className={isDark ? "inline-flex h-5 w-5 items-center justify-center rounded-full border border-cyan-300/24 bg-white/8 text-xs font-semibold text-cyan-100 transition hover:bg-white/14" : "inline-flex h-5 w-5 items-center justify-center rounded-full border border-sky-300 bg-white text-xs font-semibold text-sky-700 transition hover:bg-sky-100"}
                  >
                    x
                  </button>
                }
              >
                {skill}
              </TagPill>
            ))}
          </div>
          <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {t("skillsCount", { current: skills.length, total: MAX_SKILLS })}
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2.5">
          {skills.map((skill) => (
            <TagPill key={skill} tone="match" isDark={isDark}>
              {skill}
            </TagPill>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
