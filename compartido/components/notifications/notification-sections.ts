import { Bell, BellRing, SearchCheck } from "lucide-react";
import type {
  NotificationCenterGroups,
  NotificationCenterPreferences,
} from "@/types/notification-center";

export type NotificationSection = {
  key: keyof NotificationCenterGroups;
  title: string;
  toneClassName: string;
  icon: typeof Bell;
  toggleKey?: keyof NotificationCenterPreferences;
  disabledText?: string;
};

export function buildNotificationSections({
  isDark,
  labels,
  notificationPreferences,
}: {
  isDark: boolean;
  labels: {
    platform: string;
    applications: string;
    trending: string;
    platformDisabled: string;
    applicationDisabled: string;
  };
  notificationPreferences: NotificationCenterPreferences;
}): NotificationSection[] {
  return [
    {
      key: "anuncio",
      title: labels.platform,
      toneClassName: isDark
        ? "text-xs font-semibold uppercase tracking-[0.18em] text-rose-200"
        : "text-xs font-semibold uppercase tracking-[0.18em] text-rose-700",
      icon: notificationPreferences.anuncio ? BellRing : Bell,
      toggleKey: "anuncio",
      disabledText: labels.platformDisabled,
    },
    {
      key: "application",
      title: labels.applications,
      toneClassName: isDark
        ? "text-xs font-semibold uppercase tracking-[0.18em] text-sky-200"
        : "text-xs font-semibold uppercase tracking-[0.18em] text-sky-700",
      icon: notificationPreferences.application ? BellRing : Bell,
      toggleKey: "application",
      disabledText: labels.applicationDisabled,
    },
    {
      key: "companyOffer",
      title: "Ofertas de empresas",
      toneClassName: isDark
        ? "text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200"
        : "text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700",
      icon: BellRing,
      toggleKey: "application",
      disabledText: labels.applicationDisabled,
    },
    {
      key: "trending",
      title: labels.trending,
      toneClassName: isDark
        ? "text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-200"
        : "text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-700",
      icon: SearchCheck,
    },
  ];
}
