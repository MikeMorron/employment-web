"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { AppNavbar } from "@/components/ui/app-navbar";
import { NotificationCenterModal } from "@/components/notifications/notification-center-modal";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useNotifications } from "@/hooks/use-notifications";

export function MiniPageNav({
  isDark,
  onToggleTheme,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder,
}: {
  isDark: boolean;
  onToggleTheme: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
  searchPlaceholder?: string;
}) {
  const { authUser } = useAuthUser();
  const pathname = usePathname();
  const notificationsButtonRef = useRef<HTMLButtonElement | null>(null);
  const [notificationsState, setNotificationsState] = useState({
    open: false,
    path: "",
  });
  const notificationsOpen =
    notificationsState.open && notificationsState.path === pathname;

  const {
    notificationPreferences,
    groupedNotifications,
    effectiveReadNotificationIds,
    unreadNotificationCount,
    markAllNotificationsAsRead,
    toggleNotificationReadState,
    toggleNotificationPreference,
    removeNotifications,
  } = useNotifications();
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <>
      <AppNavbar
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onToggleNotifications={() => {
          setNotificationsState((current) => ({
            open: !(current.open && current.path === pathname),
            path: pathname,
          }));
        }}
        notificationsButtonRef={notificationsButtonRef}
        notificationCount={isHydrated ? unreadNotificationCount : 0}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        onSearchSubmit={onSearchSubmit}
        searchPlaceholder={searchPlaceholder}
      />

      <NotificationCenterModal
        key={pathname}
        open={notificationsOpen}
        isDark={isDark}
        notificationPreferences={notificationPreferences}
        groupedNotifications={groupedNotifications}
        effectiveReadNotificationIds={effectiveReadNotificationIds}
        unreadNotificationCount={isHydrated ? unreadNotificationCount : 0}
        showApplicationSection={authUser?.role === "candidate"}
        onClose={() => setNotificationsState({ open: false, path: pathname })}
        onMarkAllNotificationsAsRead={markAllNotificationsAsRead}
        onToggleNotificationReadState={toggleNotificationReadState}
        onToggleNotificationPreference={toggleNotificationPreference}
        onRemoveNotifications={removeNotifications}
      />
    </>
  );
}
