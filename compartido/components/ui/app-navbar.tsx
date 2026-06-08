"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, BellDot, UserRound, X } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { UserMenu } from "@/components/auth/user-menu";
import {
  AppNavbarNav,
  adminNavItems,
  candidateNavItems,
  companyNavItems,
  renderAppNavbarLabel,
  type NavbarRole,
} from "@/components/ui/app-navbar-nav";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useUiCopy } from "@/lib/i18n/ui-copy";
import { getDefaultRouteForRole } from "@/lib/auth";

type AppNavbarProps = {
  isDark: boolean;
  sticky?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  searchPlaceholder?: string;
  onToggleTheme: () => void;
  onOpenLogin?: () => void;
  notificationCount?: number;
  onToggleNotifications?: () => void;
  notificationsButtonRef?: RefObject<HTMLButtonElement | null>;
  roleOverride?: NavbarRole;
};

function getDefaultSearchTarget(role: NavbarRole) {
  return role === "admin" ? "/admin/usuarios" : "/vacantes";
}

function isSearchEventControlled(
  searchValue: string | undefined,
  onSearchChange: ((value: string) => void) | undefined,
) {
  return typeof searchValue === "string" && Boolean(onSearchChange);
}

export function AppNavbar({
  isDark,
  sticky = true,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder,
  onToggleTheme,
  onOpenLogin,
  notificationCount = 0,
  onToggleNotifications,
  notificationsButtonRef,
  roleOverride,
}: AppNavbarProps) {
  const { isEnglish } = useAppLanguage();
  const t = useUiCopy("navbar");
  const { authUser, isAuthenticated } = useAuthUser();
  const pathname = usePathname();
  const router = useRouter();
  const role = roleOverride ?? authUser?.role ?? "candidate";
  const navItems = role === "company" ? companyNavItems : role === "admin" ? adminNavItems : candidateNavItems;
  const placeholder =
    searchPlaceholder ??
    (role === "company" || role === "admin" ? t("searchCandidatesPlaceholder") : t("searchJobsPlaceholder"));
  const showSearchTrigger = pathname === "/vacantes";
  const [searchState, setSearchState] = useState({ open: false, path: "" });
  const [internalSearchValue, setInternalSearchValue] = useState("");
  const [navVisible, setNavVisible] = useState(true);
  const searchRootRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const lastScrollYRef = useRef(0);
  const upwardScrollStepsRef = useRef(0);
  const currentSearchValue = typeof searchValue === "string" ? searchValue : internalSearchValue;
  const searchIsControlled = isSearchEventControlled(searchValue, onSearchChange);

  const searchPanelOpen = showSearchTrigger && searchState.open && searchState.path === pathname;

  useEffect(() => {
    if (!searchPanelOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [searchPanelOpen]);

  useEffect(() => {
    if (!sticky) {
      return;
    }

    lastScrollYRef.current = window.scrollY;
    upwardScrollStepsRef.current = 0;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;

      if (currentScrollY <= 24) {
        setNavVisible(true);
        upwardScrollStepsRef.current = 0;
        lastScrollYRef.current = currentScrollY;
        return;
      }

      if (delta > 10) {
        setNavVisible(false);
        upwardScrollStepsRef.current = 0;
      } else if (delta < -10) {
        upwardScrollStepsRef.current += 1;
        if (upwardScrollStepsRef.current >= 2) {
          setNavVisible(true);
        }
      }

      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sticky]);

  useEffect(() => {
    if (!searchPanelOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (searchRootRef.current?.contains(target ?? null)) {
        return;
      }

      setSearchState({ open: false, path: pathname });
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchState({ open: false, path: pathname });
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [pathname, searchPanelOpen]);

  const resolvedNavItems = useMemo(
    () =>
      navItems.map((item) => ({
        ...item,
        label: renderAppNavbarLabel(item.href, role, t),
        active: item.match(pathname),
      })),
    [navItems, pathname, role, t],
  );

  if (!isAuthenticated) {
    return null;
  }

  const setSearchText = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
      return;
    }

    setInternalSearchValue(value);
  };

  const submitSearch = () => {
    const nextValue = currentSearchValue.trim();

    if (onSearchSubmit) {
      onSearchSubmit(nextValue);
      return;
    }

    if (searchIsControlled) {
      return;
    }

    const targetPath = getDefaultSearchTarget(role);
    const nextQuery = nextValue ? `?q=${encodeURIComponent(nextValue)}` : "";
    router.push(`${targetPath}${nextQuery}`);
    setSearchState({ open: false, path: pathname });
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitSearch();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setSearchState({ open: false, path: pathname });
    }
  };

  return (
    <header
      className={`${sticky ? "sticky top-4 z-30" : "relative z-30"} transition-transform duration-300 ${
        sticky && !navVisible ? "-translate-y-[calc(100%+1rem)]" : "translate-y-0"
      }`}
    >
      <div
        ref={searchRootRef}
        className={
          isDark
            ? "rounded-[1.6rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(6,14,28,0.90),rgba(8,17,32,0.82))] px-4 py-3 shadow-[0_20px_60px_rgba(1,8,20,0.34)] backdrop-blur-xl sm:px-5"
            : "rounded-[1.45rem] border border-slate-300/80 bg-white/86 px-4 py-3 shadow-[0_18px_54px_rgba(148,163,184,0.14)] backdrop-blur-xl sm:px-5"
        }
      >
        <div className="flex items-center justify-between gap-4">
          <Link href={getDefaultRouteForRole(role)} className="flex min-w-0 items-center gap-3">
            <div
              className={
                isDark
                  ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-white/6 ring-1 ring-white/8"
                  : "flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-slate-100 ring-1 ring-slate-200"
              }
            >
              <Image
                src="/data/TS-logo.png"
                alt="TalentSyncro"
                width={34}
                height={34}
                priority
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className={isDark ? "truncate text-base font-semibold text-white" : "truncate text-base font-semibold text-slate-950"}>
                TalentSyncro
              </p>
            </div>
          </Link>

          <AppNavbarNav isDark={isDark} items={resolvedNavItems} />

          <div className="flex shrink-0 items-center gap-2">
            {showSearchTrigger ? (
              <motion.button
                type="button"
                aria-label={t("openSearch")}
                aria-expanded={searchPanelOpen}
                onClick={() =>
                  setSearchState((current) => ({
                    open: !(current.open && current.path === pathname),
                    path: pathname,
                  }))
                }
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                className={
                  isDark
                    ? "ts-icon-button inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] text-slate-200 transition hover:bg-white/8 hover:text-white"
                    : "ts-icon-button inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                }
              >
                <Search className="h-4.5 w-4.5" />
              </motion.button>
            ) : null}

            {isAuthenticated ? (
              <motion.button
                ref={notificationsButtonRef}
                type="button"
                aria-label={t("notifications")}
                onClick={onToggleNotifications}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                className={
                  isDark
                    ? "ts-icon-button relative inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] text-slate-200 transition hover:bg-white/8 hover:text-white"
                    : "ts-icon-button relative inline-flex h-10 w-10 items-center justify-center rounded-[0.95rem] text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                }
              >
                <BellDot className="h-4.5 w-4.5" />
                {notificationCount > 0 ? (
                  <span className="absolute right-1 top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                ) : null}
              </motion.button>
            ) : null}

            {isAuthenticated ? (
              <UserMenu
                isDark={isDark}
                onToggleTheme={onToggleTheme}
                notificationCount={notificationCount}
                onToggleNotifications={onToggleNotifications}
              />
            ) : (
              <motion.button
                type="button"
                onClick={onOpenLogin}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                className={
                  isDark
                    ? "ts-action-secondary inline-flex items-center gap-2 rounded-[0.95rem] bg-white/6 px-3.5 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
                    : "ts-action-secondary inline-flex items-center gap-2 rounded-[0.95rem] bg-slate-100 px-3.5 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-200"
                }
              >
                <UserRound className="h-4 w-4" />
                <span>{t("logIn")}</span>
              </motion.button>
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {searchPanelOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, y: -8, height: 0, marginTop: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden"
            >
            <motion.div
              initial={{ scale: 0.985 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={
                isDark
                  ? "flex items-center gap-3 rounded-[1.1rem] border border-white/8 bg-white/6 px-4 py-3"
                  : "flex items-center gap-3 rounded-[1.1rem] border border-slate-300 bg-slate-50 px-4 py-3"
              }
            >
              <Search className={isDark ? "h-4.5 w-4.5 text-cyan-200" : "h-4.5 w-4.5 text-sky-700"} />
              <input
                ref={searchInputRef}
                value={currentSearchValue}
                onChange={(event) => setSearchText(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={placeholder}
                className={
                  isDark
                    ? "w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                    : "w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-500"
                }
              />
              <motion.button
                type="button"
                aria-label={isEnglish ? "Clear search" : "Limpiar búsqueda"}
                onClick={() => {
                  if (currentSearchValue) {
                    setSearchText("");
                    if (onSearchSubmit) {
                      onSearchSubmit("");
                    }
                    return;
                  }

                  setSearchState({ open: false, path: pathname });
                }}
                whileHover={{ rotate: 90, scale: 1.02 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className={
                  isDark
                    ? "ts-icon-button inline-flex h-9 w-9 items-center justify-center rounded-[0.85rem] text-slate-300 transition hover:bg-white/8 hover:text-white"
                    : "ts-icon-button inline-flex h-9 w-9 items-center justify-center rounded-[0.85rem] text-slate-500 transition hover:bg-white hover:text-slate-950"
                }
              >
                <X className="h-4 w-4" />
              </motion.button>
            </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}
