"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useEntityComments } from "@/hooks/use-entity-comments";
import { useUiCopy } from "@/lib/i18n/ui-copy";
import { sanitizeCommentInput } from "@/lib/comments/sanitize";
import type { EntityCommentSummary } from "@/types/comment";

function formatCommentDate(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function countWords(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function EntityCommentsPanel({
  entityType,
  entityId,
  isDark,
  isEnglish,
  title,
  emptyMessage,
  allowCompose = false,
  maxHeightClassName = "max-h-[28rem]",
  filterStyle = "dropdown",
  onSummaryChange,
}: {
  entityType: string;
  entityId: string;
  isDark: boolean;
  isEnglish: boolean;
  title: string;
  emptyMessage: string;
  allowCompose?: boolean;
  maxHeightClassName?: string;
  filterStyle?: "dropdown" | "row";
  onSummaryChange?: (summary: EntityCommentSummary | null) => void;
}) {
  const { authUser } = useAuthUser();
  const common = useUiCopy("common");
  const [reviewFilter, setReviewFilter] = useState<number | "all">("all");
  const [selectedStarOption, setSelectedStarOption] = useState<5 | 4 | 3 | 2 | 1>(5);
  const [draftComment, setDraftComment] = useState("");
  const [draftStars, setDraftStars] = useState<5 | 4 | 3 | 2 | 1>(5);
  const listRef = useRef<HTMLDivElement | null>(null);
  const {
    comments,
    summary,
    loading,
    submitting,
    hasMore,
    error,
    loadMore,
    submitComment,
  } = useEntityComments(entityType, entityId, reviewFilter);

  useEffect(() => {
    if (onSummaryChange) {
      onSummaryChange(summary);
    }
  }, [onSummaryChange, summary]);

  const handleCommentsScroll = async () => {
    const node = listRef.current;
    if (!node || loading || !hasMore) {
      return;
    }

    const remaining = node.scrollHeight - node.scrollTop - node.clientHeight;
    if (remaining < 72) {
      await loadMore();
    }
  };

  const handlePublish = async () => {
    const content = draftComment.trim();
    if (!content || countWords(content) > 1000) {
      return;
    }

    const result = await submitComment({
      body: content,
      stars: draftStars,
    });

    if (result.ok) {
      setDraftComment("");
      setDraftStars(5);
      setReviewFilter("all");
      if (listRef.current) {
        listRef.current.scrollTop = 0;
      }
    }
  };

  const wordsUsed = countWords(draftComment);

  return (
    <div className={isDark ? "rounded-[1.5rem] border border-white/8 bg-white/4 p-5" : "rounded-[1.5rem] border border-slate-300 bg-white/92 p-5"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200" : "text-xs font-semibold uppercase tracking-[0.18em] text-sky-700"}>
          {title}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setReviewFilter("all")}
            className={
              reviewFilter === "all"
                ? isDark
                  ? "rounded-full border border-cyan-300/24 bg-cyan-300/12 px-3 py-1 text-xs font-semibold text-cyan-100"
                  : "rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                : isDark
                  ? "rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs font-semibold text-slate-200"
                  : "rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
            }
          >
            {common("all")}
          </button>
          {filterStyle === "row" ? (
            <div className="flex flex-wrap items-center gap-2">
              {[5, 4, 3, 2, 1].map((value) => {
                const active = reviewFilter === value;
                return (
                  <button
                    key={`${entityId}-comment-filter-row-${value}`}
                    type="button"
                    onClick={() => {
                      setSelectedStarOption(value as 5 | 4 | 3 | 2 | 1);
                      setReviewFilter(value as 5 | 4 | 3 | 2 | 1);
                    }}
                    className={
                      active
                        ? isDark
                          ? "rounded-full border border-cyan-300/24 bg-cyan-300/12 px-3 py-1 text-xs font-semibold text-cyan-100"
                          : "rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                        : isDark
                          ? "rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs font-semibold text-slate-200"
                          : "rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                    }
                  >
                    {value}★
                  </button>
                );
              })}
            </div>
          ) : (
            <select
              value={String(selectedStarOption)}
              onChange={(event) => {
                const nextValue = Number(event.target.value) as 5 | 4 | 3 | 2 | 1;
                setSelectedStarOption(nextValue);
                setReviewFilter(nextValue);
              }}
              className={isDark ? "rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs font-semibold text-slate-200 outline-none" : "rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 outline-none"}
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={`${entityId}-comment-filter-${value}`} value={value}>
                  {value}★
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div
        ref={listRef}
        onScroll={() => {
          void handleCommentsScroll();
        }}
        className={`mt-4 ${maxHeightClassName} space-y-3 overflow-y-auto pr-1`}
      >
        {comments.map((comment) => (
          <article key={comment.id} className={isDark ? "rounded-[1.2rem] border border-white/8 bg-white/4 p-4" : "rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-4"}>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>
                  {comment.authorName}
                </p>
                {comment.stars ? (
                  <span className={isDark ? "rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs font-semibold text-slate-200" : "rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700"}>
                    {comment.stars}★
                  </span>
                ) : null}
              </div>
              <p className={isDark ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-500"}>
                {formatCommentDate(comment.createdAt)}
              </p>
            </div>
            <p className={isDark ? "mt-3 text-sm leading-6 text-slate-300" : "mt-3 text-sm leading-6 text-slate-700"}>
              {comment.body}
            </p>
          </article>
        ))}
        {loading && comments.length === 0 ? (
          <div className={isDark ? "rounded-[1.2rem] border border-white/8 bg-white/4 p-4 text-sm text-slate-300" : "rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600"}>
            {common("loadingComments")}
          </div>
        ) : null}
        {!loading && comments.length === 0 ? (
          <div className={isDark ? "rounded-[1.2rem] border border-white/8 bg-white/4 p-4 text-sm text-slate-300" : "rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600"}>
            {emptyMessage}
          </div>
        ) : null}
        {loading && comments.length > 0 ? (
          <div className={isDark ? "p-2 text-center text-xs text-slate-400" : "p-2 text-center text-xs text-slate-500"}>
            {common("loadingMore")}
          </div>
        ) : null}
      </div>

      {allowCompose ? (
        <div className={isDark ? "mt-4 rounded-[1.2rem] border border-white/8 bg-white/4 p-4" : "mt-4 rounded-[1.2rem] border border-slate-200 bg-slate-50/80 p-4"}>
          <div className="flex items-center gap-3">
            <select
              value={draftStars}
              onChange={(event) => setDraftStars(Number(event.target.value) as 5 | 4 | 3 | 2 | 1)}
              className={isDark ? "rounded-full border border-white/10 bg-white/4 px-3 py-2 text-xs font-semibold text-slate-200 outline-none" : "rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none"}
              disabled={!authUser || submitting}
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={`${entityId}-draft-stars-${value}`} value={value}>
                  {value}★
                </option>
              ))}
            </select>
            <span className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
              {authUser ? common("yourReview") : common("loginToComment")}
            </span>
          </div>
          <textarea
            value={draftComment}
            onChange={(event) => setDraftComment(sanitizeCommentInput(event.target.value))}
            rows={4}
            disabled={!authUser || submitting}
            placeholder={common("writeYourComment")}
            className={isDark ? "mt-3 w-full rounded-[1rem] border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500" : "mt-3 w-full rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
              {isEnglish ? `${wordsUsed}/1000 words` : `${wordsUsed}/1000 palabras`}
            </span>
            <button
              type="button"
              onClick={() => {
                void handlePublish();
              }}
              disabled={!authUser || submitting || !draftComment.trim() || wordsUsed > 1000}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(76,29,149,0.24)] transition duration-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? common("publishing") : common("publishComment")}
            </button>
          </div>
          {error ? (
            <p className={isDark ? "mt-3 text-xs text-rose-300" : "mt-3 text-xs text-rose-600"}>{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
