"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, Mail, X } from "lucide-react";
import { GoogleIcon } from "@/components/icons/google-icon";
import { setClientAuthBundle } from "@/lib/client/request-auth";
import { useUiCopy } from "@/lib/i18n/ui-copy";
import { lockPageScroll } from "@/lib/client/scroll-lock";
import { getDefaultRouteForRole, signInDemoAccount, suppressHomeRedirectOnce } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import { useVacancyTheme } from "@/hooks/use-vacancy-theme";
import { safeRouterReplace } from "@/lib/safe-redirect";
import type { AppUser } from "@/types/profile";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  isEnglish?: boolean;
  onSuccess?: (user: AppUser) => void;
};

export function LoginModal({ open, onClose, onSuccess }: LoginModalProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useUiCopy("loginModal");
  const { isDark } = useVacancyTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const releaseScrollLock = lockPageScroll();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      releaseScrollLock();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const contextualMessage =
    pathname === "/postulaciones"
      ? t("postulationsSignInToContinue")
      : t("signInToContinue");

  const finishLogin = (
    user: AppUser,
    auth?: {
      accessToken: string;
      accessTokenExpiresAt: string;
      csrfToken: string;
      requestSigningKey: string;
      requestSigningKeyExpiresAt: string;
      sessionCheckExpiresAt: string;
    } | null,
  ) => {
    setClientAuthBundle(auth ?? null);
    signInDemoAccount(user);
    setError("");
    onSuccess?.(user);
    onClose();

    if (onSuccess) {
      return;
    }

    if (user.role === "candidate" && pathname === "/") {
      suppressHomeRedirectOnce();
      return;
    }

    safeRouterReplace(router, getDefaultRouteForRole(user.role), "/");
  };

  const handleLogin = async () => {
    setLoading(true);
    const result = await apiRequest<{
      ok: boolean;
      user: AppUser | null;
      auth?: {
        accessToken: string;
        accessTokenExpiresAt: string;
        csrfToken: string;
        requestSigningKey: string;
        requestSigningKeyExpiresAt: string;
        sessionCheckExpiresAt: string;
      } | null;
      message?: string;
    }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      },
    );
    setLoading(false);

    if (!result.ok || !result.data?.user) {
      setError(result.data?.message ?? t("invalidCredentials"));
      return;
    }

    finishLogin(result.data.user, result.data.auth ?? null);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await apiRequest<{
      ok: boolean;
      user: AppUser | null;
      auth?: {
        accessToken: string;
        accessTokenExpiresAt: string;
        csrfToken: string;
        requestSigningKey: string;
        requestSigningKeyExpiresAt: string;
        sessionCheckExpiresAt: string;
      } | null;
      message?: string;
    }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      },
    );
    setLoading(false);

    if (!result.ok || !result.data?.user) {
      setError(result.data?.message ?? t("googleCredentialsFirst"));
      return;
    }

    finishLogin(result.data.user, result.data.auth ?? null);
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="touch-scroll-y fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-4 sm:items-center sm:py-6"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <div
              className={isDark
                ? "touch-scroll-y relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[30px] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(7,16,31,0.98),rgba(8,17,32,0.94))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.42)]"
                : "touch-scroll-y relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[30px] border border-slate-200 bg-white p-6 shadow-2xl"}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex justify-start">
                <button
                  type="button"
                  onClick={onClose}
                  className={isDark
                    ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-200 transition hover:bg-white/8"
                    : "inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 transition hover:bg-slate-50"}
                  aria-label={t("close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="ts-safe-stack flex items-start justify-center gap-4">
                <div className="min-w-0">
                  <h3 className={isDark ? "ts-break-anywhere text-2xl font-bold text-white" : "ts-break-anywhere text-2xl font-bold text-slate-900"}>
                    {t("welcome")}
                  </h3>
                  <p className={isDark ? "mt-2 text-sm leading-6 text-slate-300" : "mt-2 text-sm leading-6 text-slate-600"}>
                    {contextualMessage}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className={isDark
                    ? "inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3 font-medium text-slate-100 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-60"
                    : "inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"}
                >
                  <GoogleIcon />
                  {t("signInWithGoogle")}
                </button>

                <div className="relative py-1">
                  <div className="h-px w-full bg-slate-200/80" />
                  <span className={isDark
                    ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#081120] px-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-400"
                    : "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-400"}>
                    {t("or")}
                  </span>
                </div>

                <div>
                  <label className={isDark ? "mb-2 block text-sm font-medium text-slate-200" : "mb-2 block text-sm font-medium text-slate-700"}>
                    {t("email")}
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className={isDark
                        ? "w-full rounded-2xl border border-white/10 bg-white/4 px-11 py-3 text-white outline-none transition focus:border-cyan-200/35"
                        : "w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-slate-900 outline-none transition focus:border-slate-400"}
                    />
                  </div>
                </div>

                <div>
                  <label className={isDark ? "mb-2 block text-sm font-medium text-slate-200" : "mb-2 block text-sm font-medium text-slate-700"}>
                    {t("password")}
                  </label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("passwordPlaceholder")}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={isDark
                        ? "w-full rounded-2xl border border-white/10 bg-white/4 px-11 py-3 pr-11 text-white outline-none transition focus:border-cyan-200/35"
                        : "w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 pr-11 text-slate-900 outline-none transition focus:border-slate-400"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                      className={isDark
                        ? "absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-slate-400 transition hover:text-slate-200"
                        : "absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-slate-500 transition hover:text-slate-700"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error ? (
                  <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </p>
                ) : null}

                <div className="flex items-center justify-between gap-3 text-sm">
                  <Link
                    href="/registro"
                    onClick={onClose}
                    className={isDark
                      ? "ts-break-anywhere min-w-0 font-medium text-slate-300 transition hover:text-white"
                      : "ts-break-anywhere min-w-0 font-medium text-slate-600 transition hover:text-slate-900"}
                  >
                    {t("createFreeAccount")}
                  </Link>
                  <button
                    type="button"
                    className={isDark
                      ? "font-medium text-slate-300 transition hover:text-white"
                      : "font-medium text-slate-600 transition hover:text-slate-900"}
                  >
                    {t("forgotPassword")}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 "
                >
                  {loading ? t("signingIn") : t("signIn")}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
