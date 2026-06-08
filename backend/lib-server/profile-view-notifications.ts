import { randomUUID } from "node:crypto";
import { prisma } from "./db";
import { getUserPreferenceSnapshot } from "@/lib/server/preferences-store";

export async function recordProfileViewedNotification(params: {
  ownerUserId: string;
  viewerUserId?: string;
  viewerRole?: string;
}): Promise<void> {
  if (!params.viewerUserId || params.viewerUserId === params.ownerUserId) return;

  await prisma.notification.create({
    data: {
      id: randomUUID(),
      userId: params.ownerUserId,
      type: "profile_viewed",
      title: "Alguien vio tu perfil",
      message: "Alguien vio tu perfil",
      createdAt: new Date(),
      status: "profile_viewed",
    },
  });

  const snapshot = await getUserPreferenceSnapshot(params.ownerUserId);
  if (
    !snapshot.notificationEmailEnabled ||
    (snapshot.emailTypes.length > 0 && !snapshot.emailTypes.includes("profile_interest_digest"))
  ) {
    return;
  }

  const recentEvents = await prisma.event.findMany({
    where: {
      type: "view_profile",
      entityId: params.ownerUserId,
      userId: {
        not: null,
      },
      createdAt: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      userId: true,
    },
  });

  const distinctViewerIds = Array.from(
    new Set(
      recentEvents
        .map((event) => event.userId)
        .filter((viewerId): viewerId is string => Boolean(viewerId && viewerId !== params.ownerUserId)),
    ),
  );

  if (distinctViewerIds.length < 5) {
    return;
  }

  const companies = await prisma.user.findMany({
    where: {
      id: {
        in: distinctViewerIds.slice(0, 5),
      },
    },
    select: {
      displayName: true,
    },
  });

  await prisma.retentionTask.upsert({
    where: {
      userId_dedupeKey: {
        userId: params.ownerUserId,
        dedupeKey: `profile-interest:${params.ownerUserId}:${distinctViewerIds.sort().join("|")}`,
      },
    },
    update: {
      role: "candidate",
      kind: "profile_interest_digest",
      channel: "email",
      status: "scheduled",
      payloadJson: JSON.stringify({
        count: distinctViewerIds.length,
        companies: companies.map((company) => company.displayName).filter(Boolean),
        ctaHref: "/perfil/me",
        title: "Empresas interesadas en ti",
      }),
      scheduledAt: new Date(Date.now() + 1000 * 60 * 10),
    },
    create: {
      id: randomUUID(),
      userId: params.ownerUserId,
      role: "candidate",
      kind: "profile_interest_digest",
      channel: "email",
      status: "scheduled",
      dedupeKey: `profile-interest:${params.ownerUserId}:${distinctViewerIds.sort().join("|")}`,
      payloadJson: JSON.stringify({
        count: distinctViewerIds.length,
        companies: companies.map((company) => company.displayName).filter(Boolean),
        ctaHref: "/perfil/me",
        title: "Empresas interesadas en ti",
      }),
      scheduledAt: new Date(Date.now() + 1000 * 60 * 10),
    },
  });
}
