"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildChatParticipant,
  getBlockingParticipant,
  getConversationPeer,
  getParticipantState,
} from "@/compartido/lib/chat-state";
import { apiRequest } from "@/compartido/lib/api";
import { safeRouterReplace } from "@/lib/safe-redirect";
import type { AppUser } from "@/compartido/types/profile";
import type {
  ChatConversation,
  ChatModerationWarning,
  ChatPendingInvite,
  ChatParticipant,
  CompanyChatCandidateDirectoryItem,
} from "@/compartido/types/chat";

type StartConversationRecipient = CompanyChatCandidateDirectoryItem;
type ChatInviteToast = {
  tone: "info" | "success" | "error";
  message: string;
};

type ChatSurfaceResponse = {
  ok: boolean;
  conversations?: ChatConversation[];
  pendingInvites?: ChatPendingInvite[];
  degraded?: boolean;
  message?: string;
};

export function useChatPageState({
  authLoading,
  authUser,
  isEnglish,
}: {
  authLoading: boolean;
  authUser: AppUser | null;
  isEnglish: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [pendingInvites, setPendingInvites] = useState<ChatPendingInvite[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [inviteToast, setInviteToast] = useState<ChatInviteToast | null>(null);
  const [loadingOlderConversationId, setLoadingOlderConversationId] = useState<string | null>(null);
  const [hasOlderMessagesByConversation, setHasOlderMessagesByConversation] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!inviteToast || typeof window === "undefined") {
      return;
    }

    const timeoutId = window.setTimeout(() => setInviteToast(null), 3_000);
    return () => window.clearTimeout(timeoutId);
  }, [inviteToast]);

  const applySurfaceResponse = useCallback((response: ChatSurfaceResponse) => {
    const nextConversations = response.conversations ?? [];
    setConversations(nextConversations);
    setPendingInvites(response.pendingInvites ?? []);
    setHasOlderMessagesByConversation((current) => ({
      ...current,
      ...Object.fromEntries(
        nextConversations.map((conversation) => [
          conversation.id,
          conversation.messages.length >= 20,
        ]),
      ),
    }));
    const requestedConversationId = searchParams.get("conversation");
    setActiveConversationId((current) => {
      if (requestedConversationId && nextConversations.some((conversation) => conversation.id === requestedConversationId)) {
        return requestedConversationId;
      }

      return current && nextConversations.some((conversation) => conversation.id === current)
        ? current
        : nextConversations[0]?.id ?? null;
    });

    if (response.degraded && response.message) {
      setFeedback(response.message);
    }
  }, [searchParams]);

  const refresh = async () => {
    if (!authUser) {
      return;
    }

    const response = await apiRequest<ChatSurfaceResponse>("/api/chat/conversations");

    if (!response.ok) {
      return;
    }

    applySurfaceResponse(response.data ?? { ok: true });
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!authUser) {
      safeRouterReplace(router, "/", "/");
    }
  }, [authLoading, authUser, router]);

  useEffect(() => {
    if (!authUser || typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    const run = async () => {
      const response = await apiRequest<ChatSurfaceResponse>("/api/chat/conversations");

      if (cancelled || !response.ok) {
        return;
      }

      startTransition(() => {
        applySurfaceResponse(response.data ?? { ok: true });
      });
    };

    void run();

    const interval = window.setInterval(() => {
      void run();
    }, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [applySurfaceResponse, authUser]);

  const currentUserId = authUser?.id ?? "";
  const currentParticipant: ChatParticipant | null = authUser && (authUser.role === "candidate" || authUser.role === "company")
    ? buildChatParticipant({
        id: authUser.id,
        name: authUser.role === "company" ? authUser.companyName : authUser.nombre,
        role: authUser.role,
        headline: authUser.role === "company" ? authUser.companyName : authUser.rol,
        location: authUser.role === "company" ? authUser.companyLocation ?? authUser.ubicacion : authUser.ubicacion,
      })
    : null;
  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );
  const activePeer = activeConversation ? getConversationPeer(activeConversation, currentUserId) : null;
  const activeParticipantState = activeConversation
    ? getParticipantState(activeConversation, currentUserId)
    : null;
  const activeBlockedBy = activeConversation ? getBlockingParticipant(activeConversation) : null;
  const isLoadingOlderMessages = loadingOlderConversationId === activeConversation?.id;
  const hasOlderMessages = activeConversation
    ? (hasOlderMessagesByConversation[activeConversation.id] ?? activeConversation.messages.length >= 20)
    : false;

  const openConversation = (conversationId: string) => {
    setFeedback(null);
    setActiveConversationId(conversationId);
    void apiRequest(`/api/chat/conversations/${conversationId}/participant`, {
      method: "PATCH",
      body: JSON.stringify({ markRead: true }),
    }).then(() => refresh());
  };

  const sendActiveMessage = () => {
    if (!activeConversation || !currentParticipant) {
      return;
    }

    void apiRequest<{
      ok: boolean;
      warning?: ChatModerationWarning | null;
      message?: string;
    }>("/api/chat/messages", {
      method: "POST",
      body: JSON.stringify({
        conversationId: activeConversation.id,
        body: draft,
      }),
    }).then((response) => {
      if (!response.ok) {
        setFeedback(
          response.data?.message ??
            (isEnglish ? "We could not send the message." : "No pudimos enviar el mensaje."),
        );
        return;
      }

      setDraft("");
      setFeedback(response.data?.warning?.message ?? null);
      void refresh();
    });
  };

  const loadOlderMessages = async (conversationId: string) => {
    const conversation = conversations.find((item) => item.id === conversationId);
    const earliestMessage = conversation?.messages[0];

    if (!conversation || !earliestMessage || loadingOlderConversationId === conversationId) {
      return;
    }

    setLoadingOlderConversationId(conversationId);

    const response = await apiRequest<{
      ok: boolean;
      messages?: ChatConversation["messages"];
      hasMore?: boolean;
      message?: string;
    }>(`/api/chat/conversations/${conversationId}/messages?before=${encodeURIComponent(earliestMessage.sentAt)}`);

    setLoadingOlderConversationId((current) => (current === conversationId ? null : current));

    if (!response.ok) {
      setFeedback(
        response.data?.message ??
          (isEnglish ? "We could not load older messages." : "No pudimos cargar mensajes anteriores."),
      );
      return;
    }

    const olderMessages = response.data?.messages ?? [];

    setConversations((current) =>
      current.map((item) =>
        item.id === conversationId
          ? {
              ...item,
              messages: [
                ...olderMessages.filter(
                  (message) => !item.messages.some((existing) => existing.id === message.id),
                ),
                ...item.messages,
              ],
            }
          : item,
      ),
    );
    setHasOlderMessagesByConversation((current) => ({
      ...current,
      [conversationId]:
        response.data?.hasMore === true && olderMessages.length > 0,
    }));
  };

  const startConversation = (recipient: StartConversationRecipient | null, starterDraft: string) => {
    void starterDraft;

    if (!currentParticipant || !recipient || authUser?.role !== "company") {
      return false;
    }

    setInviteToast({
      tone: "info",
      message: isEnglish
        ? `Invited ${recipient.nombre} to process.`
        : `Invitaste a proceso a ${recipient.nombre}.`,
    });

    void apiRequest<{ ok: boolean; notificationDelivered?: boolean; message?: string }>("/api/chat/invitations", {
      method: "POST",
      body: JSON.stringify({
        applicationId: recipient.applicationId,
      }),
    }).then((response) => {
      if (!response.ok) {
        setInviteToast({
          tone: "error",
          message:
            response.data?.message ??
            (isEnglish ? "The invite could not be delivered." : "La invitación no pudo entregarse."),
        });
        setFeedback(
          response.data?.message ??
            (isEnglish ? "We could not create the invite." : "No pudimos crear la invitación."),
        );
        return;
      }

      setInviteToast({
        tone: "success",
        message: response.data?.notificationDelivered === false
          ? isEnglish
            ? `Invite created for ${recipient.nombre}, but the inbox delivery is still pending.`
            : `La invitación a ${recipient.nombre} quedó creada, pero la entrega a la bandeja sigue pendiente.`
          : isEnglish
            ? `Invite delivered to ${recipient.nombre}'s inbox.`
            : `La invitación se entregó en la bandeja de ${recipient.nombre}.`,
      });
      setFeedback(
        isEnglish
          ? `Invite sent to ${recipient.nombre}.`
          : `Invitación enviada a ${recipient.nombre}.`,
      );
      void refresh();
    });

    return true;
  };

  const toggleMute = () => {
    if (!activeConversation || authUser?.role !== "candidate" || !activeParticipantState) {
      return;
    }

    void apiRequest(`/api/chat/conversations/${activeConversation.id}/participant`, {
      method: "PATCH",
      body: JSON.stringify({
        muted: !activeParticipantState.muted,
      }),
    }).then(() => refresh());
  };

  const toggleBlock = () => {
    if (!activeConversation || authUser?.role !== "candidate" || !activeParticipantState) {
      return;
    }

    void apiRequest(`/api/chat/conversations/${activeConversation.id}/participant`, {
      method: "PATCH",
      body: JSON.stringify({
        blocked: !activeParticipantState.blocked,
      }),
    }).then(() => {
      setFeedback(
        activeParticipantState.blocked
          ? isEnglish
            ? "Conversation unblocked."
            : "Conversación desbloqueada."
          : isEnglish
            ? "Conversation blocked."
            : "Conversación bloqueada.",
      );
      void refresh();
    });
  };

  const reportActiveConversation = () => {
    if (!activeConversation || authUser?.role !== "candidate") {
      return;
    }

    const normalizedReason = reportReason.trim();
    if (!normalizedReason) {
      setFeedback(
        isEnglish
          ? "Add a reason before sending the report."
          : "Agrega un motivo antes de enviar el reporte.",
      );
      return;
    }

    void apiRequest(`/api/chat/conversations/${activeConversation.id}/participant`, {
      method: "PATCH",
      body: JSON.stringify({
        reportReason: normalizedReason,
      }),
    }).then((response) => {
      if (!response.ok) {
        setFeedback(
          isEnglish
            ? "The report could not be sent."
            : "No se pudo enviar el reporte.",
        );
        return;
      }

      setReportReason("");
      setFeedback(
        isEnglish
          ? "Report sent for moderation follow-up."
          : "Reporte enviado para seguimiento de moderación.",
      );
      void refresh();
    });
  };

  const respondToInvite = (inviteId: string, action: "accept" | "reject") => {
    void apiRequest<{ ok: boolean; accepted?: boolean; conversationId?: string; message?: string }>(
      `/api/chat/invitations/${inviteId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ action }),
      },
    ).then((response) => {
      if (!response.ok) {
        setFeedback(
          response.data?.message ??
            (isEnglish
              ? "The invitation could not be updated."
              : "No se pudo actualizar la invitación."),
        );
        return;
      }

      setFeedback(
        action === "accept"
          ? isEnglish
            ? "Invitation accepted. Chat unlocked."
            : "Invitación aceptada. Chat desbloqueado."
          : isEnglish
            ? "Invitation rejected."
            : "Invitación rechazada.",
      );
      void refresh().then(() => {
        if (action === "accept" && response.data?.conversationId) {
          setActiveConversationId(response.data.conversationId);
        }
      });
    });
  };

  return {
    activeBlockedBy,
    activeConversation,
    activePeer,
    activeParticipantState,
    hasOlderMessages,
    inviteToast,
    isLoadingOlderMessages,
    conversations,
    currentParticipant,
    currentUserId,
    draft,
    feedback,
    loadOlderMessages,
    openConversation,
    pendingInvites,
    reportReason,
    sendActiveMessage,
    setDraft,
    setFeedback,
    setReportReason,
    startConversation,
    toggleBlock,
    toggleMute,
    reportActiveConversation,
    respondToInvite,
    refreshConversations: refresh,
  };
}
