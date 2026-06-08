import type { RefObject } from "react";
import { AppNavbar } from "@/components/ui/app-navbar";

export function TopBar({
  query,
  onQueryChange,
  isDark,
  onToggleTheme,
  onOpenLogin,
  notificationCount,
  onToggleNotifications,
  notificationsButtonRef,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  isEnglish: boolean;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenLogin: () => void;
  notificationCount: number;
  onToggleNotifications: () => void;
  notificationsButtonRef?: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <AppNavbar
      isDark={isDark}
      onToggleTheme={onToggleTheme}
      onOpenLogin={onOpenLogin}
      notificationCount={notificationCount}
      onToggleNotifications={onToggleNotifications}
      notificationsButtonRef={notificationsButtonRef}
      searchValue={query}
      onSearchChange={onQueryChange}
    />
  );
}
