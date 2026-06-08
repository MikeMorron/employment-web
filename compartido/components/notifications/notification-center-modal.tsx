"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellRing, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NotificationCard } from "@/components/notifications/notification-card";
import { NotificationDetailDialog } from "@/components/notifications/notification-detail-dialog";
import {
  buildNotificationSections,
  type NotificationSection,
} from "@/components/notifications/notification-sections";
import { useUiCopy } from "@/lib/i18n/ui-copy";
import type {
  NotificationCenterGroups,
  NotificationCenterItem,
  NotificationCenterPreferences,
} from "@/types/notification-center";

type NotificationCenterModalProps = {
  open: boolean;
  isDark: boolean;
  notificationPreferences: NotificationCenterPreferences;
  groupedNotifications: NotificationCenterGroups;
  effectiveReadNotificationIds: string[];
  unreadNotificationCount: number;
  showApplicationSection?: boolean;
  onClose: () => void;
  onMarkAllNotificationsAsRead: () => void;
  onToggleNotificationReadState: (id: string) => void;
  onToggleNotificationPreference: (
    type: keyof NotificationCenterPreferences,
  ) => void;
  onRemoveNotifications?: (ids: string[]) => void;
};

type NotificationTabId = "platform" | "application" | "companyOffer";

export function NotificationCenterModal({
  open,
  isDark,
  notificationPreferences,
  groupedNotifications,
  effectiveReadNotificationIds,
  unreadNotificationCount,
  onClose,
  onMarkAllNotificationsAsRead,
  onToggleNotificationReadState,
  onToggleNotificationPreference,
  onRemoveNotifications,
}: NotificationCenterModalProps) {
  const t = useUiCopy("notificationCenterModal");
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationCenterItem | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDeleteIds, setSelectedForDeleteIds] = useState<string[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationTabId>("platform");
  const readIds = useMemo(
    () => new Set(effectiveReadNotificationIds),
    [effectiveReadNotificationIds],
  );
  const selectedForDeleteSet = useMemo(
    () => new Set(selectedForDeleteIds),
    [selectedForDeleteIds],
  );
  const closeModal = useCallback(() => {
    setSelectedNotification(null);
    setDeleteMode(false);
    setSelectedForDeleteIds([]);
    setConfirmDeleteOpen(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selectedNotification) {
          setSelectedNotification(null);
          return;
        }

        closeModal();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [closeModal, open, selectedNotification]);

  const sectionConfigs = useMemo<NotificationSection[]>(
    () =>
      buildNotificationSections({
        isDark,
        notificationPreferences,
        labels: {
          platform: t("platform"),
          applications: t("applications"),
          trending: t("trending"),
          platformDisabled: t("platformDisabled"),
          applicationDisabled: t("applicationDisabled"),
        },
      }),
    [isDark, notificationPreferences, t],
  );

  const sectionByKey = useMemo(
    () => new Map(sectionConfigs.map((section) => [section.key, section])),
    [sectionConfigs],
  );
  const tabConfigs = useMemo(
    () => {
      const platformSections = [
        sectionByKey.get("anuncio"),
        sectionByKey.get("trending"),
      ].filter((section): section is NotificationSection => Boolean(section));
      const applicationSection = sectionByKey.get("application");
      const companyOfferSection = sectionByKey.get("companyOffer");

      return [
        {
          id: "platform" as const,
          title: t("platform"),
          sections: platformSections,
          toggleKey: "anuncio" as keyof NotificationCenterPreferences,
          items: [
            ...groupedNotifications.anuncio,
            ...groupedNotifications.trending,
          ],
        },
        {
          id: "application" as const,
          title: t("applications"),
          sections: applicationSection ? [applicationSection] : [],
          toggleKey: "application" as keyof NotificationCenterPreferences,
          items: groupedNotifications.application,
        },
        {
          id: "companyOffer" as const,
          title: "Ofertas de empresas",
          sections: companyOfferSection ? [companyOfferSection] : [],
          toggleKey: "application" as keyof NotificationCenterPreferences,
          items: groupedNotifications.companyOffer,
        },
      ];
    },
    [groupedNotifications, sectionByKey, t],
  );
  const activeTabConfig = tabConfigs.find((tab) => tab.id === activeTab) ?? tabConfigs[0]!;
  const activePreferenceEnabled = notificationPreferences[activeTabConfig.toggleKey];
  const activeTabItems = activePreferenceEnabled ? activeTabConfig.items : [];
  const activeTabPrimarySection = activeTabConfig.sections[0];
  const ActiveTabIcon = activeTabPrimarySection?.icon ?? Bell;
  const activeTabIconTone = activeTabPrimarySection?.toneClassName.split(" ").at(-1) ?? "text-slate-400";

  const openNotificationDetail = (item: NotificationCenterItem) => {
    if (deleteMode) {
      return;
    }

    if (!readIds.has(item.id)) {
      onToggleNotificationReadState(item.id);
    }

    setSelectedNotification(item);
  };

  const selectedNotificationRead =
    selectedNotification ? readIds.has(selectedNotification.id) : false;

  const toggleDeleteMode = () => {
    setDeleteMode((current) => {
      const next = !current;
      if (!next) {
        setSelectedForDeleteIds([]);
        setConfirmDeleteOpen(false);
      }
      setSelectedNotification(null);
      return next;
    });
  };

  const toggleNotificationSelection = (id: string) => {
    setSelectedForDeleteIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  };

  const confirmBulkDelete = () => {
    if (selectedForDeleteIds.length === 0 || !onRemoveNotifications) {
      return;
    }

    onRemoveNotifications(selectedForDeleteIds);
    setSelectedForDeleteIds([]);
    setConfirmDeleteOpen(false);
    setDeleteMode(false);
  };

  return (
    <>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/50 px-4 py-8"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.985 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              className={
                isDark
                  ? "w-full max-w-2xl rounded-[1.6rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(7,16,31,0.98),rgba(8,17,32,0.94))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:p-5"
                  : "w-full max-w-2xl rounded-[1.6rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-4 shadow-[0_24px_70px_rgba(148,163,184,0.20)] backdrop-blur-xl sm:p-5"
              }
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p
                    className={
                      isDark
                        ? "text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200"
                        : "text-xs font-semibold uppercase tracking-[0.24em] text-sky-700"
                    }
                  >
                    {t("notifications")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {unreadNotificationCount > 0
                      ? t("unreadCount", { count: unreadNotificationCount })
                      : t("everythingUpToDate")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {deleteMode ? (
                    <button
                      type="button"
                      onClick={toggleDeleteMode}
                      className={
                        isDark
                          ? "ts-chip-interactive rounded-full border border-white/10 bg-white/4 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-cyan-200/24 hover:bg-white/8"
                          : "ts-chip-interactive rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:border-sky-300 hover:bg-slate-50"
                      }
                    >
                      {t("cancelDeleteMode")}
                    </button>
                  ) : unreadNotificationCount > 0 ? (
                    <button
                      type="button"
                      onClick={onMarkAllNotificationsAsRead}
                      className={
                        isDark
                          ? "ts-chip-interactive rounded-full border border-white/10 bg-white/4 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-cyan-200/24 hover:bg-white/8"
                          : "ts-chip-interactive rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:border-sky-300 hover:bg-slate-50"
                      }
                    >
                      {t("markAllRead")}
                    </button>
                  ) : null}
                  {onRemoveNotifications ? (
                    <button
                      type="button"
                      onClick={toggleDeleteMode}
                      aria-label={t("enterDeleteMode")}
                      className={
                        deleteMode
                          ? isDark
                            ? "ts-icon-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-300/24 bg-rose-300/14 text-rose-100 transition"
                            : "ts-icon-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-300 bg-rose-50 text-rose-700 transition"
                          : isDark
                            ? "ts-icon-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4 text-slate-200 transition hover:border-rose-300/24 hover:bg-white/8"
                            : "ts-icon-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-rose-300 hover:bg-slate-50"
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={closeModal}
                    className={
                      isDark
                        ? "ts-icon-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4 text-slate-200 transition hover:border-cyan-200/24 hover:bg-white/8"
                        : "ts-icon-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-sky-300 hover:bg-slate-50"
                    }
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {deleteMode ? (
                <div
                  className={
                    isDark
                      ? "mt-4 rounded-[1.2rem] border border-rose-300/16 bg-rose-300/10 px-4 py-3"
                      : "mt-4 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3"
                  }
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className={isDark ? "text-sm font-semibold text-rose-100" : "text-sm font-semibold text-rose-900"}>
                        {t("deleteModeTitle")}
                      </p>
                      <p className={isDark ? "mt-1 text-xs text-rose-100/80" : "mt-1 text-xs text-rose-700"}>
                        {confirmDeleteOpen
                          ? t("deleteConfirmText")
                          : t("deleteModeHelper", { count: selectedForDeleteIds.length })}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {confirmDeleteOpen ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteOpen(false)}
                            className={
                              isDark
                                ? "rounded-full border border-white/10 bg-white/4 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/8"
                                : "rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
                            }
                          >
                            {t("cancel")}
                          </button>
                          <button
                            type="button"
                            onClick={confirmBulkDelete}
                            className="rounded-full bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                          >
                            {t("confirmDelete")}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={selectedForDeleteIds.length === 0}
                          onClick={() => setConfirmDeleteOpen(true)}
                          className="rounded-full bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                        >
                          {t("deleteSelected")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-5">
                <div className={isDark ? "flex gap-1 rounded-t-[1.1rem] border-b border-white/10" : "flex gap-1 rounded-t-[1.1rem] border-b border-slate-300"}>
                  {tabConfigs.map((tab) => {
                    const selected = tab.id === activeTab;
                    const Icon = tab.sections[0]?.icon ?? Bell;
                    const enabled = notificationPreferences[tab.toggleKey];

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={
                          selected
                            ? isDark
                              ? "relative -mb-px inline-flex min-w-0 items-center gap-2 rounded-t-[0.9rem] border border-white/10 border-b-[#081120] bg-[#081120] px-3 py-2 text-xs font-semibold text-white"
                              : "relative -mb-px inline-flex min-w-0 items-center gap-2 rounded-t-[0.9rem] border border-slate-300 border-b-white bg-white px-3 py-2 text-xs font-semibold text-slate-950"
                            : isDark
                              ? "inline-flex min-w-0 items-center gap-2 rounded-t-[0.9rem] border border-transparent px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/6"
                              : "inline-flex min-w-0 items-center gap-2 rounded-t-[0.9rem] border border-transparent px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        }
                      >
                        <Icon className={`h-3.5 w-3.5 ${enabled ? (tab.sections[0]?.toneClassName.split(" ").at(-1) ?? "text-slate-400") : "text-slate-400"}`} />
                        <span className="truncate">{tab.title}</span>
                        <span className={selected ? "rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] text-white" : "rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700"}>
                          {tab.items.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className={isDark ? "flex items-center justify-between gap-3 border-x border-white/10 bg-white/[0.02] px-3 py-3" : "flex items-center justify-between gap-3 border-x border-slate-300 bg-white px-3 py-3"}>
                  <div className="flex min-w-0 items-center gap-2">
                    <ActiveTabIcon className={`h-4 w-4 ${activeTabIconTone}`} />
                    <p className={activeTabPrimarySection?.toneClassName ?? (isDark ? "text-xs font-semibold uppercase tracking-[0.18em] text-white" : "text-xs font-semibold uppercase tracking-[0.18em] text-slate-700")}>
                      {activeTabConfig.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleNotificationPreference(activeTabConfig.toggleKey)}
                    className={
                      activePreferenceEnabled
                        ? isDark
                          ? "ts-chip-interactive inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-2 text-xs font-semibold text-slate-100"
                          : "ts-chip-interactive inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                        : isDark
                          ? "ts-chip-interactive inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-2 text-xs font-semibold text-slate-300"
                          : "ts-chip-interactive inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                    }
                  >
                    {activePreferenceEnabled ? (
                      <BellRing className={`h-3.5 w-3.5 ${activeTabIconTone}`} />
                    ) : (
                      <Bell className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    {activePreferenceEnabled ? "Activas" : "Inactivas"}
                  </button>
                </div>

                <div className={isDark ? "touch-scroll-y max-h-[58vh] space-y-3 overflow-y-auto rounded-b-[1.1rem] border border-white/10 bg-white/[0.02] p-3" : "touch-scroll-y max-h-[58vh] space-y-3 overflow-y-auto rounded-b-[1.1rem] border border-slate-300 bg-white p-3"}>
                {activeTabItems.length === 0 ? (
                  <article
                    className={
                      isDark
                        ? "rounded-[1.2rem] border border-white/8 bg-white/4 px-4 py-4 text-sm text-slate-300"
                        : "rounded-[1.2rem] border border-slate-300 bg-white px-4 py-4 text-sm text-slate-700"
                    }
                  >
                    {t("noNotifications")}
                  </article>
                ) : null}

                {activeTabItems.map((item) => (
                            <NotificationCard
                              key={item.id}
                              isDark={isDark}
                              item={item}
                              isRead={readIds.has(item.id)}
                              titleToneClassName={activeTabPrimarySection?.toneClassName ?? (isDark ? "text-xs font-semibold uppercase tracking-[0.18em] text-white" : "text-xs font-semibold uppercase tracking-[0.18em] text-slate-700")}
                              markAsUnreadLabel={t("markAsUnread")}
                              markAsReadLabel={t("markAsRead")}
                              selectionToggleLabel={t("selectNotification")}
                              onOpen={() => openNotificationDetail(item)}
                              onToggleRead={() => onToggleNotificationReadState(item.id)}
                              selectionMode={deleteMode}
                              selected={selectedForDeleteSet.has(item.id)}
                              onToggleSelect={() => toggleNotificationSelection(item.id)}
                            />
                          ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <NotificationDetailDialog
        open={Boolean(open && selectedNotification)}
        isDark={isDark}
        item={selectedNotification}
        isRead={selectedNotificationRead}
        labels={{
          notificationDetail: t("notificationDetail"),
          close: t("close"),
          markAsUnread: t("markAsUnread"),
          markAsRead: t("markAsRead"),
          openAction: t("openAction"),
        }}
        onClose={() => setSelectedNotification(null)}
        onToggleRead={() => {
          if (!selectedNotification) {
            return;
          }

          onToggleNotificationReadState(selectedNotification.id);
        }}
      />
    </>
  );
}
