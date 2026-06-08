import type { CandidateProfile } from "@/types/profile";

export function getCandidateProfileCompleteness(user: CandidateProfile) {
  const checks = [
    user.nombre,
    user.rol,
    user.ubicacion,
    user.bio,
    user.cv,
    user.skills?.length,
    user.experiencia?.length,
    user.expectativaSalarial || user.expectativaSalarialMin || user.expectativaSalarialMax,
  ];

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
