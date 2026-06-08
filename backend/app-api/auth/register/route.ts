import type { AppUser, CandidateProfile, CompanyProfile, LanguageLevelSystem } from "@/types/profile";
import { buildSessionCookie, createSession, sanitizeUserForClient, userToProfileCreateInput, userToUserCreateInput } from "@/lib/server/app-state";
import { enforceRateLimit, enforceTrustedOrigin, isRealNameInput, jsonWithSecurity, sanitizeNameInput, sanitizePlainTextInput } from "@/lib/server/security";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/server/db";
import { isDatabaseUnavailableError } from "@/lib/server/db-errors";
import { isStrongEnoughPassword, isValidEmail, normalizeEmail } from "@/lib/server/auth-validation";
import { calculateExperienceDurationMonths } from "@/lib/profile-form";
import { normalizeCompanyPlan } from "@/lib/company-plan-model";
import { createPasswordCredential } from "@/lib/server/password-security";
import {
  replaceCandidateExperiences,
  replaceCandidateStructuredSkills,
} from "@/lib/server/candidate-profile-store";
import {
  sanitizeCandidateCertificationProfile,
  sanitizeCandidateEducationProfile,
  sanitizeCandidateLocationProfile,
  sanitizeCandidateProfessionalProfile,
  sanitizeCandidateProfileQuality,
  sanitizeCandidateStructuredSkills,
  sanitizeCandidateWorkPreferences,
} from "@/lib/server/candidate/profile-patch";
import { truncateSummaryText } from "@/lib/summary-text";
import { censorProfanityInPayload } from "@/lib/server/profanity-guard";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "auth-register-email-check",
    maxRequests: 30,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const url = new URL(request.url);
  const email = normalizeEmail(url.searchParams.get("email") ?? "");

  if (!email || !isValidEmail(email)) {
    return jsonWithSecurity({ ok: false, message: "Correo inválido" }, { status: 400 });
  }

  const existingCredential = await prisma.credential.findUnique({
    where: { email },
    select: { userId: true },
  });

  return jsonWithSecurity({ ok: true, exists: Boolean(existingCredential) });
}

async function createCredential(userId: string, email: string, password: string) {
  const credential = await createPasswordCredential(password);
  return {
    userId,
    email: email.trim().toLowerCase(),
    ...credential,
  };
}

function buildOnboardingNotifications(user: AppUser) {
  if (user.role === "candidate") {
    return [
      {
        id: `onboarding:welcome:${user.id}`,
        userId: user.id,
        type: "platform_announcement",
        title: "Bienvenida a TalentSyncro",
        message:
          "Tus alertas, recordatorios y recomendaciones se sincronizan desde una sola fuente persistente.",
        createdAt: new Date(),
        read: false,
        applicationId: null,
        jobId: null,
        status: "active",
      },
      {
        id: `onboarding:plan:${user.id}:${user.plan}`,
        userId: user.id,
        type: "plan_status",
        title:
          user.plan === "pro"
            ? "Plan Pro activo"
            : user.plan === "boosted"
              ? "Plan Boosted activo"
              : "Plan Basic activo",
        message:
          user.plan === "pro"
            ? "Tienes mayor prioridad, insights y visibilidad adicional en matching."
            : user.plan === "boosted"
              ? "Tienes más postulaciones activas, mejor ranking y notificaciones avanzadas."
              : "Tienes acceso base a vacantes, matching y notificaciones esenciales.",
        createdAt: new Date(),
        read: false,
        applicationId: null,
        jobId: null,
        status: user.plan,
      },
    ];
  }

  return [
    {
      id: `onboarding:welcome:${user.id}`,
      userId: user.id,
      type: "platform_announcement",
      title: "Panel empresa activo",
      message:
        "Tus alertas operativas y recomendaciones se sincronizan desde una sola fuente persistente.",
      createdAt: new Date(),
      read: false,
      applicationId: null,
      jobId: null,
      status: "active",
    },
    {
      id: `onboarding:plan:${user.id}:${user.plan}`,
      userId: user.id,
      type: "plan_status",
      title:
        normalizeCompanyPlan(user.plan) === "premium"
          ? "Plan Premium activo"
          : normalizeCompanyPlan(user.plan) === "business"
            ? "Plan Business activo"
            : normalizeCompanyPlan(user.plan) === "pro"
              ? "Plan Pro activo"
              : "Plan Básico activo",
      message:
        normalizeCompanyPlan(user.plan) === "premium"
          ? "Tienes máxima prioridad en matching, urgencias dobles y acceso preferente a talento con boost."
          : normalizeCompanyPlan(user.plan) === "business"
            ? "Tienes analytics, matching avanzado y vacantes destacadas disponibles."
            : normalizeCompanyPlan(user.plan) === "pro"
              ? "Tienes más vacantes activas, filtros avanzados y pre-entrevista."
              : "Tienes acceso base a publicación de vacantes y gestión inicial del pipeline.",
      createdAt: new Date(),
      read: false,
      applicationId: null,
      jobId: null,
      status: user.plan,
    },
  ];
}

