"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  AUTH_EVENT,
  AUTH_USER_KEY,
  getAuthSyncRevision,
  getStoredAuthUser,
  signOutDemoUser,
  syncAuthUser,
} from "@/lib/auth";
import {
  clearClientAuthBundle,
  getClientAuthBundle,
  setClientAuthBundle,
} from "@/lib/client/request-auth";
import { getDerivedPermissions } from "@/lib/plans";
import { forceSafeLocation } from "@/lib/safe-redirect";
import type { AppUser } from "@/types/profile";

let sessionSyncPromise: Promise<void> | null = null;
let sessionSyncBootstrapped = false;
let sessionSyncResolved = false;
const sessionSyncListeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(AUTH_EVENT, onStoreChange as EventListener);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(AUTH_EVENT, onStoreChange as EventListener);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getClientSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_USER_KEY);
}

function subscribeHydration() {
  return () => {};
}

function subscribeSessionSync(onStoreChange: () => void) {
  sessionSyncListeners.add(onStoreChange);

  return () => {
    sessionSyncListeners.delete(onStoreChange);
  };
}

function getSessionSyncSnapshot() {
  return sessionSyncResolved;
}

function setSessionSyncResolved(resolved: boolean) {
  if (sessionSyncResolved === resolved) {
    return;
  }

  sessionSyncResolved = resolved;
  sessionSyncListeners.forEach((listener) => listener());
}

function publishAuthSnapshot(user: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  if (user) {
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: user }));
    return;
  }

  window.localStorage.removeItem(AUTH_USER_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: null }));
}

export async function syncAuthSessionFromServer() {
  if (typeof window === "undefined") {
    return;
  }

  if (sessionSyncPromise) {
    return sessionSyncPromise;
  }

  sessionSyncPromise = (async () => {
    const syncRevision = getAuthSyncRevision();

    try {
      const response = await fetch("/api/auth/session", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        ok: boolean;
        user: unknown | null;
        auth?: {
          accessToken: string;
          accessTokenExpiresAt: string;
          csrfToken: string;
          requestSigningKey: string;
          requestSigningKeyExpiresAt: string;
          sessionCheckExpiresAt: string;
        } | null;
      };

      if (!payload.ok) {
        return;
      }

      if (syncRevision !== getAuthSyncRevision()) {
        return;
      }

      setClientAuthBundle(payload.auth ?? null);
      publishAuthSnapshot(payload.user);
    } catch {
      // Keep the last known client session if the sync request fails.
    } finally {
      sessionSyncPromise = null;
      setSessionSyncResolved(true);
    }
  })();

  return sessionSyncPromise;
}

export function useAuthUser() {
  const hasHydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const authSnapshot = useSyncExternalStore(subscribe, getClientSnapshot, () => null);
  const sessionResolved = useSyncExternalStore(
    subscribeSessionSync,
    getSessionSyncSnapshot,
    () => false,
  );
  const authUser = useMemo(() => {
    if (!hasHydrated || !authSnapshot) {
      return null;
    }

    if (!sessionResolved && !getClientAuthBundle()) {
      return null;
    }

    return getStoredAuthUser();
  }, [authSnapshot, hasHydrated, sessionResolved]);
  const authStateReady = hasHydrated && (sessionResolved || Boolean(getClientAuthBundle()));
  const permissions = useMemo(
    () => (authUser ? getDerivedPermissions(authUser.role, authUser.plan) : null),
    [authUser],
  );

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (sessionSyncBootstrapped) {
      return;
    }

    sessionSyncBootstrapped = true;
    void syncAuthSessionFromServer();
  }, [hasHydrated]);

  const signOut = useCallback(async () => {
    await signOutDemoUser();
    clearClientAuthBundle();
    forceSafeLocation("/", "/");
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch("/api/profile/me", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const payload = (await response.json()) as { user?: AppUser };
      if (response.ok && payload?.user) {
        syncAuthUser(payload.user);
      } else {
        await syncAuthSessionFromServer();
      }
    } catch {
      await syncAuthSessionFromServer();
    }
  }, []);

  const setAuthUser = useCallback((user: AppUser | null) => {
    setSessionSyncResolved(true);

    if (user) {
      syncAuthUser(user);
      return;
    }

    publishAuthSnapshot(null);
    clearClientAuthBundle();
  }, []);

  return {
    authUser,
    isAuthenticated: authStateReady && Boolean(authUser),
    permissions,
    hasHydrated,
    authLoading: !authStateReady,
    signOut,
    refreshUser,
    setAuthUser,
  };
}
