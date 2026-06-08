import type { UserJobFitSkill } from "@/types/user";
import type { CandidateProfile } from "@/types/profile";
import type { Vacancy } from "@/types/vacancy";

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function tokenize(value: string) {
  return normalize(value)
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function deriveReferenceScore(profile: CandidateProfile, vacancy: Vacancy) {
  const roleTerms = tokenize(profile.rol);
  const title = normalize(vacancy.titulo ?? "");
  const description = normalize(vacancy.descripcion ?? "");
  const tags = (vacancy.etiquetas ?? []).map((tag) => normalize(tag));

  return roleTerms.reduce((score, term) => {
    if (title.includes(term)) {
      return score + 8;
    }

    if (tags.some((tag) => tag.includes(term))) {
      return score + 5;
    }

    if (description.includes(term)) {
      return score + 3;
    }

    return score;
  }, 0);
}

function scoreSkillAgainstProfile(skill: string, profile: CandidateProfile) {
  const normalizedSkill = normalize(skill);
  const skills = (profile.skills ?? []).map((item) => normalize(item));
  const summary = normalize(
    [
      profile.rol,
      profile.resumenPerfil ?? "",
      profile.bio ?? "",
      ...(profile.experiencia ?? []).flatMap((item) => [item.rol, item.empresa, item.opinion ?? ""]),
    ].join(" "),
  );

  if (skills.some((item) => item === normalizedSkill || item.includes(normalizedSkill) || normalizedSkill.includes(item))) {
    return 88;
  }

  if (summary.includes(normalizedSkill)) {
    return 72;
  }

  return 46;
}

export function getReferenceVacancyForProfile(
  profile: CandidateProfile,
  vacancies: Vacancy[],
) {
  const eligible = vacancies.filter((vacancy) => vacancy.publicadorTipo !== "persona");
  if (eligible.length === 0) {
    return null;
  }

  return [...eligible]
    .sort((a, b) => deriveReferenceScore(profile, b) - deriveReferenceScore(profile, a))
    .at(0) ?? null;
}

export function buildProfileFitSignals(
  profile: CandidateProfile,
  referenceVacancy: Vacancy | null,
): UserJobFitSkill[] {
  const fallbackSkills = (profile.skills ?? []).slice(0, 6);
  const sourceSkills = [
    ...(referenceVacancy?.requiredSkills ?? []),
    ...(referenceVacancy?.optionalSkills ?? []),
    ...(referenceVacancy?.etiquetas ?? []),
  ]
    .filter(Boolean)
    .map((item) => item.trim())
    .filter((item, index, current) => current.findIndex((entry) => normalize(entry) === normalize(item)) === index)
    .slice(0, 6);

  const labels = (sourceSkills.length ? sourceSkills : fallbackSkills).slice(0, 6);

  return labels.map((label, index) => {
    const baseTarget = 78 + (index % 3) * 5;
    const target = Math.min(94, baseTarget);
    const score = Math.min(target, scoreSkillAgainstProfile(label, profile));

    return {
      label,
      score,
      target,
    };
  });
}
