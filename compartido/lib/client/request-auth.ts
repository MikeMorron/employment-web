"use client";

type ClientAuthBundle = {
  accessToken: string;
  accessTokenExpiresAt: string;
  csrfToken: string;
  requestSigningKey: string;
  requestSigningKeyExpiresAt: string;
  sessionCheckExpiresAt: string;
};

const AUTH_BUNDLE_STORAGE_KEY = "jobwebpage-auth-bundle";
let authBundle: ClientAuthBundle | null = null;
let refreshPromise: Promise<ClientAuthBundle | null> | null = null;

type EnsureAuthBundleOptions = {
  requireRequestSigning?: boolean;
};

function bufferToBase64Url(buffer: ArrayBuffer) {
  const bytes = Array.from(new Uint8Array(buffer));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getStoredBundle() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(AUTH_BUNDLE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ClientAuthBundle) : null;
  } catch {
    return null;
  }
}

export function getClientAuthBundle() {
  if (authBundle) {
    return authBundle;
  }

  authBundle = getStoredBundle();
  return authBundle;
}

export function setClientAuthBundle(bundle: ClientAuthBundle | null) {
  authBundle = bundle;

  if (typeof window === "undefined") {
    return;
  }

  try {
    if (bundle) {
      window.sessionStorage.setItem(AUTH_BUNDLE_STORAGE_KEY, JSON.stringify(bundle));
    } else {
      window.sessionStorage.removeItem(AUTH_BUNDLE_STORAGE_KEY);
    }
  } catch {
    // ignore storage failures
  }
}

export function clearClientAuthBundle() {
  setClientAuthBundle(null);
}

function isExpired(isoDate: string, skewMs = 30_000) {
  return new Date(isoDate).getTime() <= Date.now() + skewMs;
}

async function requestAuthBundle(url: string, method: "GET" | "POST") {
  const current = getClientAuthBundle();
  const headers = new Headers({
    Accept: "application/json",
  });

  if (method === "POST" && current?.csrfToken) {
    headers.set("X-CSRF-Token", current.csrfToken);
  }

  const response = await fetch(url, {
    method,
    cache: "no-store",
    credentials: "same-origin",
    headers,
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json().catch(() => null)) as {
    auth?: ClientAuthBundle | null;
  } | null;
  const bundle = payload?.auth ?? null;
  setClientAuthBundle(bundle);
  return bundle;
}

async function rotateClientSigningKey() {
  return requestAuthBundle("/api/auth/session/rotate-key", "POST");
}

export async function refreshClientAuthBundle(options: EnsureAuthBundleOptions = {}) {
  const current = getClientAuthBundle();
  const { requireRequestSigning = false } = options;

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    if (current?.csrfToken) {
      if (
        requireRequestSigning &&
        current.requestSigningKeyExpiresAt &&
        isExpired(current.requestSigningKeyExpiresAt)
      ) {
        const rotated = await rotateClientSigningKey();
        if (rotated) {
          return rotated;
        }
      }

      const refreshed = await requestAuthBundle("/api/auth/refresh", "POST");
      if (refreshed) {
        return refreshed;
      }
    }

    return requestAuthBundle("/api/auth/session", "GET");
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function ensureClientAuthBundle(options: EnsureAuthBundleOptions = {}) {
  const current = getClientAuthBundle();
  const { requireRequestSigning = false } = options;
  if (
    current &&
    !isExpired(current.sessionCheckExpiresAt) &&
    !isExpired(current.accessTokenExpiresAt) &&
    (!requireRequestSigning || !isExpired(current.requestSigningKeyExpiresAt))
  ) {
    return current;
  }

  if (
    requireRequestSigning &&
    current?.requestSigningKeyExpiresAt &&
    isExpired(current.requestSigningKeyExpiresAt, 0)
  ) {
    const rotated = await rotateClientSigningKey();
    if (rotated) {
      return rotated;
    }
  }

  if (current?.sessionCheckExpiresAt && isExpired(current.sessionCheckExpiresAt, 0)) {
    const revalidated = await requestAuthBundle("/api/auth/session", "GET");
    if (revalidated) {
      return revalidated;
    }
  }

  return refreshClientAuthBundle({ requireRequestSigning });
}

async function signRequestPayload(input: {
  method: string;
  url: string;
  timestamp: string;
  nonce: string;
  csrfToken: string;
  requestSigningKey: string;
  bodyText: string;
}) {
  const bodyDigest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input.bodyText),
  );
  const bodyHash = Array.from(new Uint8Array(bodyDigest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  const payload = [
    input.method.toUpperCase(),
    input.url,
    input.timestamp,
    input.nonce,
    input.csrfToken,
    bodyHash,
  ].join("\n");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(input.requestSigningKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );

  return bufferToBase64Url(signature);
}

export async function buildAuthenticatedHeaders(
  url: string,
  method: string,
  bodyText: string,
  headersInit?: HeadersInit,
) {
  const requiresRequestSigning = !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
  const bundle = await ensureClientAuthBundle({
    requireRequestSigning: requiresRequestSigning,
  });
  const headers = new Headers(headersInit);

  if (!bundle) {
    return headers;
  }

  headers.set("Authorization", `Bearer ${bundle.accessToken}`);

  if (requiresRequestSigning) {
    headers.set("X-CSRF-Token", bundle.csrfToken);

    const timestamp = String(Date.now());
    const nonce = crypto.randomUUID();
    const currentUrl = new URL(url, window.location.origin);
    const signature = await signRequestPayload({
      method,
      url: `${currentUrl.pathname}${currentUrl.search}`,
      timestamp,
      nonce,
      csrfToken: bundle.csrfToken,
      requestSigningKey: bundle.requestSigningKey,
      bodyText,
    });

    headers.set("X-Request-Timestamp", timestamp);
    headers.set("X-Request-Nonce", nonce);
    headers.set("X-Request-Signature", signature);
  }

  return headers;
}
