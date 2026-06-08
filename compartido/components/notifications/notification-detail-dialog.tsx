"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, MailOpen, X } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/api";
import type { NotificationCenterItem } from "@/types/notification-center";

export function NotificationDetailDialog({
  open,
  isDark,
  item,
  isRead,
  labels,
  onClose,
  onToggleRead,
}: {
  open: boolean;
  isDark: boolean;
  item: NotificationCenterItem | null;
  isRead: boolean;
  labels: {
    notificationDetail: string;
    close: string;
    markAsUnread: string;
    markAsRead: string;
    openAction: string;
  };
  onClose: () => void;
  onToggleRead: () => void;
}) {
  const router = useRouter();
  const [respondingAction, setRespondingAction] = useState<"accept" | "reject" | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const respondToInvite = async (action: "accept" | "reject") => {
    if (!item?.inviteId || respondingAction) {
      return;
    }

    setRespondingAction(action);
    setResponseMessage("");
    const response = await apiRequest<{ ok: boolean; conversationId?: string; message?: string }>(
      `/api/chat/invitations/${encodeURIComponent(item.inviteId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ action }),
      },
    );
    setRespondingAction(null);

    if (!response.ok) {
      setResponseMessage(response.data?.message ?? "No se pudo responder la invitación.");
      return;
    }

    onClose();
    if (action === "accept") {
      router.push(response.data?.conversationId ? `/chat?conversation=${encodeURIComponent(response.data.conversationId)}` : "/chat");
    }
  };

  return (
    <AnimatePresence initial={false}>
      {open && item ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[190] flex items-center justify-center bg-slate-950/60 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className={
              isDark
                ? "w-full max-w-xl rounded-[1.6rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(7,16,31,0.98),rgba(8,17,32,0.96))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)]"
                : "w-full max-w-xl rounded-[1.6rem] border border-slate-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(248,250,252,0.98))] p-5 shadow-[0_24px_70px_rgba(148,163,184,0.20)]"
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p
                  className={
                    isDark
                      ? "text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200"
                      : "text-xs font-semibold uppercase tracking-[0.22em] text-sky-700"
                  }
                >
                  {labels.notificationDetail}
                </p>
                <h3
                  className={
                    isDark
                      ? "mt-2 text-lg font-semibold text-white"
                      : "mt-2 text-lg font-semibold text-slate-900"
                  }
                >
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-slate-500">{item.meta}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleRead}
                  aria-label={isRead ? labels.markAsUnread : labels.markAsRead}
                  title={isRead ? labels.markAsUnread : labels.markAsRead}
                  className={
                    isDark
                      ? "group relative ts-icon-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4 text-slate-200 transition hover:border-cyan-200/24 hover:bg-white/8"
                      : "group relative ts-icon-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-sky-300 hover:bg-slate-50"
                  }
                >
                  {isRead ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                  <span className={isDark ? "pointer-events-none absolute right-0 top-[calc(100%+0.45rem)] z-10 hidden whitespace-nowrap rounded-full border border-white/10 bg-[#081120] px-3 py-1.5 text-xs font-semibold text-slate-100 shadow-xl group-hover:block" : "pointer-events-none absolute right-0 top-[calc(100%+0.45rem)] z-10 hidden whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xl group-hover:block"}>
                    {isRead ? labels.markAsUnread : labels.markAsRead}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
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

            <div
              className={
                isDark
                  ? "mt-5 rounded-[1.3rem] border border-white/8 bg-white/4 p-4 text-sm leading-6 text-slate-200"
                  : "mt-5 rounded-[1.3rem] border border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
              }
            >
              {item.text}
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              {item.type === "companyOffer" && item.inviteId ? (
                <>
                  <button
                    type="button"
                    disabled={Boolean(respondingAction)}
                    onClick={() => void respondToInvite("accept")}
                    className={
                      isDark
                        ? "ts-action-primary rounded-full border border-emerald-300/26 bg-emerald-300/14 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/20 disabled:cursor-wait disabled:opacity-70"
                        : "ts-action-primary rounded-full border border-emerald-300/50 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-70"
                    }
                  >
                    {respondingAction === "accept" ? "Aceptando..." : "Aceptar"}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(respondingAction)}
                    onClick={() => void respondToInvite("reject")}
                    className={
                      isDark
                        ? "ts-chip-interactive rounded-full border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-cyan-200/24 hover:bg-white/8 disabled:cursor-wait disabled:opacity-70"
                        : "ts-chip-interactive rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-sky-300 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70"
                    }
                  >
                    {respondingAction === "reject" ? "Rechazando..." : "Rechazar"}
                  </button>
                </>
              ) : null}
              {item.linkHref ? (
                <Link
                  href={item.linkHref}
                  onClick={onClose}
                  className={
                    isDark
                      ? "ts-action-primary rounded-full border border-emerald-300/26 bg-emerald-300/14 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/20"
                      : "ts-action-primary rounded-full border border-emerald-300/50 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                  }
                >
                  {item.actionLabel ?? labels.openAction}
                </Link>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className={
                  isDark
                    ? "ts-action-secondary rounded-full border border-cyan-300/20 bg-cyan-300/12 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/18"
                    : "ts-action-secondary rounded-full border border-sky-300/50 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
                }
              >
                {labels.close}
              </button>
            </div>
            {responseMessage ? (
              <p className={isDark ? "mt-3 text-right text-xs font-medium text-rose-200" : "mt-3 text-right text-xs font-medium text-rose-700"}>
                {responseMessage}
              </p>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
