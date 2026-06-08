import type { ChatConversation } from "@/compartido/types/chat";

export function formatChatTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatChatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function getChatRoleLabel(role: "candidate" | "company", isEnglish: boolean) {
  if (role === "company") {
    return isEnglish ? "Company" : "Empresa";
  }

  return isEnglish ? "Candidate" : "Usuario";
}

export function getChatSendErrorMessage(error: string, isEnglish: boolean) {
  switch (error) {
    case "company_initiation_required":
      return isEnglish
        ? "Only companies can send the first message in a new conversation."
        : "Solo las empresas pueden enviar el primer mensaje de una conversación nueva.";
    case "conversation_blocked_by_you":
      return isEnglish
        ? "You blocked this conversation. Unblock it before sending more messages."
        : "Bloqueaste esta conversación. Desbloquéala antes de seguir enviando mensajes.";
    case "conversation_blocked_by_peer":
      return isEnglish
        ? "This conversation is blocked by the other user."
        : "Esta conversación fue bloqueada por la otra persona.";
    case "recipient_required":
      return isEnglish
        ? "Choose a candidate before starting a conversation."
        : "Elige un usuario antes de iniciar la conversación.";
    case "empty_message":
      return isEnglish ? "Write a message before sending." : "Escribe un mensaje antes de enviarlo.";
    default:
      return isEnglish ? "We could not send the message." : "No pudimos enviar el mensaje.";
  }
}

export function getChatConversationStatusLabel(
  conversation: ChatConversation,
  currentUserId: string,
  isEnglish: boolean,
  unreadCount: number,
  muted: boolean,
  blockedById: string | null,
) {
  if (blockedById) {
    return blockedById === currentUserId
      ? isEnglish ? "Blocked by you" : "Bloqueado por ti"
      : isEnglish ? "Blocked by user" : "Bloqueado por usuario";
  }

  if (unreadCount > 0) {
    return isEnglish ? "New reply" : "Nueva respuesta";
  }

  if (muted) {
    return isEnglish ? "Muted" : "Silenciado";
  }

  return isEnglish ? "Active thread" : "Hilo activo";
}
