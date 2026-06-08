"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BellDot, BellRing, BookMarked, ChevronDown, LogOut, Moon, Settings2, Sun, UserRound } from "lucide-react";
import { InlineConfirm } from "@/components/ui/inline-confirm";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUiCopy } from "@/lib/i18n/ui-copy";

function FlagEs({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" aria-hidden="true" className={className}>
      <rect width="36" height="24" fill="#fcd116" />
      <rect y="12" width="36" height="6" fill="#003893" />
      <rect y="18" width="36" height="6" fill="#ce1126" />
    </svg>
  );
}

function FlagEn({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" aria-hidden="true" className={className}>
      <rect width="36" height="24" fill="#012169" />
      <path d="M0 0 36 24M36 0 0 24" stroke="#fff" strokeWidth="4" />
      <path d="M0 0 36 24M36 0 0 24" stroke="#c8102e" strokeWidth="2" />
      <path d="M18 0v24M0 12h36" stroke="#fff" strokeWidth="6" />
      <path d="M18 0v24M0 12h36" stroke="#c8102e" strokeWidth="3.5" />
    </svg>
  );
}

export function UserMenu({
  isDark,
  onToggleTheme,
  notificationCount = 0,
  onToggleNotifications,
}: {
  isDark: boolean;
  onToggleTheme: () => void;
  notificationCount?: number;
  onToggleNotifications?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { language, setLanguage } = useAppLanguage();
  const t = useUiCopy("userMenu");
  const { authUser, signOut } = useAuthUser();
  const accountRole = authUser?.role ?? "candidate";
  const displayName = authUser?.nombre ?? "";
  const compactDisplayName = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  const shortName =
    compactDisplayName.length >= 2
      ? `${compactDisplayName[0]} ${compactDisplayName[1][0]}.`
      : compactDisplayName[0] ?? "";
  const closeMenu = () => {
    setLogoutConfirmOpen(false);
    setMenuOpen(false);
  };

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (menuRef.current?.contains(target ?? null)) {
        return;
      }
      closeMenu();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  if (!displayName) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        type="button"
        aria-label={t("openProfileMenu")}
        aria-expanded={menuOpen}
        onClick={() => {
          if (menuOpen) {
            closeMenu();
            return;
          }

          setMenuOpen(true);
        }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className={
          isDark
            ? "ts-action-secondary flex h-10 max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/4 px-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition duration-300 hover:border-cyan-200/28 hover:bg-white/8 sm:h-11 sm:gap-3 sm:px-3"
            : "ts-action-secondary flex h-10 max-w-full items-center gap-2 rounded-full border border-slate-300/80 bg-white/90 px-2.5 shadow-[0_14px_34px_rgba(148,163,184,0.12)] transition duration-300 hover:border-sky-300 hover:bg-slate-50 sm:h-11 sm:gap-3 sm:px-3"
        }
      >
        <div
          className={
            isDark
              ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(34,211,238,0.14),rgba(59,130,246,0.12))] text-cyan-100 sm:h-9 sm:w-9"
              : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-300/30 bg-sky-100 text-sky-700 sm:h-9 sm:w-9"
          }
        >
          <UserRound className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 text-left">
          <p className={isDark ? "truncate text-sm font-semibold text-white" : "truncate text-sm font-semibold text-slate-900"}>
            {shortName}
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition duration-200 ${menuOpen ? "rotate-180" : ""} ${
            isDark ? "text-slate-300" : "text-slate-600"
          }`}
        />
      </motion.button>

      <AnimatePresence initial={false}>
      {menuOpen ? (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={
            isDark
              ? "absolute right-0 top-[calc(100%+0.75rem)] z-[90] w-72 rounded-[1.6rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(7,16,31,0.98),rgba(8,17,32,0.94))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl"
              : "absolute right-0 top-[calc(100%+0.75rem)] z-[90] w-72 rounded-[1.6rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-4 shadow-[0_24px_70px_rgba(148,163,184,0.20)] backdrop-blur-xl"
          }
        >
          <div className="space-y-3">
            <Link
              href="/perfil/me"
              onClick={() => setMenuOpen(false)}
              className={
                isDark
                  ? "ts-action-secondary block rounded-[1.1rem] border border-white/8 bg-white/4 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-200/24 hover:bg-white/8"
                  : "ts-action-secondary block rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-sky-300 hover:bg-white"
              }
            >
              <span className="inline-flex items-center gap-3">
                <UserRound className="h-4.5 w-4.5" />
                {accountRole === "company" ? t("companyProfile") : t("myProfile")}
              </span>
            </Link>

            <Link
              href="/guardado"
              onClick={() => setMenuOpen(false)}
              className={
                isDark
                  ? "ts-action-secondary flex items-center gap-3 rounded-[1.1rem] border border-white/8 bg-white/4 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-200/24 hover:bg-white/8"
                  : "ts-action-secondary flex items-center gap-3 rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-sky-300 hover:bg-white"
              }
            >
              <BookMarked className="h-4.5 w-4.5" />
              {t("saved")}
            </Link>

            {accountRole === "candidate" ? (
              <Link
                href="/invitaciones"
                onClick={() => setMenuOpen(false)}
                className={
                  isDark
                    ? "ts-action-secondary flex items-center gap-3 rounded-[1.1rem] border border-white/8 bg-white/4 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-emerald-200/24 hover:bg-white/8"
                    : "ts-action-secondary flex items-center gap-3 rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-emerald-300 hover:bg-white"
                }
              >
                <BellRing className="h-4.5 w-4.5 text-emerald-500" />
                {language === "en" ? "Company offers" : "Ofertas de empresas"}
              </Link>
            ) : null}

            <div className="grid gap-3 lg:hidden">
              <button
                type="button"
                onClick={() => {
                  onToggleNotifications?.();
                  setMenuOpen(false);
                }}
                className={
                  isDark
                    ? "ts-action-secondary flex items-center justify-between rounded-[1.1rem] border border-white/8 bg-white/4 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-200/24 hover:bg-white/8"
                    : "ts-action-secondary flex items-center justify-between rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-sky-300 hover:bg-white"
                }
              >
                <span className="inline-flex items-center gap-3">
                  <BellDot className="h-4.5 w-4.5" />
                  {t("notifications")}
                </span>
                {notificationCount > 0 ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {notificationCount}
                  </span>
                ) : null}
              </button>
            </div>

            <div
              className={
                isDark
                  ? "flex items-center justify-between rounded-[1.1rem] border border-white/8 bg-white/4 px-4 py-3"
                  : "flex items-center justify-between rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3"
              }
            >
              <div>
                <p className={isDark ? "text-sm font-medium text-slate-100" : "text-sm font-medium text-slate-900"}>
                  {t("theme")}
                </p>
                <p className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
                  {t("themeDescription")}
                </p>
              </div>
              <button
                type="button"
                aria-label={isDark ? t("enableLightMode") : t("enableDarkMode")}
                aria-pressed={isDark}
                onClick={onToggleTheme}
                className={`relative inline-flex h-8 w-14 items-center rounded-full border transition duration-300 ${
                  isDark ? "border-cyan-300/25 bg-cyan-400/20" : "border-slate-300 bg-slate-200"
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition duration-300 ${
                    isDark
                      ? "translate-x-[1.35rem] bg-cyan-300 text-[#042234]"
                      : "translate-x-1 bg-white text-slate-700"
                  }`}
                >
                  {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </span>
              </button>
            </div>

            <div
              className={
                isDark
                  ? "flex items-center justify-between rounded-[1.1rem] border border-white/8 bg-white/4 px-4 py-3"
                  : "flex items-center justify-between rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3"
              }
            >
              <div>
                <p className={isDark ? "text-sm font-medium text-slate-100" : "text-sm font-medium text-slate-900"}>
                  {t("language")}
                </p>
                <p className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
                  {t("languageDescription")}
                </p>
              </div>
              <div
                className={
                  isDark
                    ? "inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-white/6 p-1"
                    : "inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white p-1"
                }
              >
                <button
                  type="button"
                  onClick={() => setLanguage("es")}
                  aria-pressed={language === "es"}
                  className={
                    language === "es"
                      ? "inline-flex scale-105 items-center gap-1.5 rounded-full bg-[#4d7994] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-[0_8px_18px_rgba(77,121,148,0.28)] transition-all duration-250"
                      : isDark
                        ? "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-all duration-250 hover:bg-white/10"
                        : "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition-all duration-250 hover:bg-slate-100"
                  }
                >
                  <FlagEs />
                  ES
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  aria-pressed={language === "en"}
                  className={
                    language === "en"
                      ? "inline-flex scale-105 items-center gap-1.5 rounded-full bg-[#944d4d] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-[0_8px_18px_rgba(148,77,77,0.28)] transition-all duration-250"
                      : isDark
                        ? "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-all duration-250 hover:bg-white/10"
                        : "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 transition-all duration-250 hover:bg-slate-100"
                  }
                >
                  <FlagEn />
                  EN
                </button>
              </div>
            </div>

            <Link
              href="/ajustes"
              onClick={() => setMenuOpen(false)}
              className={
                isDark
                  ? "ts-action-secondary block rounded-[1.1rem] border border-white/8 bg-white/4 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-200/24 hover:bg-white/8"
                  : "ts-action-secondary block rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-sky-300 hover:bg-white"
              }
            >
              <span className="inline-flex items-center gap-3">
                <Settings2 className="h-4.5 w-4.5" />
                {t("settings")}
              </span>
            </Link>

            {logoutConfirmOpen ? (
              <InlineConfirm
                message={t("confirmSignOut")}
                onConfirm={async () => {
                  await signOut();
                }}
                onCancel={() => setLogoutConfirmOpen(false)}
                className={
                  isDark
                    ? "mt-2 rounded-[1.1rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-100"
                    : "mt-2 rounded-[1.1rem] border border-red-300 bg-red-100 px-4 py-3 text-red-800"
                }
                cancelClassName={
                  isDark
                    ? "rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-semibold text-slate-100 transition duration-300 hover:bg-white/8"
                    : "rounded-full border border-red-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-red-800 transition duration-300 hover:bg-white"
                }
              />
            ) : (
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(true)}
                className="ts-action-secondary mt-2 flex w-full items-center justify-center rounded-[1.1rem] border border-red-300 bg-red-100 px-4 py-3 text-sm font-semibold text-red-800 transition duration-300 hover:border-red-400 hover:bg-red-200"
              >
                <span className="inline-flex items-center gap-3">
                  <LogOut className="h-4.5 w-4.5" />
                  {t("logOut")}
                </span>
              </button>
            )}
          </div>
        </motion.div>
      ) : null}
      </AnimatePresence>
    </div>
  );
}