function isValidCandidateProfile(user: AppUser): user is CandidateProfile {
  return user.role === "candidate" && user.tipoRegistro === "persona";
}

function isValidCompanyProfile(user: AppUser): user is CompanyProfile {
  return user.role === "company" && user.tipoRegistro === "empresa";
}

function sanitizeString(value: unknown, maxLength = 160) {
  return sanitizePlainTextInput(value, maxLength);
}

function isAllowedCandidateAge(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }

  const birthTime = new Date(value).getTime();
  const minimum = new Date();
  minimum.setFullYear(minimum.getFullYear() - 15);
  const maximum = new Date();
  maximum.setFullYear(maximum.getFullYear() - 70);

  return Number.isFinite(birthTime) && birthTime <= minimum.getTime() && birthTime >= maximum.getTime();
}

function sanitizeHttpUrl(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function sanitizeStringArray(value: unknown, maxItems = 12, maxLength = 60) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function sanitizeCandidateExperience(value: unknown): CandidateProfile["experiencia"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      rol: sanitizeString(item.rol, 120),
      empresa: sanitizeString(item.empresa, 160),
      empresaNit: sanitizeString(item.empresaNit, 32) || undefined,
      tiempo: sanitizeString(item.tiempo, 80),
      fechaInicio: sanitizeString(item.fechaInicio, 20) || undefined,
      fechaFin: sanitizeString(item.fechaFin, 20) || undefined,
      actualidad: typeof item.actualidad === "boolean" ? item.actualidad : undefined,
      durationMonths:
        calculateExperienceDurationMonths(
          sanitizeString(item.fechaInicio, 20) || undefined,
          sanitizeString(item.fechaFin, 20) || undefined,
          typeof item.actualidad === "boolean" ? item.actualidad : undefined,
        ) ??
        (typeof item.durationMonths === "number" && Number.isFinite(item.durationMonths)
          ? Math.max(0, Math.min(960, Math.round(item.durationMonths)))
          : undefined),
      opinion: sanitizeString(item.opinion, 400) || undefined,
      description: sanitizeString(item.description, 600) || undefined,
      canonicalRole: sanitizeString(item.canonicalRole, 80) || undefined,
      roleFamily: sanitizeString(item.roleFamily, 80) || undefined,
      companyIndustry: sanitizeString(item.companyIndustry, 80) || undefined,
      employmentType: sanitizeString(item.employmentType, 60) || undefined,
      location: sanitizeString(item.location, 120) || undefined,
      workMode: sanitizeString(item.workMode, 60) || undefined,
      achievements: sanitizeString(item.achievements, 400) || undefined,
      skillsUsed: sanitizeStringArray(item.skillsUsed, 12, 140),
      domainTags: sanitizeStringArray(item.domainTags, 8, 80),
      functionalTags: sanitizeStringArray(item.functionalTags, 8, 80),
      teamScope: sanitizeString(item.teamScope, 80) || undefined,
      peopleLedCount:
        typeof item.peopleLedCount === "number" && Number.isFinite(item.peopleLedCount)
          ? Math.max(0, Math.min(500, Math.round(item.peopleLedCount)))
          : undefined,
      productsWorkedOn: sanitizeStringArray(item.productsWorkedOn, 8, 100),
    }))
    .filter((item) => item.rol && item.empresa && item.tiempo)
    .slice(0, 12);
}

