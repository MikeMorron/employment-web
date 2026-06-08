import {
  buildAuthenticatedHeaders,
  clearClientAuthBundle,
  ensureClientAuthBundle,
  getClientAuthBundle,
  refreshClientAuthBundle,
} from "@/lib/client/request-auth";

type ApiResult<T> = {
  ok: boolean;
  data: T | null;
  status: number;
  error?: string;
};

const inFlightApiRequests = new Map<string, Promise<ApiResult<unknown>>>();

function shouldLogApiRequest(url: string) {
  return (
    typeof window !== "undefined" &&
    url.startsWith("/api/") &&
    !url.startsWith("/api/events") &&
    !url.startsWith("/api/auth/login") &&
    !url.startsWith("/api/auth/register") &&
    !url.startsWith("/api/auth/session") &&
    !url.startsWith("/api/auth/refresh") &&
    !url.startsWith("/api/auth/logout")
  );
}

async function logApiRequestEvent(input: {
  url: string;
  method: string;
  status: number;
  ok: boolean;
  durationMs: number;
}) {
  if (!shouldLogApiRequest(input.url)) {
    return;
  }

  if (!getClientAuthBundle()) {
    return;
  }

  try {
    const currentUrl = new URL(input.url, window.location.origin);
    const pathWithQuery = `${currentUrl.pathname}${currentUrl.search}`;
    const payload = JSON.stringify({
      type: "api_request",
      entityId: currentUrl.pathname,
      metadata: {
        requestUrl: pathWithQuery,
        method: input.method,
        statusCode: input.status,
        ok: input.ok,
        durationMs: input.durationMs,
      },
      context: {
        source: "client_api",
        surface: "unknown",
        pathname: window.location.pathname,
        referrer: document.referrer || undefined,
        deviceType: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1100 ? "tablet" : "desktop",
        dedupeKey: `api:${input.method}:${pathWithQuery}:${Date.now()}:${crypto.randomUUID()}`,
      },
    });
    const authHeaders = await buildAuthenticatedHeaders("/api/events", "POST", payload);
    await fetch("/api/events", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(authHeaders.entries()),
      },
      body: payload,
    });
  } catch {
    // Best effort only.
  }
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  const method = options.method?.toUpperCase() ?? "GET";
  const bodyText =
    typeof options.body === "string"
      ? options.body
      : options.body
        ? JSON.stringify(options.body)
        : "";
  const requestKey = url.startsWith("/api/") ? `${method}:${url}:${bodyText}` : null;

  if (requestKey) {
    const existing = inFlightApiRequests.get(requestKey);
    if (existing) {
      return existing as Promise<ApiResult<T>>;
    }
  }

  const requestPromise = (async () => {
    const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    try {
      const skipAuth =
        url.startsWith("/api/auth/login") ||
        url.startsWith("/api/auth/register") ||
        url.startsWith("/api/auth/session");
      const authHeaders =
        typeof window !== "undefined" && url.startsWith("/api/") && !skipAuth
          ? await buildAuthenticatedHeaders(url, method, bodyText, options.headers)
          : new Headers(options.headers);
      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...Object.fromEntries(authHeaders.entries()),
        },
        ...options,
      });

      if ((res.status === 401 || res.status === 419) && typeof window !== "undefined" && url.startsWith("/api/") && !skipAuth) {
        if (res.status === 401) {
          clearClientAuthBundle();
        }

        const refreshed = res.status === 419
          ? await refreshClientAuthBundle({ requireRequestSigning: true })
          : await ensureClientAuthBundle();
        if (refreshed) {
          const retryHeaders = await buildAuthenticatedHeaders(url, method, bodyText, options.headers);
          const retry = await fetch(url, {
            headers: {
              "Content-Type": "application/json",
              ...Object.fromEntries(retryHeaders.entries()),
            },
            ...options,
          });
          const retryData = await retry.json().catch(() => null);
          const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
          void logApiRequestEvent({
            url,
            method,
            status: retry.status,
            ok: retry.ok,
            durationMs: Math.max(0, Math.round(endedAt - startedAt)),
          });

          return {
            ok: retry.ok,
            data: retryData as T,
            status: retry.status,
          };
        }
      }

      const data = await res.json().catch(() => null);
      const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
      void logApiRequestEvent({
        url,
        method,
        status: res.status,
        ok: res.ok,
        durationMs: Math.max(0, Math.round(endedAt - startedAt)),
      });

      return {
        ok: res.ok,
        data: data as T,
        status: res.status,
      };
    } catch (err) {
      const endedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
      void logApiRequestEvent({
        url,
        method,
        status: 0,
        ok: false,
        durationMs: Math.max(0, Math.round(endedAt - startedAt)),
      });
      return {
        ok: false,
        data: null,
        status: 0,
        error: err instanceof Error ? err.message : "Network error",
      };
    } finally {
      if (requestKey) {
        inFlightApiRequests.delete(requestKey);
      }
    }
  })();

  if (requestKey) {
    inFlightApiRequests.set(requestKey, requestPromise as Promise<ApiResult<unknown>>);
  }

  return requestPromise;
}
