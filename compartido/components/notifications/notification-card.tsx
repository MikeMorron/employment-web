"use client";

import { Check, Mail, MailOpen } from "lucide-react";
import type { NotificationCenterItem } from "@/types/notification-center";

export function NotificationCard({
  isDark,
  item,
  isRead,
  titleToneClassName,
  markAsUnreadLabel,
  markAsReadLabel,
  selectionToggleLabel,
  onOpen,
  onToggleRead,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: {
  isDark: boolean;
  item: NotificationCenterItem;
  isRead: boolean;
  titleToneClassName: string;
  markAsUnreadLabel: string;
  markAsReadLabel: string;
  selectionToggleLabel: string;
  onOpen: () => void;
  onToggleRead: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  return (
    <article
      className={
        isDark
          ? `group rounded-[1.2rem] border px-3.5 py-3 ${
              isRead
                ? "border-white/6 bg-white/[0.03] opacity-80"
                : "border-white/8 bg-white/4"
            }`
          : `group rounded-[1.2rem] border px-3.5 py-3 ${
              isRead
                ? "border-slate-200 bg-slate-50/80 opacity-80"
                : "border-slate-300 bg-white/90"
            }`
      }
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={selectionMode ? onToggleSelect : onOpen}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <p className={titleToneClassName}>{item.title}</p>
            <span className="shrink-0 text-[11px] text-slate-500">{item.meta}</span>
          </div>
          <p
            className={
              isDark
                ? "mt-1.5 text-sm leading-5.5 text-slate-300"
                : "mt-1.5 text-sm leading-5.5 text-slate-700"
            }
          >
            {item.text}
          </p>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {selectionMode ? (
            <button
              type="button"
              aria-label={selectionToggleLabel}
              onClick={(event) => {
                event.stopPropagation();
                onToggleSelect?.();
              }}
              className={
                selected
                  ? isDark
                    ? "ts-icon-button inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-300/28 bg-rose-300/14 text-rose-100 transition"
                    : "ts-icon-button inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-300 bg-rose-50 text-rose-700 transition"
                  : isDark
                    ? "ts-icon-button inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/4 text-slate-200 transition hover:border-rose-300/24 hover:bg-white/8"
                    : "ts-icon-button inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-rose-300 hover:bg-slate-50"
              }
            >
              {selected ? <Check className="h-4 w-4" /> : <span className="h-3.5 w-3.5 rounded-full border border-current" />}
            </button>
          ) : null}
          {!selectionMode ? (
            <button
              type="button"
              aria-label={isRead ? markAsUnreadLabel : markAsReadLabel}
              title={isRead ? markAsUnreadLabel : markAsReadLabel}
              onClick={(event) => {
                event.stopPropagation();
                onToggleRead();
              }}
              className={
                isDark
                  ? "group relative ts-icon-button inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/4 text-slate-200 transition hover:border-cyan-200/24 hover:bg-white/8"
                  : "group relative ts-icon-button inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-sky-300 hover:bg-slate-50"
              }
            >
              {isRead ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              <span className={isDark ? "pointer-events-none absolute right-0 top-[calc(100%+0.45rem)] z-10 hidden whitespace-nowrap rounded-full border border-white/10 bg-[#081120] px-3 py-1.5 text-xs font-semibold text-slate-100 shadow-xl group-hover:block" : "pointer-events-none absolute right-0 top-[calc(100%+0.45rem)] z-10 hidden whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xl group-hover:block"}>
                {isRead ? markAsUnreadLabel : markAsReadLabel}
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
