import assert from "node:assert/strict";
import { sanitizeCandidatePublicProfile, sanitizeOwnUserForClient, sanitizeUserForClient } from "@/lib/server/user-client";
import type { CandidateProfile, CompanyProfile } from "@/types/profile";

function buildCandidate(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    id: "candidate-sec-001",
    role: "candidate",
    plan: "pro",
    displayName: "Nina Candidate",
    nombre: "Nina Candidate",
    rol: "Senior Frontend Engineer",
    ubicacion: "Bogota",
    email: "nina@example.com",
    tipoRegistro: "persona",
    modalidadTrabajo: "Remoto",
    expectativaSalarial: "9000000",
    expectativaSalarialMin: "8000000",
    expectativaSalarialMax: "10000000",
    jornada: "Tiempo completo",
    resumenPerfil: "Perfil de seguridad",
    categoriasEnfoque: ["Frontend"],
    telefono: "3105550000",
    website: "https://candidate.example.com",
    avatar: "",
    avatarStoredFileName: "avatar_candidate-sec-001_123.jpg",
    avatarAssetPublicId: "avatar-public-001",
    cv: "Nina_CV.pdf",
    cvStoredFileName: "cv_candidate-sec-001_123.pdf",
    cvAssetPublicId: "cv-public-001",
    bio: "Disponible",
    idiomas: [{ name: "Ingles", levelSystem: "CEFR", level: "B2" }],
    disponibilidadViaje: "Si",
    movilidad: "Carro",
    skills: ["React", "TypeScript"],
    experiencia: [{ rol: "Engineer", empresa: "Acme", tiempo: "2022 - Actualidad" }],
    education: ["Ingenieria"],
    certifications: ["AWS"],
    profileVisibility: "public",
    ...overrides,
  };
}

function buildCompany(overrides: Partial<CompanyProfile> = {}): CompanyProfile {
  return {
    id: "company-sec-001",
    role: "company",
    plan: "business",
    displayName: "Acme Co",
    nombre: "Acme Co",
    rol: "Employer Admin",
    email: "contact@acme.example.com",
    tipoRegistro: "empresa",
    ubicacion: "Bogota",
    telefono: "6010000000",
    website: "https://acme.example.com",
    avatar: "https://cdn.example.com/logo.png",
    avatarStoredFileName: "avatar_company-sec-001_123.jpg",
    avatarAssetPublicId: "company-avatar-public-001",
    companyName: "Acme Co",
    industry: "Software",
    companySize: "50-100",
    companyDescription: "Hiring",
    companyCulture: "Async",
    companyMission: "Build",
    companyVision: "Scale",
    companyContactEmail: "hr@acme.example.com",
    companyWebsite: "https://acme.example.com",
    companyLocation: "Bogota",
    companyBenefits: ["Remote"],
    companySocialLinks: ["https://linkedin.com/company/acme"],
    companyBanner: "https://cdn.example.com/banner.png",
    activeJobs: 3,
    verificationStatus: "verified",
    analyticsSummary: {
      profileViews: 10,
      applications: 5,
      conversionRate: 50,
    },
    hiringFocus: ["Frontend"],
    billingHistory: [],
    ...overrides,
  };
}

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function assertSecurePrivateMediaUrl(value: string | undefined, expectedPrefix: string) {
  if (typeof value !== "string") {
    assert.fail("Expected a signed private media URL");
    return;
  }

  const href = value;
  assert.equal(href.startsWith(`${expectedPrefix}?token=`), true);
}

runTest("session candidate strips sensitive fields and keeps safe avatar route", () => {
  const result = sanitizeUserForClient(buildCandidate());

  assert.equal(result.email, "");
  assert.equal(Object.hasOwn(result, "telefono"), false);
  assert.equal(Object.hasOwn(result, "website"), false);
  assert.equal(Object.hasOwn(result, "cvStoredFileName"), false);
  assert.equal(Object.hasOwn(result, "avatarStoredFileName"), false);
  assertSecurePrivateMediaUrl(result.avatar, "/api/avatar-file/avatar-public-001");
  assert.equal(result.cv, "Nina_CV.pdf");
  assertSecurePrivateMediaUrl(result.cvDownloadUrl, "/api/cv-download/cv-public-001");
});

runTest("own candidate payload keeps editable contact data but never stored file names", () => {
  const result = sanitizeOwnUserForClient(buildCandidate());

  assert.equal(result.telefono, "3105550000");
  assert.equal(result.website, "https://candidate.example.com");
  assert.equal(result.email, "");
  assert.equal(Object.hasOwn(result, "cvStoredFileName"), false);
  assert.equal(Object.hasOwn(result, "avatarStoredFileName"), false);
  assertSecurePrivateMediaUrl(result.avatar, "/api/avatar-file/avatar-public-001");
  assertSecurePrivateMediaUrl(result.cvDownloadUrl, "/api/cv-download/cv-public-001");
});

runTest("public candidate payload only exposes public-safe fields", () => {
  const result = sanitizeCandidatePublicProfile(buildCandidate());

  assert.equal(result.email, "");
  assert.equal(Object.hasOwn(result, "telefono"), false);
  assert.equal(Object.hasOwn(result, "website"), false);
  assert.equal(Object.hasOwn(result, "cv"), false);
  assert.equal(Object.hasOwn(result, "cvStoredFileName"), false);
  assert.equal(Object.hasOwn(result, "avatarStoredFileName"), false);
  assertSecurePrivateMediaUrl(result.avatar, "/api/avatar-file/avatar-public-001");
  assertSecurePrivateMediaUrl(result.cvDownloadUrl, "/api/cv-download/cv-public-001");
});

runTest("public candidate payload hides avatar for non-public visibility", () => {
  const result = sanitizeCandidatePublicProfile(buildCandidate({ profileVisibility: "recruiters_only" }));

  assert.equal(result.avatar, undefined);
});

runTest("session company payload drops account email and recruiter contact email", () => {
  const result = sanitizeUserForClient(buildCompany());

  assert.equal(result.email, "");
  assert.equal(Object.hasOwn(result, "companyContactEmail"), false);
  assert.equal(Object.hasOwn(result, "companyWebsite"), false);
  assert.equal(Object.hasOwn(result, "avatarStoredFileName"), false);
  assertSecurePrivateMediaUrl(result.avatar, "/api/avatar-file/company-avatar-public-001");
});
