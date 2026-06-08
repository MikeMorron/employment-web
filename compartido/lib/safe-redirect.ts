"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

const SAFE_PATHS = new Set([
  "/",
  "/vacantes",
  "/matches",
  "/postulaciones",
  "/chat",
  "/guardado",
  "/perfil",
  "/perfil/me",
  "/ajustes",
  "/analytics",
  "/candidatos",
  "/publicadas",
  "/admin",
  "/admin/usuarios",
  "/admin/vacantes",
  "/admin/tasks",
  "/admin/chats",
  "/admin/create",
  "/admin/auth",
  "/admin/errors",
  "/admin/settings",
  "/admin/help-center",
]);

function normalizePathname(pathname: string) {
  const collapsed = pathname.replace(/\/{2,}/g, "/");
  if (collapsed.length > 1 && collapsed.endsWith("/")) {
    return collapsed.slice(0, -1);
  }

  return collapsed;
}

function containsUnsafeTokens(value: string) {
  const lower = value.toLowerCase();
  return (
    lower.includes("\0") ||
    lower.includes("javascript:") ||
    lower.includes("data:") ||
    lower.includes("file:") ||
    lower.includes("%00") ||
    lower.includes("%2f%2f") ||
    lower.includes("%5c") ||
    lower.includes("\\") ||
    lower.includes("<") ||
    lower.includes(">") ||
    lower.includes("../") ||
    lower.includes("..\\")
  );
}

export function sanitizeRedirectPath(rawPath: string | null | undefined, fallback = "/") {
  if (!rawPath || typeof rawPath !== "string") {
    return fallback;
  }

  const trimmed = rawPath.trim();
  if (!trimmed || containsUnsafeTokens(trimmed) || trimmed.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    if (typeof window !== "undefined" && parsed.origin !== window.location.origin) {
      return fallback;
    }

    const normalizedPath = normalizePathname(parsed.pathname);
    if (!SAFE_PATHS.has(normalizedPath)) {
      return fallback;
    }

    return normalizedPath;
  } catch {
    return fallback;
  }
}

export function safeRouterNavigate(router: AppRouterInstance, targetPath: string, fallback = "/") {
  router.push(sanitizeRedirectPath(targetPath, fallback));
}

export function safeRouterReplace(router: AppRouterInstance, targetPath: string, fallback = "/") {
  router.replace(sanitizeRedirectPath(targetPath, fallback));
}

export function forceSafeLocation(targetPath: string, fallback = "/") {
  if (typeof window === "undefined") {
    return;
  }

  const safePath = sanitizeRedirectPath(targetPath, fallback);
  const absoluteTarget = `${window.location.origin}${safePath}`;
  window.location.assign(absoluteTarget);
  window.setTimeout(() => {
    const currentSafePath = sanitizeRedirectPath(window.location.pathname, fallback);
    if (currentSafePath !== safePath) {
      window.location.assign(absoluteTarget);
    }
  }, 120);
}
