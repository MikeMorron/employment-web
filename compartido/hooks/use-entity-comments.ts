"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { EntityComment, EntityCommentSummary } from "@/types/comment";

const COMMENTS_PAGE_SIZE = 6;

type CommentsResponse = {
  ok: boolean;
  comments?: EntityComment[];
  nextOffset?: number;
  hasMore?: boolean;
  summary?: EntityCommentSummary;
  message?: string;
};

export function useEntityComments(entityType: string, entityId: string, starsFilter: number | "all") {
  const [comments, setComments] = useState<EntityComment[]>([]);
  const [summary, setSummary] = useState<EntityCommentSummary | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const fetchPage = useCallback(async (nextOffset: number, replace = false) => {
    if (!entityType || !entityId) {
      return;
    }

    if (replace) {
      setComments([]);
      setOffset(0);
      setHasMore(false);
    }

    setLoading(true);
    setError(null);

    const query = new URLSearchParams({
      entityType,
      entityId,
      offset: String(nextOffset),
    });

    if (starsFilter !== "all") {
      query.set("stars", String(starsFilter));
    }

    const response = await apiRequest<CommentsResponse>(`/api/comments?${query.toString()}`);

    if (abortRef.current) {
      return;
    }

    if (!response.ok) {
      setError(response.data?.message ?? "No pudimos cargar los comentarios.");
      setLoading(false);
      return;
    }

    const nextComments = response.data?.comments ?? [];
    setComments((current) => (replace ? nextComments : [...current, ...nextComments]));
    setSummary(response.data?.summary ?? null);
    setOffset(response.data?.nextOffset ?? nextOffset + nextComments.length);
    setHasMore(Boolean(response.data?.hasMore));
    setLoading(false);
  }, [entityId, entityType, starsFilter]);

  useEffect(() => {
    abortRef.current = false;
    const timer = window.setTimeout(() => {
      void fetchPage(0, true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      abortRef.current = true;
    };
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) {
      return;
    }

    await fetchPage(offset, false);
  }, [fetchPage, hasMore, loading, offset]);

  const submitComment = useCallback(async (payload: { body: string; stars?: number }) => {
    if (!entityType || !entityId) {
      return { ok: false as const };
    }

    setSubmitting(true);
    setError(null);

    const response = await apiRequest<{ ok: boolean; comment?: EntityComment; message?: string }>("/api/comments", {
      method: "POST",
      body: JSON.stringify({
        entityType,
        entityId,
        body: payload.body,
        stars: payload.stars,
      }),
    });

    setSubmitting(false);

    if (!response.ok || !response.data?.comment) {
      setError(response.data?.message ?? "No pudimos publicar tu comentario.");
      return { ok: false as const };
    }

    await fetchPage(0, true);
    return { ok: true as const };
  }, [entityId, entityType, fetchPage]);

  return {
    comments,
    summary,
    loading,
    submitting,
    hasMore,
    error,
    pageSize: COMMENTS_PAGE_SIZE,
    loadMore,
    submitComment,
  };
}
