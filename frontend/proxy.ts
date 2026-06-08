import { NextRequest, NextResponse } from "next/server";

type CaptchaChallenge = {
  id: string;
  prompt: string;
  answer: string;
  expiresAt: number;
};

type IpSecurityState = {
  windowStart: number;
  count: number;
  strikes: number;
  blacklisted: boolean;
  suspiciousUntil: number;
  lastSeenAt: number;
  challenge: CaptchaChallenge | null;
};

type TrafficShieldState = {
  ipState: Map<string, IpSecurityState>;
  windows: Map<number, Set<string>>;
  consecutiveTrips: number;
  breakerOpenUntil: number;
};

const MAX_REQUESTS_PER_SECOND = 100;
const MAX_STRIKES = 3;
const GLOBAL_DISTINCT_IP_THRESHOLD = 1000;
const CIRCUIT_BREAKER_TRIPS = 5;
const CIRCUIT_BREAKER_COOLDOWN_MS = 60_000;
const CAPTCHA_TTL_MS = 120_000;
const SUSPICIOUS_COOLDOWN_MS = 300_000;

declare global {
  var __trafficShieldState__: TrafficShieldState | undefined;
}

function getTrafficShieldState(): TrafficShieldState {
  if (!globalThis.__trafficShieldState__) {
    globalThis.__trafficShieldState__ = {
      ipState: new Map(),
      windows: new Map(),
      consecutiveTrips: 0,
      breakerOpenUntil: 0,
    };
  }

  return globalThis.__trafficShieldState__;
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip")?.trim() ??
    "unknown"
  );
}

function buildJsonResponse(
  payload: Record<string, unknown>,
  status: number,
  extraHeaders?: HeadersInit,
) {
  const response = NextResponse.json(payload, { status });
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Traffic-Shield", "active");

  if (extraHeaders) {
    const headers = new Headers(extraHeaders);
    headers.forEach((value, key) => response.headers.set(key, value));
  }

  return response;
}

function createChallenge(ip: string): CaptchaChallenge {
  const left = Math.floor(Math.random() * 8) + 2;
  const right = Math.floor(Math.random() * 8) + 2;
  return {
    id: `${ip}:${Date.now()}`,
    prompt: `Resuelve ${left} + ${right}`,
    answer: String(left + right),
    expiresAt: Date.now() + CAPTCHA_TTL_MS,
  };
}

function isObviousBot(userAgent: string) {
  return /(sqlmap|nikto|nmap|masscan|nessus|zgrab|gobuster|dirbuster|hydra|python-requests|go-http-client|headless)/i.test(
    userAgent,
  );
}

function pruneState(state: TrafficShieldState, now: number) {
  for (const [windowKey] of state.windows) {
    if (windowKey < Math.floor((now - 5000) / 1000)) {
      state.windows.delete(windowKey);
    }
  }

  for (const [ip, entry] of state.ipState) {
    if (!entry.blacklisted && now - entry.lastSeenAt > 10 * 60_000) {
      state.ipState.delete(ip);
    }
  }
}

function registerTrip(state: TrafficShieldState, now: number) {
  state.consecutiveTrips += 1;
  if (state.consecutiveTrips >= CIRCUIT_BREAKER_TRIPS) {
    state.breakerOpenUntil = now + CIRCUIT_BREAKER_COOLDOWN_MS;
    state.consecutiveTrips = 0;
  }
}

function registerHealthyRequest(state: TrafficShieldState) {
  if (state.consecutiveTrips > 0) {
    state.consecutiveTrips = 0;
  }
}

function markBlacklisted(entry: IpSecurityState) {
  entry.blacklisted = true;
  entry.suspiciousUntil = Number.MAX_SAFE_INTEGER;
  entry.challenge = null;
}

function ensureIpEntry(state: TrafficShieldState, ip: string, now: number) {
  const existing = state.ipState.get(ip);
  if (existing) {
    existing.lastSeenAt = now;
    return existing;
  }

  const next: IpSecurityState = {
    windowStart: now,
    count: 0,
    strikes: 0,
    blacklisted: false,
    suspiciousUntil: 0,
    lastSeenAt: now,
    challenge: null,
  };
  state.ipState.set(ip, next);
  return next;
}

