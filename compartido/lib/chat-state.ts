import type { ChatConversation, ChatParticipant, ChatParticipantState } from "@/types/chat";

function createParticipantState(
  overrides: Partial<ChatParticipantState> = {},
): ChatParticipantState {
  return {
    muted: false,
    blocked: false,
    blockedAt: null,
    lastReadAt: null,
    reportedAt: null,
    reportReason: null,
    cooldownUntil: null,
    ...overrides,
  };
}

export function buildChatParticipant(
  participant: ChatParticipant,
): ChatParticipant {
  return {
    id: participant.id,
    name: participant.name,
    role: participant.role,
    headline: participant.headline,
    location: participant.location,
  };
}

export function getConversationPeer(
  conversation: ChatConversation,
  currentUserId: string,
) {
  return (
    conversation.participants.find((participant) => participant.id !== currentUserId) ??
    conversation.participants[0]
  );
}

export function getParticipantState(
  conversation: ChatConversation,
  userId: string,
) {
  return createParticipantState(conversation.participantState[userId] ?? {});
}

export function getBlockingParticipant(conversation: ChatConversation) {
  return (
    conversation.participants.find((participant) =>
      getParticipantState(conversation, participant.id).blocked,
    ) ?? null
  );
}

export function getConversationUnreadCount(
  conversation: ChatConversation,
  userId: string,
) {
  const state = getParticipantState(conversation, userId);

  return conversation.messages.filter((message) => {
    if (message.senderId === userId) {
      return false;
    }

    if (!state.lastReadAt) {
      return true;
    }

    return new Date(message.sentAt).getTime() > new Date(state.lastReadAt).getTime();
  }).length;
}