function sanitizeCandidateLanguages(value: unknown): CandidateProfile["idiomas"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const name = sanitizeString(item.name, 80);
      const level = sanitizeString(item.level, 24);
      const levelSystem = item.levelSystem;

      if (
        !name ||
        !level ||
        (levelSystem !== "CEFR" &&
          levelSystem !== "JLPT" &&
          levelSystem !== "HSK" &&
          levelSystem !== "TOPIK")
      ) {
        return null;
      }

      return {
        name,
        level,
        levelSystem: levelSystem as LanguageLevelSystem,
        languageCode: sanitizeString(item.languageCode, 16) || undefined,
        isNative: typeof item.isNative === "boolean" ? item.isNative : undefined,
        certified: typeof item.certified === "boolean" ? item.certified : undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 10);
}

function buildCandidateUser(input: CandidateProfile, email: string): CandidateProfile {
  const nombre = sanitizeNameInput(input.nombre, 120);
  const rol = sanitizeString(input.rol, 120);

  return {
    id: `candidate-${randomUUID()}`,
    role: "candidate",
    plan: "basic",
    displayName: nombre || email,
    nombre: nombre || email,
    rol,
    email,
    tipoRegistro: "persona",
    ubicacion: sanitizeString(input.ubicacion, 120) || undefined,
    modalidadTrabajo: sanitizeString(input.modalidadTrabajo, 80) || undefined,
    expectativaSalarial: sanitizeString(input.expectativaSalarial, 64) || undefined,
    expectativaSalarialMin: sanitizeString(input.expectativaSalarialMin, 64) || undefined,
    expectativaSalarialMax: sanitizeString(input.expectativaSalarialMax, 64) || undefined,
    jornada: sanitizeString(input.jornada, 80) || undefined,
    resumenPerfil: truncateSummaryText(String(input.resumenPerfil ?? ""), 150) || undefined,
    categoriasEnfoque: sanitizeStringArray(input.categoriasEnfoque, 6, 60),
    telefono: sanitizeString(input.telefono, 40) || undefined,
    website: sanitizeHttpUrl(input.website),
    avatar: "",
    avatarStoredFileName: "",
    cv: sanitizeString(input.cv, 200) || undefined,
    cvStoredFileName: "",
    bio: sanitizeString(input.bio, 400) || undefined,
    idiomas: sanitizeCandidateLanguages(input.idiomas),
    disponibilidadViaje: sanitizeString(input.disponibilidadViaje, 80) || undefined,
    movilidad: sanitizeString(input.movilidad, 80) || undefined,
    skills: sanitizeStringArray(input.skills, 20, 60),
    structuredSkills: sanitizeCandidateStructuredSkills(input.structuredSkills),
    experiencia: sanitizeCandidateExperience(input.experiencia),
    professionalProfile: sanitizeCandidateProfessionalProfile(input.professionalProfile),
    educationProfile: sanitizeCandidateEducationProfile(input.educationProfile),
    certificationProfile: sanitizeCandidateCertificationProfile(input.certificationProfile) ?? undefined,
    workPreferences: sanitizeCandidateWorkPreferences(input.workPreferences),
    locationProfile: sanitizeCandidateLocationProfile(input.locationProfile),
    profileQuality: sanitizeCandidateProfileQuality(input.profileQuality),
    profileVisibility:
      input.profileVisibility === "private" ||
      input.profileVisibility === "recruiters_only" ||
      input.profileVisibility === "public"
        ? input.profileVisibility
        : "public",
  };
}