function verifyCaptcha(request: NextRequest, entry: IpSecurityState) {
  if (!entry.challenge) {
    return true;
  }

  if (entry.challenge.expiresAt < Date.now()) {
    entry.challenge = null;
    return false;
  }

  const challengeId = request.headers.get("x-human-challenge-id");
  const challengeAnswer = request.headers.get("x-human-challenge-answer");

  if (
    challengeId === entry.challenge.id &&
    challengeAnswer?.trim() === entry.challenge.answer
  ) {
    entry.challenge = null;
    entry.suspiciousUntil = 0;
    entry.strikes = 0;
    return true;
  }

  return false;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // The traffic shield is meant for deployed environments. In local dev it
  // produces false positives against Next.js/client bootstrap traffic.
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const now = Date.now();
  const state = getTrafficShieldState();
  pruneState(state, now);

  if (state.breakerOpenUntil > now) {
    return buildJsonResponse(
      {
        ok: false,
        message: "API temporalmente protegida por circuit breaker",
      },
      503,
      { "Retry-After": String(Math.ceil((state.breakerOpenUntil - now) / 1000)) },
    );
  }

  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") ?? "";
  const entry = ensureIpEntry(state, ip, now);

  if (entry.blacklisted) {
    return buildJsonResponse(
      { ok: false, message: "IP bloqueada por abuso de tráfico" },
      429,
    );
  }

  const secondKey = Math.floor(now / 1000);
  const windowIps = state.windows.get(secondKey) ?? new Set<string>();
  windowIps.add(ip);
  state.windows.set(secondKey, windowIps);

  if (windowIps.size >= GLOBAL_DISTINCT_IP_THRESHOLD) {
    for (const attackerIp of windowIps) {
      const attackerEntry = ensureIpEntry(state, attackerIp, now);
      attackerEntry.strikes = MAX_STRIKES;
      markBlacklisted(attackerEntry);
    }
    registerTrip(state, now);
    return buildJsonResponse(
      { ok: false, message: "Patrón masivo de tráfico bloqueado" },
      429,
    );
  }

  if (isObviousBot(userAgent)) {
    entry.strikes = MAX_STRIKES;
    markBlacklisted(entry);
    registerTrip(state, now);
    return buildJsonResponse(
      { ok: false, message: "Bot detectado y bloqueado" },
      403,
    );
  }

  if (entry.windowStart + 1000 <= now) {
    entry.windowStart = now;
    entry.count = 0;
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS_PER_SECOND) {
    entry.strikes += 1;
    entry.suspiciousUntil = now + SUSPICIOUS_COOLDOWN_MS;
    if (entry.strikes >= MAX_STRIKES) {
      markBlacklisted(entry);
    } else {
      entry.challenge = createChallenge(ip);
    }
    registerTrip(state, now);
    return buildJsonResponse(
      {
        ok: false,
        message:
          entry.blacklisted
            ? "IP bloqueada por abuso de tráfico"
            : "Límite de tráfico excedido",
        challenge:
          !entry.blacklisted && entry.challenge
            ? {
                id: entry.challenge.id,
                prompt: entry.challenge.prompt,
                answerHeader: "x-human-challenge-answer",
              }
            : null,
      },
      429,
      { "Retry-After": "1" },
    );
  }

  const needsCaptcha = entry.suspiciousUntil > now;
  if (needsCaptcha && !verifyCaptcha(request, entry)) {
    if (!entry.challenge) {
      entry.challenge = createChallenge(ip);
    }
    return buildJsonResponse(
      {
        ok: false,
        message: "Verificación humana requerida",
        challenge: {
          id: entry.challenge.id,
          prompt: entry.challenge.prompt,
          answerHeader: "x-human-challenge-answer",
        },
      },
      403,
    );
  }

  registerHealthyRequest(state);
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
