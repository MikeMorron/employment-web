import assert from "node:assert/strict";
import { buildCompanyCandidateVacancy } from "@/backend/lib-server/company-candidate-vacancies";
import type { CandidateProfile } from "@/types/profile";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function buildCandidate(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    id: "candidate-001",
    email: "candidate@example.com",
    role: "candidate",
    plan: "pro",
    displayName: "Laura Candidate",
    nombre: "Laura Candidate",
    rol: "Disenadora UX",
    tipoRegistro: "persona",
    ubicacion: "Bogota, Colombia",
    modalidadTrabajo: "Remoto",
    expectativaSalarial: "Entre $6.000.000 y $8.000.000",
    resumenPerfil: "Perfil visible para procesos de reclutamiento.",
    telefono: "+573001234567",
    website: "https://linkedin.com/in/laura-candidate",
    categoriasEnfoque: ["Diseno UX", "Producto"],
    skills: ["Figma", "Research", "Design systems"],
    experiencia: [
      {
        rol: "Senior UX Designer",
        empresa: "Orbit",
        tiempo: "2022-2026",
        description: "Lidero discovery y prototipado.",
        achievements: "Subio la conversion 18%",
      },
    ],
    idiomas: [{ name: "Espanol", levelSystem: "CEFR", level: "C2", isNative: true }],
    professionalProfile: {
      socialLinks: { linkedin: "https://linkedin.com/in/laura-candidate" },
      methodologies: ["Discovery", "Testing"],
      yearsExperienceRelevant: 4,
      availabilityStatus: "available_now",
      professionalSummary: "Experta en producto digital y experiencia de usuario.",
      headline: "UX strategist enfocada en growth y experiencia end-to-end.",
    },
    workPreferences: {
      expectedSalaryMin: 6000000,
      expectedSalaryMax: 8000000,
      preferredWorkModes: ["Remoto"],
    },
    profileQuality: {
      profileCompletenessScore: 91,
      salaryClarityScore: 88,
      skillsClarityScore: 86,
    },
    profileVisibility: "public",
    education: ["Diseno industrial · Universidad Nacional"],
    certifications: ["Google UX Certificate"],
    ...overrides,
  };
}

runTest("company candidate vacancy uses registered candidate data in talent feed", () => {
  const vacancy = buildCompanyCandidateVacancy(buildCandidate());

  assert.equal(vacancy.publicadorTipo, "persona");
  assert.equal(vacancy.publicadorNombre, "Laura Candidate");
  assert.equal(vacancy.titulo, "Disenadora UX");
  assert.equal(vacancy.modalidad, "Remoto");
  assert.equal(vacancy.candidateProfile?.fullName, "Laura Candidate");
  assert.equal(vacancy.candidateProfile?.technicalSkills[0], "Figma");
  assert.ok(vacancy.etiquetas?.includes("Urgente"));
});

runTest("company candidate vacancy hides direct contact for public profiles", () => {
  const vacancy = buildCompanyCandidateVacancy(buildCandidate({ profileVisibility: "public" }));

  assert.equal(vacancy.candidateProfile?.contact.phone, "");
  assert.equal(vacancy.candidateProfile?.contact.email, "");
  assert.equal(vacancy.candidateProfile?.contact.linkedin, "https://linkedin.com/in/laura-candidate");
});

runTest("company candidate vacancy keeps direct contact for recruiters-only profiles", () => {
  const vacancy = buildCompanyCandidateVacancy(buildCandidate({ profileVisibility: "recruiters_only" }));

  assert.equal(vacancy.candidateProfile?.contact.phone, "+573001234567");
  assert.equal(vacancy.candidateProfile?.contact.email, "candidate@example.com");
});
