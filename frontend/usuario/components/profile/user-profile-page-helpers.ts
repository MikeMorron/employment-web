import { isValidColombiaPhone, isValidWebsite } from "@/lib/profile-form";
import type { User } from "@/types/user";

export const MATCH_ACTION_SKILL_MAP: Record<string, string> = {
  "Azure Architecture": "Arquitectura Azure",
  "DevOps / CI-CD": "CI/CD",
  "Infraestructura como codigo": "Terraform",
  Kubernetes: "Kubernetes",
  Observabilidad: "Observabilidad",
  "Liderazgo tecnico": "Liderazgo tecnico",
};

export type ProfileSectionKey =
  | "editorOverview"
  | "jobFit"
  | "matching"
  | "skills"
  | "categories"
  | "experience"
  | "info"
  | "optimization"
  | "comparison";

export type ProfileRewardTarget =
  | "header"
  | "summary"
  | "skills"
  | "categories"
  | "experience"
  | "info"
  | "cv";

export type OptimizationAction = {
  key: string;
  title: string;
  impact: string;
  button: string;
  target: string;
  priority: number;
};

export function buildOptimizationActions({
  activeProfile,
  fitSignals,
  t,
  isEnglish,
}: {
  activeProfile: User;
  fitSignals: Array<{ label: string; score: number; target: number }>;
  t: (key: string, values?: Record<string, string | number>) => string;
  isEnglish: boolean;
}) {
  const actions: OptimizationAction[] = [];

  if (!isValidColombiaPhone(activeProfile.telefono)) {
    actions.push({
      key: "telefono",
      title: t("completePhoneTitle"),
      impact: t("basicInfoImpact"),
      button: t("completeButton"),
      target: "telefono-input",
      priority: 100,
    });
  }

  const topSkillGaps = [...fitSignals]
    .map((skill) => ({ ...skill, gap: Math.max(skill.target - skill.score, 0) }))
    .filter((skill) => skill.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 2);

  topSkillGaps.forEach((skill, index) => {
    actions.push({
      key: `skill-${skill.label}`,
      title: t("strengthenSkill", { skill: MATCH_ACTION_SKILL_MAP[skill.label] ?? skill.label }),
      impact: isEnglish ? `Improve match +${Math.max(3, skill.gap)}%` : `Mejora match +${Math.max(3, skill.gap)}%`,
      button: t("addSkill"),
      target: skill.label === "Infraestructura como codigo" ? "info-section" : "skills-add-button",
      priority: 90 - index,
    });
  });

  if (activeProfile.experiencia.length < 4) {
    actions.push({
      key: "experience",
      title: t("completeExperienceTitle"),
      impact: t("rankingImpact"),
      button: t("editExperienceButton"),
      target: "experience-add-button",
      priority: 82,
    });
  }

  if (!isValidWebsite(activeProfile.website)) {
    actions.push({
      key: "website",
      title: t("addSecureWebsiteTitle"),
      impact: t("profileTrustImpact"),
      button: t("completeButton"),
      target: "website-input",
      priority: 74,
    });
  }

  if (!activeProfile.cv?.trim()) {
    actions.push({
      key: "cv",
      title: t("attachCvTitle"),
      impact: t("profileCompleteImpact"),
      button: t("uploadCvButton"),
      target: "cv-section",
      priority: 96,
    });
  }

  return actions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4);
}