function buildCompanyUser(input: CompanyProfile, email: string): CompanyProfile {
  const companyName = sanitizeNameInput(input.companyName || input.nombre, 160);
    const website = sanitizeHttpUrl(input.companyWebsite || input.website);

  return {
    id: `company-${randomUUID()}`,
    role: "company",
    plan: "basic",
    displayName: companyName || email,
    nombre: companyName || email,
    rol: "Employer Admin",
    email,
    tipoRegistro: "empresa",
    ubicacion: sanitizeString(input.ubicacion || input.companyLocation, 120) || undefined,
    telefono: sanitizeString(input.telefono, 40) || undefined,
    website: website || undefined,
    avatar: "",
    avatarStoredFileName: "",
    companyName: companyName || email,
    industry: sanitizeString(input.industry, 120),
    companySize: sanitizeString(input.companySize, 80),
    companyDescription: sanitizeString(input.companyDescription, 600),
    companyWebsite: website || undefined,
    companyLocation: sanitizeString(input.companyLocation || input.ubicacion, 120) || undefined,
    activeJobs: 0,
    verificationStatus: "pending",
    analyticsSummary: {
      profileViews: 0,
      applications: 0,
      conversionRate: 0,
    },
    hiringFocus: sanitizeStringArray(input.hiringFocus, 8, 80),
  };
}

export async function POST(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "auth-register",
    maxRequests: 8,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      user?: AppUser;
    };

    const email = normalizeEmail(body.email);
    const password = body.password ?? "";
    const submittedUser = body.user;

    if (!email || !isValidEmail(email)) {
      return jsonWithSecurity({ ok: false, message: "Correo inválido" }, { status: 400 });
    }

    if (!isStrongEnoughPassword(password)) {
      return jsonWithSecurity(
        {
          ok: false,
          message: "La contraseña debe tener mínimo 10 caracteres, al menos 1 número y 1 caracter especial permitido (@ # $ % * ! - .), sin espacios.",
        },
        { status: 400 },
      );
    }

    if (!submittedUser) {
      return jsonWithSecurity({ ok: false, message: "Datos inválidos" }, { status: 400 });
    }

    const existingCredential = await prisma.credential.findUnique({
      where: { email },
      select: { userId: true },
    });
    if (existingCredential) {
      return jsonWithSecurity({ ok: false, message: "Ese correo ya existe" }, { status: 409 });
    }

    if (!isValidCandidateProfile(submittedUser) && !isValidCompanyProfile(submittedUser)) {
      return jsonWithSecurity({ ok: false, message: "Perfil inválido" }, { status: 400 });
    }

    if (isValidCandidateProfile(submittedUser) && !isAllowedCandidateAge((submittedUser as Record<string, unknown>).birthDate)) {
      return jsonWithSecurity(
        { ok: false, message: "Debes tener entre 15 y 70 años para registrarte" },
        { status: 400 },
      );
    }

    if (isValidCandidateProfile(submittedUser) && !isRealNameInput(submittedUser.nombre)) {
      return jsonWithSecurity({ ok: false, message: "Ingresa un nombre real" }, { status: 400 });
    }

    const rawUser = isValidCandidateProfile(submittedUser)
      ? buildCandidateUser(submittedUser, email)
      : buildCompanyUser(submittedUser, email);
    const user = await censorProfanityInPayload(rawUser);

    const credential = await createCredential(user.id, email, password);

    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: userToUserCreateInput(user) as Parameters<typeof tx.user.create>[0]["data"],
      });
      await tx.profile.create({
        data: userToProfileCreateInput(user) as Parameters<typeof tx.profile.create>[0]["data"],
      });
      await tx.credential.create({
        data: credential as Parameters<typeof tx.credential.create>[0]["data"],
      });
      await tx.notification.createMany({
        data: buildOnboardingNotifications(user) as NonNullable<Parameters<typeof tx.notification.createMany>[0]>["data"],
      });

      if (user.role === "candidate") {
        await replaceCandidateStructuredSkills(tx as typeof prisma, user.id, user.structuredSkills);
        await replaceCandidateExperiences(tx as typeof prisma, user.id, user.experiencia ?? []);
      }
    });

    const session = await createSession(user.id);
    const response = jsonWithSecurity({
      ok: true,
      user: sanitizeUserForClient(user),
      auth: session.auth,
    });
    response.headers.set("Set-Cookie", buildSessionCookie(session.token, request));
    return response;
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return jsonWithSecurity(
        { ok: false, message: "La base de datos no está disponible" },
        { status: 503 },
      );
    }

    return jsonWithSecurity({ ok: false, message: "No se pudo crear la cuenta" }, { status: 500 });
  }
}
