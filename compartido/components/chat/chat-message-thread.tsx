"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatChatTime } from "@/compartido/lib/chat-ui";
import type { ChatMessage } from "@/compartido/types/chat";

const ESTIMATED_MESSAGE_HEIGHT = 92;
const OVERSCAN_COUNT = 6;

export function ChatMessageThread({
  messages,
  currentUserId,
  isDark,
  locale,
  isEnglish,
  hasOlderMessages,
  isLoadingOlderMessages,
  onLoadOlder,
}: {
  messages: ChatMessage[];
  currentUserId: string;
  isDark: boolean;
  locale: string;
  isEnglish: boolean;
  hasOlderMessages: boolean;
  isLoadingOlderMessages: boolean;
  onLoadOlder: () => void;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const previousMessageCountRef = useRef(0);
  const previousScrollHeightRef = useRef<number | null>(null);
  const rowObserversRef = useRef(new Map<number, ResizeObserver>());
  const [viewportHeight, setViewportHeight] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [rowHeights, setRowHeights] = useState<Record<number, number>>({});

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const sync = () => setViewportHeight(viewport.clientHeight);
    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observers = rowObserversRef.current;
    return () => {
      for (const observer of observers.values()) {
        observer.disconnect();
      }
      observers.clear();
    };
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const previousCount = previousMessageCountRef.current;

    if (previousCount === 0) {
      viewport.scrollTop = viewport.scrollHeight;
    } else if (previousScrollHeightRef.current != null && !isLoadingOlderMessages) {
      const delta = viewport.scrollHeight - previousScrollHeightRef.current;
      viewport.scrollTop += delta;
      previousScrollHeightRef.current = null;
    } else if (messages.length > previousCount) {
      const nearBottom =
        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 120;
      if (nearBottom) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }

    previousMessageCountRef.current = messages.length;
  }, [isLoadingOlderMessages, messages]);

  const estimatedTotalHeight = messages.reduce(
    (sum, _, index) => sum + (rowHeights[index] ?? ESTIMATED_MESSAGE_HEIGHT),
    0,
  );
  const totalHeight = Math.max(estimatedTotalHeight, viewportHeight);

  let cumulativeHeight = 0;
  let startIndex = 0;
  for (let index = 0; index < messages.length; index += 1) {
    const rowHeight = rowHeights[index] ?? ESTIMATED_MESSAGE_HEIGHT;
    if (cumulativeHeight + rowHeight >= scrollTop) {
      startIndex = Math.max(0, index - OVERSCAN_COUNT);
      break;
    }
    cumulativeHeight += rowHeight;
    startIndex = index;
  }

  let visibleHeight = 0;
  let endIndex = startIndex;
  while (
    endIndex < messages.length &&
    visibleHeight < (viewportHeight || ESTIMATED_MESSAGE_HEIGHT * 8) + OVERSCAN_COUNT * ESTIMATED_MESSAGE_HEIGHT
  ) {
    visibleHeight += rowHeights[endIndex] ?? ESTIMATED_MESSAGE_HEIGHT;
    endIndex += 1;
  }
  endIndex = Math.min(messages.length, endIndex + OVERSCAN_COUNT);
  const visibleMessages = useMemo(
    () => messages.slice(startIndex, endIndex),
    [endIndex, messages, startIndex],
  );
  const topSpacerHeight = messages
    .slice(0, startIndex)
    .reduce((sum, _, index) => sum + (rowHeights[index] ?? ESTIMATED_MESSAGE_HEIGHT), 0);
  const visibleMessagesHeight = visibleMessages.reduce(
    (sum, _, offset) => sum + (rowHeights[startIndex + offset] ?? ESTIMATED_MESSAGE_HEIGHT),
    0,
  );
  const bottomSpacerHeight = Math.max(0, totalHeight - topSpacerHeight - visibleMessagesHeight);

  return (
    <div
      ref={viewportRef}
      onScroll={() => {
        const viewport = viewportRef.current;
        if (!viewport) {
          return;
        }

        setScrollTop(viewport.scrollTop);

        if (
          hasOlderMessages &&
          !isLoadingOlderMessages &&
          viewport.scrollTop <= 48
        ) {
          previousScrollHeightRef.current = viewport.scrollHeight;
          onLoadOlder();
        }
      }}
      className="mt-4 max-h-[58dvh] overflow-y-auto pr-1"
    >
      {isLoadingOlderMessages ? (
        <div className={isDark ? "sticky top-0 z-10 rounded-full border border-cyan-300/18 bg-[#081120]/90 px-3 py-2 text-center text-xs text-cyan-100 backdrop-blur" : "sticky top-0 z-10 rounded-full border border-sky-300 bg-white/95 px-3 py-2 text-center text-xs text-sky-700 backdrop-blur"}>
          {isEnglish ? "Loading older messages..." : "Cargando mensajes anteriores..."}
        </div>
      ) : null}

      <div style={{ height: topSpacerHeight }} />

      <div className="space-y-3">
        {visibleMessages.map((message, offset) => {
          const mine = message.senderId === currentUserId;
          const messageIndex = startIndex + offset;

          return (
            <div
              key={message.id}
              ref={(node) => {
                const existing = rowObserversRef.current.get(messageIndex);
                if (existing) {
                  existing.disconnect();
                  rowObserversRef.current.delete(messageIndex);
                }

                if (!node) {
                  return;
                }

                const observer = new ResizeObserver(([entry]) => {
                  const nextHeight = Math.ceil(entry.contentRect.height);
                  setRowHeights((current) =>
                    current[messageIndex] === nextHeight
                      ? current
                      : { ...current, [messageIndex]: nextHeight },
                  );
                });
                observer.observe(node);
                rowObserversRef.current.set(messageIndex, observer);
              }}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <article className={`max-w-2xl rounded-[1.25rem] px-4 py-3 ${mine ? "bg-slate-900 text-white" : isDark ? "border border-white/8 bg-white/4 text-slate-200" : "border border-slate-200 bg-slate-50 text-slate-700"}`}>
                <p className="text-sm leading-6">{message.body}</p>
                <p className={`mt-2 text-[11px] ${mine ? "text-slate-300" : "text-slate-500"}`}>
                  {formatChatTime(message.sentAt, locale)}
                </p>
              </article>
            </div>
          );
        })}
      </div>

      <div style={{ height: bottomSpacerHeight }} />
    </div>
  );
}
