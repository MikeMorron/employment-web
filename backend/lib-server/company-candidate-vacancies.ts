import type { CandidateAvailabilityStatus, CandidateProfile } from "@/types/profile";
import type { CandidateExperience, CandidateMetric, CandidateStat, Vacancy } from "@/types/vacancy";

const availabilityLabelByStatus: Record<CandidateAvailabilityStatus, string> = {
  available_now: "Disponible ahora",
  open_30_days: "Disponible en 30 dias",
  open_60_days: "Disponible en 60 dias",
  interviewing: "En entrevistas",
  not_available: "No disponible",
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function formatCopAmount(value?: number | null) {
  if (!value || value <= 0) {
    return null;
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatExpectedSalary(candidate: CandidateProfile) {
  const min = candidate.workPreferences?.expectedSalaryMin;
  const max = candidate.workPreferences?.expectedSalaryMax;
  const exact = candidate.expectativaSalarial?.trim();

  if (exact) {
    return exact;
  }

  if (min && max) {
    return `${formatCopAmount(min)} - ${formatCopAmount(max)}`;
  }

  if (min) {
    return `${formatCopAmount(min)}+`;
  }

  if (max) {
    return formatCopAmount(max) ?? "A convenir";
  }

  return "A convenir";
}

function resolveExpectedSalaryMin(candidate: CandidateProfile) {
  const structured = candidate.workPreferences?.expectedSalaryMin;
  if (structured && structured > 0) {
    return structured;
  }

  const fallback = Number(candidate.expectativaSalarialMin ?? "");
  return Number.isFinite(fallback) && fallback > 0 ? fallback : undefined;
}

function resolveExperienceYears(candidate: CandidateProfile) {
  const professionalYears =
    candidate.professionalProfile?.yearsExperienceRelevant ??
    candidate.professionalProfile?.yearsExperienceTotal;

  if (typeof professionalYears === "number" && professionalYears >= 0) {
    return Math.max(0, Math.min(11, Math.round(professionalYears)));
  }

  return Math.max(0, Math.min(11, candidate.experiencia.length));
}

function resolveAvailabilityLabel(candidate: CandidateProfile) {
  const status = candidate.professionalProfile?.availabilityStatus;
  return status ? availabilityLabelByStatus[status] ?? "Perfil disponible" : "Perfil disponible";
}

function resolveLocation(candidate: CandidateProfile) {
  const structuredLocation = uniqueStrings([
    candidate.locationProfile?.city,
    candidate.locationProfile?.region,
  ]).join(", ");

  return (candidate.ubicacion ?? structuredLocation) || "Colombia";
}

function resolveWorkMode(candidate: CandidateProfile) {
  const raw =
    candidate.modalidadTrabajo ??
    candidate.workPreferences?.preferredWorkModes?.[0] ??
    (candidate.locationProfile?.canWorkOnsite === false ? "Remoto" : undefined);

  if (!raw) {
    return "Todo";
  }

  const normalized = raw.trim().toLowerCase();
  if (normalized.includes("hibr")) return "Hibrido";
  if (normalized.includes("presencial") || normalized.includes("onsite")) return "Presencial";
  if (normalized.includes("remoto") || normalized.includes("remote")) return "Remoto";
  return raw;
}

function resolveSummary(candidate: CandidateProfile) {
  return (
    candidate.professionalProfile?.professionalSummary?.trim() ??
    candidate.resumenPerfil?.trim() ??
    candidate.bio?.trim() ??
    `Perfil profesional de ${candidate.nombre}.`
  );
}

function buildExperienceItems(candidate: CandidateProfile): CandidateExperience[] {
  return candidate.experiencia.slice(0, 6).map((item) => ({
    role: item.rol,
    company: item.empresa,
    period: item.tiempo || "Experiencia registrada",
    summary: item.description?.trim() || item.opinion?.trim() || "Experiencia validada dentro del perfil.",
    impact: item.achievements?.trim() || undefined,
  }));
}

function buildEducationItems(candidate: CandidateProfile) {
  const structured = candidate.educationProfile?.records
    ?.map((item) => uniqueStrings([item.degreeTitle, item.degreeField, item.institutionName]).join(" · "))
    .filter(Boolean);

  if (structured?.length) {
    return structured;
  }

  return candidate.education ?? [];
}

function buildLanguageItems(candidate: CandidateProfile) {
  return (candidate.idiomas ?? []).map((item) =>
    uniqueStrings([
      item.name,
      item.level,
      item.certified ? "Certificado" : undefined,
    ]).join(" · "),
  );
}

function buildCertificationItems(candidate: CandidateProfile) {
  const structured = candidate.certificationProfile?.records
    ?.map((item) => uniqueStrings([item.certificationName, item.issuer]).join(" · "))
    .filter(Boolean);

  if (structured?.length) {
    return structured;
  }

  return candidate.certifications ?? [];
}

function buildStats(candidate: CandidateProfile, yearsExperience: number): CandidateStat[] {
  return [
    { label: "Experiencia", value: `${yearsExperience}+ anos`, accent: "sky" },
    { label: "Skills", value: String(candidate.skills.length), accent: "amber" },
    { label: "Idiomas", value: String(candidate.idiomas?.length ?? 0), accent: "emerald" },
  ];
}

function buildMetrics(candidate: CandidateProfile): CandidateMetric[] {
  const completeness =
    candidate.profileQuality?.profileCompletenessScore ??
    Math.min(
      100,
      25 +
        candidate.skills.length * 6 +
        candidate.experiencia.length * 8 +
        (candidate.idiomas?.length ?? 0) * 6,
    );

  const salaryClarity =
    candidate.profileQuality?.salaryClarityScore ??
    (candidate.workPreferences?.expectedSalaryMin || candidate.expectativaSalarial ? 82 : 35);

  const technicalSignal =
    candidate.profileQuality?.skillsClarityScore ??
    Math.min(100, 30 + candidate.skills.length * 9);

  return [
    { label: "Perfil completo", value: clampPercent(completeness), tone: "sky" },
    { label: "Claridad salarial", value: clampPercent(salaryClarity), tone: "amber" },
    { label: "Senal tecnica", value: clampPercent(technicalSignal), tone: "emerald" },
  ];
}

function buildTags(candidate: CandidateProfile) {
  const availabilityStatus = candidate.professionalProfile?.availabilityStatus;
  return uniqueStrings([
    ...(candidate.categoriasEnfoque ?? []),
    ...candidate.skills.slice(0, 4),
    availabilityStatus === "available_now" ? "Urgente" : undefined,
  ]);
}

export function buildCompanyCandidateVacancy(candidate: CandidateProfile): Vacancy {
  const yearsExperience = resolveExperienceYears(candidate);
  const expectedSalaryMin = resolveExpectedSalaryMin(candidate);
  const summary = resolveSummary(candidate);
  const highlightedExperience = buildExperienceItems(candidate);
  const directContactVisible = candidate.profileVisibility === "recruiters_only";

  return {
    id: candidate.id,
    titulo: candidate.rol || candidate.nombre,
    publicadorTipo: "persona",
    publicadorNombre: candidate.nombre,
    empresa: candidate.nombre,
    ubicacion: resolveLocation(candidate),
    departamento: candidate.locationProfile?.region ?? undefined,
    municipio: candidate.locationProfile?.city ?? undefined,
    modalidad: resolveWorkMode(candidate),
    salario: formatExpectedSalary(candidate),
    salarioMinimoMillones: expectedSalaryMin ? expectedSalaryMin / 1_000_000 : undefined,
    descripcion: summary,
    descripcionCompleta: [
      summary,
      candidate.bio?.trim(),
      highlightedExperience[0]?.summary,
    ]
      .filter(Boolean)
      .join("\n\n"),
    etiquetas: buildTags(candidate),
    diasDesdePublicacion: 0,
    experienciaMinimaAnos: yearsExperience,
    candidateProfile: {
      fullName: candidate.nombre,
      avatarUrl: candidate.avatar ?? undefined,
      role: candidate.rol,
      location: resolveLocation(candidate),
      expectedSalary: formatExpectedSalary(candidate),
      matchScore: clampPercent(candidate.profileQuality?.profileCompletenessScore ?? 72),
      projectsCount: candidate.experiencia.length,
      responseRate: clampPercent(candidate.profileQuality?.dataConfidenceScore ?? 84),
      availability: resolveAvailabilityLabel(candidate),
      summary,
      technicalSkills: candidate.skills.slice(0, 10),
      softSkills: candidate.professionalProfile?.methodologies?.slice(0, 6) ?? [],
      highlightedExperience,
      metrics: buildMetrics(candidate),
      stats: buildStats(candidate, yearsExperience),
      contact: {
        phone: directContactVisible ? candidate.telefono ?? "" : "",
        email: directContactVisible ? candidate.email : "",
        linkedin: candidate.professionalProfile?.socialLinks?.linkedin ?? candidate.website ?? "",
      },
      fullProfile: {
        headline: candidate.professionalProfile?.headline ?? summary,
        achievements:
          uniqueStrings([
            ...candidate.experiencia
              .map((item) => item.achievements?.trim())
              .filter(Boolean)
              .slice(0, 4),
            ...candidate.skills.slice(0, 2).map((item) => `Experiencia demostrada en ${item}`),
          ]),
        experience: buildExperienceItems(candidate),
        education: buildEducationItems(candidate),
        languages: buildLanguageItems(candidate),
        certifications: buildCertificationItems(candidate),
      },
    },
  };
}

export function buildCompanyCandidateVacancies(candidates: CandidateProfile[]) {
  return candidates.map(buildCompanyCandidateVacancy);
}
