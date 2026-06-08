import { randomUUID } from "node:crypto";
import { recordAdminErrorEntry } from "@/backend/lib-server/admin-ops-storage";

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const SAFE_ROUTE_PARAM_PATTERN = /^[A-Za-z0-9._:-]+$/;

function normalizeOriginValue(value: string | null | undefined) {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  try {
    return new URL(normalized).origin;
  } catch {
    return null;
  }
}

function getTrustedOriginsFromEnv() {
  return [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ]
    .flatMap((value) => String(value ?? "").split(","))
    .map(normalizeOriginValue)
    .filter((value): value is string => Boolean(value));
}

interface RateLimitOptions {
  scope: string;
  maxRequests: number;
  windowMs: number;
  userId?: string;
}

export function enforceRateLimit(
  request: Request,
  options: RateLimitOptions,
): Response | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  const key = `${options.scope}:${options.userId ?? ip}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  entry.count++;
  if (entry.count > options.maxRequests) {
    void recordAdminErrorEntry({
      id: randomUUID(),
      source: "security",
      title: "Rate limit exceeded",
      detail: `Rate limit hit on ${options.scope}`,
      statusCode: 429,
      severity: "high",
      createdAt: new Date().toISOString(),
      meta: {
        scope: options.scope,
        ip,
        userId: options.userId ?? null,
        method: request.method,
        url: request.url,
      },
    });
    return jsonWithSecurity(
      { ok: false, message: "Demasiadas solicitudes. Intenta más tarde." },
      { status: 429 },
    );
  }

  return null;
}

export function enforceTrustedOrigin(request: Request): Response | null {
  const origin = normalizeOriginValue(request.headers.get("origin"));
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (!origin) return null;

  const trustedOrigins = [
    ...getTrustedOriginsFromEnv(),
    `http://${host}`,
    `https://${host}`,
    "http://localhost:3000",
    "http://localhost:3001",
    host && forwardedProto ? `${forwardedProto}://${host}` : null,
  ]
    .map(normalizeOriginValue)
    .filter((value): value is string => Boolean(value));

  const isTrusted = trustedOrigins.includes(origin);
  if (!isTrusted) {
    void recordAdminErrorEntry({
      id: randomUUID(),
      source: "security",
      title: "Blocked origin",
      detail: `Rejected origin ${origin}`,
      statusCode: 403,
      severity: "high",
      createdAt: new Date().toISOString(),
      meta: {
        method: request.method,
        url: request.url,
        origin,
        host,
      },
    });
    return jsonWithSecurity({ ok: false, message: "Origen no autorizado" }, { status: 403 });
  }

  return null;
}

export function jsonWithSecurity(
  body: unknown,
  init?: ResponseInit,
): Response {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  headers.set("Cache-Control", "no-store");

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

export function textWithSecurity(body: BodyInit | null | undefined, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "text/plain; charset=utf-8");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  headers.set("Cache-Control", "no-store");

  return new Response(body ?? "", { ...init, headers });
}

export function isSafeRouteParam(value: string, maxLength = 160) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= maxLength &&
    SAFE_ROUTE_PARAM_PATTERN.test(value)
  );
}

export function sanitizePlainTextInput(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]+/g, " ")
    .replace(/[;\\$`<>/&"'{}\[\]¬@#~½¸|+]+/g, "")
    .replace(/[^\p{L}\p{N}\s.,:_¿?¡!“”-]/gu, "")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeNameInput(value: unknown, maxLength = 120) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001F\u007F]+/g, " ")
    .replace(/[^\p{L}\s]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function isRealNameInput(value: unknown) {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim();
  if (normalized.length < 2) {
    return false;
  }

  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+(?:\s[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+)*$/.test(normalized)) {
    return false;
  }

  if (/([a-zA-ZáéíóúÁÉÍÓÚñÑüÜ])\1\1\1/i.test(normalized)) {
    return false;
  }

  const lowered = normalized.toLowerCase();
  if (["asdf", "qwer", "zxcv", "hjkl", "qwerty", "test", "prueba"].some((pattern) => lowered.includes(pattern))) {
    return false;
  }

  if (/[^aeiouáéíóúü\s]{5,}/i.test(normalized)) {
    return false;
  }

  const suspiciousBigrams = ["ao", "au", "ue", "uo", "oa", "oe", "ah", "eh", "oh", "jh", "hf", "hd", "fd", "df", "dc", "dq", "qf", "qj", "xq", "zx"];
  return normalized.split(/\s+/).every((word) => {
    if (word.length < 7) {
      return true;
    }

    const normalizedWord = word
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const hits = suspiciousBigrams.filter((bigram) => normalizedWord.includes(bigram)).length;
    return hits < 2;
  });
}
