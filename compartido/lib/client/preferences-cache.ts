"use client";

export type UserSettings = {
  theme?: "dark" | "light";
  language?: "es" | "en";
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  emailFrequency?: "instant" | "daily" | "digest_3d";
  emailTypes?: string[];
};

let cachedSettingsUserId: string | null = null;
let cachedSettings: UserSettings | null = null;
let pendingSettingsRequestUserId: string | null = null;
let pendingSettingsRequest: Promise<UserSettings | null> | null = null;

export function getCachedUserSettings(userId: string | null | undefined) {
  if (!userId || cachedSettingsUserId !== userId) {
    return null;
  }

  return cachedSettings;
}

export function setCachedUserSettings(
  userId: string | null | undefined,
  settings: UserSettings | null | undefined,
) {
  if (!userId) {
    cachedSettingsUserId = null;
    cachedSettings = null;
    return;
  }

  cachedSettingsUserId = userId;
  cachedSettings = settings ?? {};
}

export function getPendingSettingsRequest(userId: string | null | undefined) {
  if (!userId || pendingSettingsRequestUserId !== userId) {
    return null;
  }

  return pendingSettingsRequest;
}

export function setPendingSettingsRequest(
  userId: string | null | undefined,
  request: Promise<UserSettings | null> | null,
) {
  pendingSettingsRequestUserId = userId && request ? userId : null;
  pendingSettingsRequest = request;
}
