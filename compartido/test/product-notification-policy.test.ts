import assert from "node:assert/strict";
import { buildDerivedNotifications } from "@/lib/server/product-engine";
import { syncRetentionQueueForUser } from "@/lib/server/retention-engine";
import type { StoredPreferences } from "@/lib/server/app-state";
import type { CandidateProfile } from "@/types/profile";
import type { ActivationSummary } from "@/types/product";

function buildCandidate(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    id: "candidate-test-001",
    email: "candidate@test.local",
    role: "candidate",
    plan: "basic",
    displayName: "Candidate Test",
    nombre: "Candidate Test",
    rol: "Frontend Developer",
    tipoRegistro: "persona",
    skills: [],
    experiencia: [],
    categoriasEnfoque: [],
    ...overrides,
  };
}

function buildPreferences(userId: string): StoredPreferences {
  return {
    savedVacanciesByUserId: {},
    categoryInterestByUserId: {},
    readNotificationsByUserId: {},
    hiddenNotificationsByUserId: {},
    notificationPrefsByUserId: {
      [userId]: {
        anuncio: true,
        application: true,
        emailEnabled: true,
        pushEnabled: false,
        emailFrequency: "instant",
        emailTypes: ["profile_incomplete"],
      },
    },
    appSettingsByUserId: {},
    companyFavoriteCandidateIdsByUserId: {},
    companyApplicantNotesByUserId: {},
    companyDashboardConfigByUserId: {},
    billingHistoryByUserId: {},
  };
}

async function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

void (async () => {
  await runTest("derived notifications no longer recreate onboarding welcome or plan cards", () => {
    const user = buildCandidate();
    const notifications = buildDerivedNotifications(
      {
        companyJobs: [],
        applications: [],
        preferences: buildPreferences(user.id),
      },
      user,
      [],
    );

    assert.equal(notifications.some((item) => item.type === "platform_announcement"), false);
    assert.equal(notifications.some((item) => item.type === "plan_status"), false);
  });

  await runTest("profile incomplete reminder is consumable on delivery", () => {
    const user = buildCandidate();
    const notifications = buildDerivedNotifications(
      {
        companyJobs: [],
        applications: [],
        preferences: buildPreferences(user.id),
      },
      user,
      [
        {
          id: "retention-profile-window-001",
          kind: "profile_incomplete",
          channel: "email",
          status: "scheduled",
          role: "candidate",
          scheduledAt: new Date().toISOString(),
          payload: {
            title: "Completa tu perfil",
            ctaHref: "/perfil/me",
            profileCompleteness: 60,
          },
        },
      ],
    );

    assert.equal(notifications.length, 1);
    assert.equal(notifications[0]?.metadata?.consumeOnDelivery, true);
    assert.equal(notifications[0]?.metadata?.actionLabel, "Completar perfil");
    assert.equal(notifications[0]?.linkHref, "/perfil/me");
    assert.equal(
      notifications[0]?.message,
      "Tu perfil aún no está en su prime, completa el 40% restante para mejorar tu posicionamiento y oportunidades de match.",
    );
  });

  await runTest("profile incomplete reminder is scheduled only below 60 percent completeness", async () => {
    const user = buildCandidate({
      ubicacion: "Bogotá",
    });
    const activationSummary: ActivationSummary = {
      role: "candidate",
      progressPercent: 20,
      firstValueReached: false,
      firstValueLabel: "Aplicó a 1 vacante",
      milestones: [],
    };
    const upserts: Array<{ create: { kind: string; dedupeKey: string; payloadJson: string } }> = [];
    const prisma = {
      retentionTask: {
        upsert(args: { create: { kind: string; dedupeKey: string; payloadJson: string } }) {
          upserts.push(args);
          return Promise.resolve(args);
        },
      },
    };

    await syncRetentionQueueForUser(
      prisma as unknown as Parameters<typeof syncRetentionQueueForUser>[0],
      {
        companyJobs: [],
        applications: [],
        preferences: buildPreferences(user.id),
      },
      user,
      activationSummary,
    );

    assert.equal(upserts.some((item) => item.create.kind === "profile_incomplete"), true);
    assert.equal(
      upserts.some((item) => item.create.dedupeKey.startsWith(`profile-incomplete:${user.id}:`)),
      true,
    );

    upserts.length = 0;

    await syncRetentionQueueForUser(
      prisma as unknown as Parameters<typeof syncRetentionQueueForUser>[0],
      {
        companyJobs: [],
        applications: [],
        preferences: buildPreferences(user.id),
      },
      buildCandidate({
        ubicacion: "Bogotá",
        bio: "Frontend engineer",
        cv: "cv.pdf",
        skills: ["React", "TypeScript"],
        experiencia: [{ rol: "Frontend", empresa: "ACME", tiempo: "2024 - hoy" }],
        expectativaSalarial: "6000000",
      }),
      activationSummary,
    );

    assert.equal(upserts.some((item) => item.create.kind === "profile_incomplete"), false);
  });
})().catch((error) => {
  process.exitCode = 1;
  throw error;
});
