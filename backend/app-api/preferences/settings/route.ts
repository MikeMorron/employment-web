import { requireAuthUser } from "@/lib/server/api-auth";
import { prisma } from "@/lib/server/db";
import { getUserPreferenceSnapshot, replaceNotificationEmailTypes } from "@/lib/server/preferences-store";
import { enforceRateLimit, enforceTrustedOrigin, jsonWithSecurity } from "@/lib/server/security";

export const runtime = "nodejs";

type UserSettingsPayload = {
  theme?: "dark" | "light";
  language?: "es" | "en";
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  emailFrequency?: "instant" | "daily" | "digest_3d";
  emailTypes?: string[];
};

export async function GET(request: Request) {
  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  const preference = await getUserPreferenceSnapshot(auth.id);
  return jsonWithSecurity({
    ok: true,
    settings: {
      theme: preference.theme,
      language: preference.language,
      emailEnabled: preference.notificationEmailEnabled,
      pushEnabled: preference.notificationPushEnabled,
      emailFrequency: preference.notificationEmailFrequency,
      emailTypes: preference.emailTypes,
    },
  });
}

export async function PATCH(request: Request) {
  const originError = enforceTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const rateLimitError = enforceRateLimit(request, {
    scope: "preferences-settings-write",
    maxRequests: 40,
    windowMs: 60_000,
  });
  if (rateLimitError) {
    return rateLimitError;
  }

  const auth = await requireAuthUser(request);
  if (auth instanceof Response) {
    return auth;
  }

  try {
    const body = (await request.json()) as {
      theme?: string;
      language?: string;
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      emailFrequency?: string;
      emailTypes?: string[];
    };
    const preference = await getUserPreferenceSnapshot(auth.id);
    const current: UserSettingsPayload = {
      theme: preference.theme === "dark" || preference.theme === "light" ? preference.theme : undefined,
      language: preference.language === "es" || preference.language === "en" ? preference.language : undefined,
      emailEnabled: preference.notificationEmailEnabled,
      pushEnabled: preference.notificationPushEnabled,
      emailFrequency: preference.notificationEmailFrequency,
      emailTypes: preference.emailTypes,
    };
    const settings: UserSettingsPayload = {
      theme: current.theme,
      language: current.language,
      emailEnabled: current.emailEnabled,
      pushEnabled: current.pushEnabled,
      emailFrequency: current.emailFrequency,
      emailTypes: Array.isArray(current.emailTypes) ? current.emailTypes : [],
    };

    if (body.theme === "dark" || body.theme === "light") {
      settings.theme = body.theme;
    }
    if (body.language === "es" || body.language === "en") {
      settings.language = body.language;
    }
    if (typeof body.emailEnabled === "boolean") {
      settings.emailEnabled = body.emailEnabled;
    }
    if (typeof body.pushEnabled === "boolean") {
      settings.pushEnabled = body.pushEnabled;
    }
    if (
      body.emailFrequency === "instant" ||
      body.emailFrequency === "daily" ||
      body.emailFrequency === "digest_3d"
    ) {
      settings.emailFrequency = body.emailFrequency;
    }
    if (Array.isArray(body.emailTypes)) {
      settings.emailTypes = Array.from(
        new Set(body.emailTypes.map((item) => String(item).trim()).filter(Boolean)),
      ).slice(0, 32);
    }
    await prisma.preference.upsert({
      where: { userId: auth.id },
      update: {
        theme: settings.theme ?? null,
        language: settings.language ?? null,
        notificationEmailEnabled: settings.emailEnabled ?? true,
        notificationPushEnabled: settings.pushEnabled ?? false,
        notificationEmailFrequency: settings.emailFrequency ?? null,
      },
      create: {
        userId: auth.id,
        theme: settings.theme ?? null,
        language: settings.language ?? null,
        notificationEmailEnabled: settings.emailEnabled ?? true,
        notificationPushEnabled: settings.pushEnabled ?? false,
        notificationEmailFrequency: settings.emailFrequency ?? null,
      },
    });
    await replaceNotificationEmailTypes(auth.id, settings.emailTypes ?? []);

    return jsonWithSecurity({ ok: true, settings });
  } catch {
    return jsonWithSecurity({ ok: false, message: "No se pudieron guardar los ajustes" }, { status: 500 });
  }
}
