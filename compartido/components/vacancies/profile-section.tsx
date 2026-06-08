"use client";

import type { RefObject } from "react";
import { useEffect, useState } from "react";
import { BellDot, UserRound } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { useAuthUser } from "@/hooks/use-auth-user";

export function ProfileSection({
  isEnglish,
  isDark,
  onToggleTheme,
  notificationCount,
  onToggleNotifications,
  onOpenLogin,
  notificationsButtonRef,
  visibleOn = "all",
}: {
  isEnglish: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
  notificationCount: number;
  onToggleNotifications: () => void;
  onOpenLogin: () => void;
  notificationsButtonRef?: RefObject<HTMLButtonElement | null>;
  visibleOn?: "mobile" | "desktop" | "all";
}) {
  const { isAuthenticated } = useAuthUser();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);

    return () => {
      mediaQuery.removeEventListener("change", sync);
    };
  }, []);

  if ((visibleOn === "mobile" && isDesktop) || (visibleOn === "desktop" && !isDesktop)) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
      {isAuthenticated ? (
        <UserMenu
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          notificationCount={notificationCount}
          onToggleNotifications={onToggleNotifications}
        />
      ) : (
        <button
          type="button"
          aria-label={isEnglish ? "Log in" : "Iniciar sesión"}
          onClick={onOpenLogin}
          className={
            isDark
              ? "inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-medium text-slate-100 transition duration-300 hover:border-cyan-200/28 hover:bg-white/8 hover:shadow-[0_0_22px_rgba(34,211,238,0.12)]"
              : "inline-flex max-w-full items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition duration-300 hover:border-sky-300 hover:bg-slate-50"
          }
        >
          <UserRound className="h-4.5 w-4.5" />
          <span>{isEnglish ? "Log in" : "Iniciar sesión"}</span>
        </button>
      )}

      {isAuthenticated ? (
        <>
          <button
            ref={notificationsButtonRef}
            type="button"
            aria-label={isEnglish ? "Notifications" : "Notificaciones"}
            onClick={onToggleNotifications}
            className={
              isDark
                ? "relative hidden h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/4 text-cyan-100 transition duration-300 hover:border-cyan-200/28 hover:bg-white/8 hover:shadow-[0_0_22px_rgba(34,211,238,0.12)] lg:inline-flex"
                : "relative hidden h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-sky-700 transition duration-300 hover:border-sky-300 hover:bg-slate-50 lg:inline-flex"
            }
          >
            <BellDot className="h-4.5 w-4.5" />
            {notificationCount > 0 ? (
              <span className="absolute right-0 top-0 inline-flex min-w-5 translate-x-1/4 -translate-y-1/4 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {notificationCount}
              </span>
            ) : null}
          </button>
        </>
      ) : null}
    </div>
  );
}
