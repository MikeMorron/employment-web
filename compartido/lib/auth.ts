"use client";

import type { AppUser } from "@/types/profile";
import type { UserRole } from "@/types/account";
import { clearClientAuthBundle, getClientAuthBundle } from "@/lib/client/request-auth";
import {
  AUTH_EVENT,
  AUTH_USER_KEY,
  AUTH_USER_KEYS,
  ROUTE_HISTORY_KEYS,
  APP_RUNTIME_PREFIX,
  readFirstStorageValue,
  removeStorageKeys,
} from "@/lib/app-runtime";

export { AUTH_EVENT, AUTH_USER_KEY };

const LEGACY_DEMO_USER_IDS = new Set(["candidate-demo-001", "company-demo-001"]);
const LEGACY_DEMO_USER_EMAILS = new Set([
  "talentsyncro.candidate.demo@gmail.com",
  "talentsyncro.company.demo@outlook.com",
]);

let authSyncRevision = 0;
const SUPPRESS_HOME_REDIRECT_KEY = `${APP_RUNTIME_PREFIX}-suppress-home-redirect`;

function isUserShape(value: unknown): value is AppUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AppUser>;
  const companyCandidate = value as { companyName?: unknown; companyDescription?: unknown };
  return (
    typeof candidate.id === "string" &&
    (candidate.role === "candidate" || candidate.role === "company" || candidate.role === "admin") &&
    typeof candidate.plan === "string" &&
    typeof candidate.displayName === "string" &&
    typeof candidate.nombre === "string" &&
    typeof candidate.rol === "string" &&
    typeof candidate.email === "string" &&
    (candidate.role === "candidate"
      ? Array.isArray(candidate.skills) && Array.isArray(candidate.experiencia)
      : candidate.role === "admin"
        ? true
      : typeof companyCandidate.companyName === "string" &&
        typeof companyCandidate.companyDescription === "string")
  );
}

export function getStoredAuthUser(): AppUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  let raw: string | null = null;

  try {
    raw = readFirstStorageValue(window.localStorage, AUTH_USER_KEYS);
  } catch {
    return null;
  }

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!isUserShape(parsed)) {
      removeStorageKeys(window.localStorage, AUTH_USER_KEYS);
      return null;
    }

    if (
      LEGACY_DEMO_USER_IDS.has(parsed.id) ||
      LEGACY_DEMO_USER_EMAILS.has(parsed.email.toLowerCase())
    ) {
      removeStorageKeys(window.localStorage, AUTH_USER_KEYS);
      removeStorageKeys(window.sessionStorage, ROUTE_HISTORY_KEYS);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getStoredUser(): AppUser | null {
  return getStoredAuthUser();
}

export function syncAuthUser(user: AppUser) {
  if (typeof window === "undefined") {
    return;
  }

  authSyncRevision += 1;

  try {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    removeStorageKeys(window.sessionStorage, ROUTE_HISTORY_KEYS);
    removeStorageKeys(window.localStorage, AUTH_USER_KEYS.slice(1));
    window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: user }));
  } catch {
    // Ignore storage failures; auth remains non-critical.
  }
}

export const signInDemoAccount = syncAuthUser;

export function getDefaultRouteForRole(role: UserRole) {
  return role === "company" ? "/analytics" : role === "admin" ? "/admin" : "/vacantes";
}

export function getAuthSyncRevision() {
  return authSyncRevision;
}

function clearClientAuthState() {
  if (typeof window === "undefined") {
    return;
  }

  try {
      removeStorageKeys(window.localStorage, AUTH_USER_KEYS);
      removeStorageKeys(window.sessionStorage, ROUTE_HISTORY_KEYS);
      window.sessionStorage.removeItem(SUPPRESS_HOME_REDIRECT_KEY);
      window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: null }));
  } catch {
    // Ignore storage failures.
  }
}

export function suppressHomeRedirectOnce() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(SUPPRESS_HOME_REDIRECT_KEY, String(Date.now()));
}

export function consumeHomeRedirectSuppression() {
  if (typeof window === "undefined") {
    return false;
  }

  const value = window.sessionStorage.getItem(SUPPRESS_HOME_REDIRECT_KEY);
  if (!value) {
    return false;
  }

  window.sessionStorage.removeItem(SUPPRESS_HOME_REDIRECT_KEY);
  return true;
}

async function requestLogout(csrfToken?: string) {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
  });

  return response.ok;
}

async function getServerCsrfToken() {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean;
    auth?: {
      csrfToken?: string | null;
    } | null;
  } | null;

  const csrfToken = payload?.auth?.csrfToken;
  return typeof csrfToken === "string" && csrfToken.trim() ? csrfToken : null;
}

async function hasServerSession() {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return false;
  }

  const payload = (await response.json().catch(() => null)) as { ok?: boolean; user?: unknown | null } | null;
  return Boolean(payload?.user);
}

export async function signOutDemoUser() {
  if (typeof window === "undefined") {
    return;
  }

  authSyncRevision += 1;
  const logoutRevision = authSyncRevision;
  const currentBundle = getClientAuthBundle();
  let csrfToken = currentBundle?.csrfToken ?? null;

  if (!csrfToken) {
    try {
      csrfToken = await getServerCsrfToken();
    } catch {
      csrfToken = null;
    }
  }

  clearClientAuthState();
  clearClientAuthBundle();

  try {
    const firstAttemptOk = csrfToken ? await requestLogout(csrfToken) : false;

    if (logoutRevision !== authSyncRevision) {
      return;
    }

    if (!firstAttemptOk || (await hasServerSession())) {
      if (logoutRevision !== authSyncRevision) {
        return;
      }

      const retryCsrfToken = await getServerCsrfToken();
      if (retryCsrfToken) {
        await requestLogout(retryCsrfToken);
      }
    }
  } catch {
    // Ignore network failures after local auth state is cleared.
  }
}

export function signOutAccount(): void {
  authSyncRevision += 1;
  clearClientAuthState();
}
