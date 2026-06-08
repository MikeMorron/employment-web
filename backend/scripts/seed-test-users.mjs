import { randomBytes, scryptSync } from "node:crypto";
import { Client } from "pg";

const connectionString =
  process.env.DATABASE_URL?.trim() ||
  "postgresql://postgres@localhost/talentoco?host=/tmp/talentoco-pg-run";

function createCredential(userId, email, password) {
  const salt = randomBytes(16).toString("hex");
  return {
    userId,
    email,
    passwordSalt: salt,
    passwordHash: scryptSync(password, salt, 64).toString("hex"),
  };
}

const SEEDED_CREDENTIALS = {
  candidate: {
    userId: "candidate-primary-login",
    email: "talentoco.usuario@gmail.com",
    password: "TalentoUser@2026",
  },
  company: {
    userId: "company-primary-login",
    email: "talentoco.empresa@gmail.com",
    password: "TalentoEmpresa@2026",
  },
};

async function resetAuthEntries(client) {
  await client.query('DELETE FROM "Session"');
  await client.query('DELETE FROM "Credential"');
}

async function upsertRow(client, table, keyColumn, keyValue, data) {
  const exists = await client.query(
    `SELECT 1 FROM "${table}" WHERE "${keyColumn}" = $1 LIMIT 1`,
    [keyValue],
  );

  const entries = Object.entries(data);
  if (exists.rowCount) {
    const setSql = entries.map(([key], index) => `"${key}" = $${index + 2}`).join(", ");
    await client.query(
      `UPDATE "${table}" SET ${setSql} WHERE "${keyColumn}" = $1`,
      [keyValue, ...entries.map(([, value]) => value)],
    );
    return;
  }

  const columns = entries.map(([key]) => `"${key}"`).join(", ");
  const values = entries.map((_, index) => `$${index + 1}`).join(", ");
  await client.query(
    `INSERT INTO "${table}" (${columns}) VALUES (${values})`,
    entries.map(([, value]) => value),
  );
}

async function upsertOnboardingNotifications(client, userId, role, plan) {
  const notifications =
    role === "candidate"
      ? [
          {
            id: `onboarding:welcome:${userId}`,
            userId,
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
            id: `onboarding:plan:${userId}:${plan}`,
            userId,
            type: "plan_status",
            title:
              plan === "pro"
                ? "Plan Pro activo"
                : plan === "boosted"
                  ? "Plan Boosted activo"
                  : "Plan Basic activo",
            message:
              plan === "pro"
                ? "Tienes mayor prioridad, insights y visibilidad adicional en matching."
                : plan === "boosted"
                  ? "Tienes más postulaciones activas, mejor ranking y notificaciones avanzadas."
                  : "Tienes acceso base a vacantes, matching y notificaciones esenciales.",
            createdAt: new Date(),
            read: false,
            applicationId: null,
            jobId: null,
            status: plan,
          },
        ]
      : [
          {
            id: `onboarding:welcome:${userId}`,
            userId,
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
            id: `onboarding:plan:${userId}:${plan}`,
            userId,
            type: "plan_status",
            title: plan === "business" ? "Plan Business activo" : "Plan Free activo",
            message:
              plan === "business"
                ? "Tienes analytics, matching avanzado y vacantes destacadas disponibles."
                : "Tienes acceso base a publicación de vacantes y gestión inicial del pipeline.",
            createdAt: new Date(),
            read: false,
            applicationId: null,
            jobId: null,
            status: plan,
          },
        ];

  for (const notification of notifications) {
    await upsertRow(client, "Notification", "id", notification.id, notification);
  }
}

async function upsertCandidate(client) {
  const { userId, email, password } = SEEDED_CREDENTIALS.candidate;

  await upsertRow(client, "User", "id", userId, {
    id: userId,
    email,
    displayName: "Talento Co Usuario",
    role: "candidate",
    plan: "basic",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await upsertRow(client, "Profile", "userId", userId, {
    userId,
    nombre: "Talento Co Usuario",
    rol: "Frontend Developer",
    tipoRegistro: "persona",
    ubicacion: "Bogotá, Colombia",
    telefono: "3000000000",
    modalidadTrabajo: "Remoto",
    expectativaSalarial: "6000000",
    expectativaSalarialMin: "5000000",
    expectativaSalarialMax: "7000000",
    jornada: "Tiempo completo",
    resumenPerfil: "Perfil principal de usuario para pruebas de autenticación.",
    categoriasEnfoqueJson: JSON.stringify(["Tecnología e Informática"]),
    idiomasJson: JSON.stringify([{ name: "Inglés", levelSystem: "CEFR", level: "B2" }]),
    skillsJson: JSON.stringify(["React", "TypeScript", "Next.js"]),
    candidateSkillsJson: JSON.stringify([]),
    experienciaJson: JSON.stringify([{ rol: "Frontend Developer", empresa: "Sandbox Labs", tiempo: "2023 - Actualidad" }]),
    professionalProfileJson: JSON.stringify({}),
    educationProfileJson: JSON.stringify({ records: [] }),
    certificationProfileJson: JSON.stringify({ records: [] }),
    workPreferencesJson: JSON.stringify({ preferredWorkModes: ["remote"] }),
    locationProfileJson: JSON.stringify({ city: "Bogotá" }),
    profileQualityJson: JSON.stringify({ profileCompletenessScore: 80 }),
    profileVisibility: "public",
  });

  const credential = createCredential(userId, email, password);
  await upsertRow(client, "Credential", "userId", userId, credential);
  await upsertOnboardingNotifications(client, userId, "candidate", "basic");
}

async function upsertCompany(client) {
  const { userId, email, password } = SEEDED_CREDENTIALS.company;

  await upsertRow(client, "User", "id", userId, {
    id: userId,
    email,
    displayName: "Talento Co Empresa",
    role: "company",
    plan: "free",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await upsertRow(client, "Profile", "userId", userId, {
    userId,
    nombre: "Talento Co Empresa",
    rol: "Employer Admin",
    tipoRegistro: "empresa",
    ubicacion: "Bogotá, Colombia",
    telefono: "6010000000",
    companyName: "Talento Co Empresa",
    industry: "Tecnología",
    companySize: "11-50 personas",
    companyDescription: "Empresa principal para pruebas de autenticación y reclutamiento.",
    companyLocation: "Bogotá, Colombia",
    companyBenefitsJson: JSON.stringify(["Trabajo remoto"]),
    companySocialLinksJson: JSON.stringify([]),
    activeJobs: 0,
    verificationStatus: "pending",
    analyticsSummaryJson: JSON.stringify({
      profileViews: 0,
      applications: 0,
      conversionRate: 0,
    }),
    hiringFocusJson: JSON.stringify(["Frontend Developer"]),
  });

  const credential = createCredential(userId, email, password);
  await upsertRow(client, "Credential", "userId", userId, credential);
  await upsertOnboardingNotifications(client, userId, "company", "free");
}

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await resetAuthEntries(client);
    await upsertCandidate(client);
    await upsertCompany(client);
  } finally {
    await client.end();
  }

  console.log("Seeded test users:");
  console.log(`${SEEDED_CREDENTIALS.candidate.email} / ${SEEDED_CREDENTIALS.candidate.password}`);
  console.log(`${SEEDED_CREDENTIALS.company.email} / ${SEEDED_CREDENTIALS.company.password}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
