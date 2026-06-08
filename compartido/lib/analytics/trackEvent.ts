"use client";

import { apiRequest } from "@/lib/api";
import type {
  AnalyticsEventContext,
  AnalyticsEventSource,
  AnalyticsEventSurface,
  AnalyticsEventType,
} from "@/types/events";
import {
  ANALYTICS_EVENT_PREFIX,
  ANALYTICS_PAGE_ENTRY_PREFIX,
  ANALYTICS_SESSION_ID_KEY,
} from "@/lib/app-runtime";

const inFlightEventKeys = new Set<string>();
const recentEventTimestamps = new Map<string, number>();
const SHORT_EVENT_COOLDOWN_MS = 1_500;
const VIEW_EVENT_COOLDOWN_MS = 60_000;
const longCooldownEvents = new Set<AnalyticsEventType>([
  "view_job",
  "view_profile",
  "view_plan",
]);

type TrackEventInput = {
  type: AnalyticsEventType;
  entityId: string;
  metadata?: Record<string, unknown>;
  source?: AnalyticsEventSource;
  surface?: AnalyticsEventSurface;
  context?: Partial<AnalyticsEventContext>;
};

function buildMetadataFingerprint(metadata: Record<string, unknown> | undefined) {
  if (!metadata) {
    return "";
  }

  const sortedEntries = Object.entries(metadata).sort(([leftKey], [rightKey]) =>
    leftKey.localeCompare(rightKey),
  );

  return JSON.stringify(sortedEntries);
}

function buildEventFingerprint({ type, entityId, metadata }: TrackEventInput) {
  return `${type}:${entityId}:${buildMetadataFingerprint(metadata)}`;
}

function getSessionId() {
  if (typeof window === "undefined") {
    return "server-session";
  }

  try {
    const existing = window.sessionStorage.getItem(ANALYTICS_SESSION_ID_KEY);
    if (existing) {
      return existing;
    }

    const next = crypto.randomUUID();
    window.sessionStorage.setItem(ANALYTICS_SESSION_ID_KEY, next);
    return next;
  } catch {
    return "untracked-session";
  }
}

function getDeviceType(): AnalyticsEventContext["deviceType"] {
  if (typeof window === "undefined") {
    return "server";
  }

  const width = window.innerWidth;
  if (width < 768) {
    return "mobile";
  }
  if (width < 1100) {
    return "tablet";
  }

  return "desktop";
}

function getPageEntryTimestamp(pathname: string) {
  if (typeof window === "undefined") {
    return Date.now();
  }

  const storageKey = `${ANALYTICS_PAGE_ENTRY_PREFIX}:${pathname}`;
  const now = Date.now();

  try {
    const existing = Number(window.sessionStorage.getItem(storageKey));
    if (Number.isFinite(existing) && existing > 0) {
      return existing;
    }

    window.sessionStorage.setItem(storageKey, String(now));
  } catch {
    // Ignore storage failures and fallback to now.
  }

  return now;
}

function buildContext(
  type: AnalyticsEventType,
  source: AnalyticsEventSource | undefined,
  surface: AnalyticsEventSurface | undefined,
  metadata: Record<string, unknown> | undefined,
  context: Partial<AnalyticsEventContext> | undefined,
): AnalyticsEventContext {
  const pathname = context?.pathname ?? window.location.pathname;
  const pageEnteredAt = getPageEntryTimestamp(pathname);
  const timeOnPageMs = Math.max(0, Date.now() - pageEnteredAt);
  const metadataSource = typeof metadata?.source === "string" ? metadata.source : undefined;

  return {
    sessionId: context?.sessionId ?? getSessionId(),
    source: context?.source ?? source ?? (metadataSource as AnalyticsEventSource | undefined) ?? "unknown",
    surface: context?.surface ?? surface ?? "unknown",
    pathname,
    referrer: context?.referrer ?? (document.referrer || undefined),
    deviceType: context?.deviceType ?? getDeviceType(),
    actorRole: context?.actorRole ?? "anonymous",
    timeOnPageMs:
      longCooldownEvents.has(type) || type === "click_job" || type === "apply_job"
        ? timeOnPageMs
        : context?.timeOnPageMs,
    dedupeKey: context?.dedupeKey,
  };
}

function getCooldownMs(type: AnalyticsEventType) {
  return longCooldownEvents.has(type) ? VIEW_EVENT_COOLDOWN_MS : SHORT_EVENT_COOLDOWN_MS;
}

function readStoredTimestamp(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(`${ANALYTICS_EVENT_PREFIX}:${key}`);
    if (!rawValue) {
      return null;
    }

    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStoredTimestamp(key: string, timestamp: number) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(`${ANALYTICS_EVENT_PREFIX}:${key}`, String(timestamp));
  } catch {
    // Ignore storage failures and keep the in-memory cooldown only.
  }
}

function isWithinCooldown(key: string, cooldownMs: number, now: number) {
  const memoryTimestamp = recentEventTimestamps.get(key);
  if (typeof memoryTimestamp === "number" && now - memoryTimestamp < cooldownMs) {
    return true;
  }

  const storedTimestamp = readStoredTimestamp(key);
  if (typeof storedTimestamp === "number" && now - storedTimestamp < cooldownMs) {
    recentEventTimestamps.set(key, storedTimestamp);
    return true;
  }

  return false;
}

function markEventTracked(key: string, timestamp: number) {
  recentEventTimestamps.set(key, timestamp);
  writeStoredTimestamp(key, timestamp);
}

export async function trackEvent({ type, entityId, metadata, source, surface, context }: TrackEventInput) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedEntityId = entityId.trim();
  if (!normalizedEntityId) {
    return;
  }

  const eventFingerprint = buildEventFingerprint({
    type,
    entityId: normalizedEntityId,
    metadata,
  });
  const cooldownMs = getCooldownMs(type);
  const now = Date.now();

  if (inFlightEventKeys.has(eventFingerprint) || isWithinCooldown(eventFingerprint, cooldownMs, now)) {
    return;
  }

  inFlightEventKeys.add(eventFingerprint);
  markEventTracked(eventFingerprint, now);

  try {
    const nextContext = buildContext(type, source, surface, metadata, context);
    await apiRequest("/api/events", {
      method: "POST",
      body: JSON.stringify({
        type,
        entityId: normalizedEntityId,
        metadata,
        context: nextContext,
      }),
    });
  } catch {
    // Best effort only.
  } finally {
    inFlightEventKeys.delete(eventFingerprint);
  }
}
