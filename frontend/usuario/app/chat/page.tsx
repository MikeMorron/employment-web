"use client";

import { BellOff, BellRing, Ban, ChevronDown, Info, RotateCcw, Send, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { ChatMessageThread } from "@/compartido/components/chat/chat-message-thread";
import { MiniPageNav } from "@/compartido/components/ui/mini-page-nav";
import { GlobalLoadingScreen } from "@/compartido/components/ui/global-loading-screen";
import { useAppLanguage } from "@/compartido/hooks/use-app-language";
import { useAuthUser } from "@/compartido/hooks/use-auth-user";
import { useChatPageState } from "@/compartido/hooks/use-chat-page-state";
import {
  formatChatDate,
  getChatConversationStatusLabel,
  getChatRoleLabel,
} from "@/compartido/lib/chat-ui";
import {
  getBlockingParticipant,
  getConversationPeer,
  getConversationUnreadCount,
  getParticipantState,
} from "@/compartido/lib/chat-state";
import { useUiCopy } from "@/compartido/lib/i18n/ui-copy";
import { useVacancyTheme } from "@/compartido/theme/use-vacancy-theme";

export default function ChatUsuarioPage() {
  const { isDark, themeReady, toggleTheme } = useVacancyTheme();
  const { authUser, authLoading } = useAuthUser();
  const { isEnglish } = useAppLanguage();
  const t = useUiCopy("chat");
  const [rulesOpen, setRulesOpen] = useState(false);
  const locale = isEnglish ? "en-US" : "es-CO";
  const {
    activeBlockedBy,
    activeConversation,
    activePeer,
    activeParticipantState,
    hasOlderMessages,
    isLoadingOlderMessages,
    loadOlderMessages,
    conversations,
    currentParticipant,
    currentUserId,
    draft,
    feedback,
    openConversation,
    pendingInvites,
    reportActiveConversation,
    reportReason,
    sendActiveMessage,
    setDraft,
    setReportReason,
    toggleBlock,
    toggleMute,
  } = useChatPageState({
    authLoading,
    authUser,
    isEnglish,
  });

  if (authLoading || !authUser || authUser.role !== "candidate" || !currentParticipant) {
    return <GlobalLoadingScreen />;
  }

  return (
    <main
      className={`min-h-screen px-5 py-10 ${isDark ? "vacancies-shell text-[#eef6ff]" : "vacancies-shell-light text-slate-900"} ${themeReady ? "" : "invisible"}`}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <MiniPageNav isDark={isDark} onToggleTheme={toggleTheme} />

        {feedback ? (
          <div className={isDark ? "rounded-[1.3rem] border border-cyan-300/18 bg-cyan-300/8 px-4 py-3 text-sm text-cyan-100" : "rounded-[1.3rem] border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-700"}>
            {feedback}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className={isDark ? "rounded-[1.7rem] border border-white/8 bg-white/4 p-4" : "rounded-[1.7rem] border border-slate-300 bg-white/92 p-4"}>
            <div className="relative flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setRulesOpen((current) => !current)}
                className={isDark ? "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-2 text-xs font-semibold text-slate-100" : "inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"}
              >
                <Info className="h-4 w-4" />
                {isEnglish ? "Rules" : "Reglas"}
                <ChevronDown className={`h-4 w-4 transition ${rulesOpen ? "rotate-180" : ""}`} />
              </button>
              {pendingInvites.length > 0 ? (
                <a
                  href="/invitaciones"
                  className={isDark ? "relative inline-flex min-w-0 items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100" : "relative inline-flex min-w-0 items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"}
                >
                  <BellRing className="h-4 w-4" />
                  <span className="truncate">{pendingInvites[0]?.companyName}</span>
                  <span className="absolute -right-2 -top-2 inline-flex min-w-5 justify-center rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] text-white">
                    {pendingInvites.length}
                  </span>
                </a>
              ) : null}
              {rulesOpen ? (
                <div className={isDark ? "absolute left-0 top-12 z-20 w-72 rounded-[1rem] border border-white/10 bg-[#081120] p-3 text-xs leading-5 text-slate-300 shadow-xl" : "absolute left-0 top-12 z-20 w-72 rounded-[1rem] border border-slate-300 bg-white p-3 text-xs leading-5 text-slate-600 shadow-xl"}>
                  {isEnglish
                    ? "Reply only to hiring conversations, mute alerts when needed, block unsafe contacts, and report inappropriate behavior."
                    : "Responde solo conversaciones de proceso, silencia avisos si lo necesitas, bloquea contactos inseguros y reporta conductas inapropiadas."}
                </div>
              ) : null}
            </div>

            <p className={isDark ? "mt-5 text-sm font-semibold text-white" : "mt-5 text-sm font-semibold text-slate-950"}>
              {t("inbox")}
            </p>
            <div className="mt-4 space-y-3">
              {conversations.length > 0 ? conversations.map((conversation) => {
                const peer = getConversationPeer(conversation, currentUserId);
                const lastMessage = conversation.messages.at(-1);
                const active = conversation.id === activeConversation?.id;
                const unreadCount = getConversationUnreadCount(conversation, currentUserId);
                const participantState = getParticipantState(conversation, currentUserId);
                const blockedBy = getBlockingParticipant(conversation);

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => openConversation(conversation.id)}
                    className={`w-full rounded-[1.2rem] border px-4 py-3 text-left transition ${
                      active
                        ? isDark
                          ? "border-cyan-300/28 bg-cyan-300/10"
                          : "border-sky-300 bg-sky-50"
                        : isDark
                          ? "border-white/8 bg-white/3 hover:border-cyan-300/20"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={isDark ? "truncate text-sm font-semibold text-white" : "truncate text-sm font-semibold text-slate-950"}>
                          {peer.name}
                        </p>
                        <p className={isDark ? "mt-1 truncate text-xs text-slate-400" : "mt-1 truncate text-xs text-slate-500"}>
                          {peer.headline}
                        </p>
                      </div>
                      {unreadCount > 0 ? (
                        <span className={isDark ? "rounded-full border border-cyan-300/18 bg-cyan-300/10 px-2 py-1 text-[11px] font-semibold text-cyan-100" : "rounded-full border border-sky-300 bg-white px-2 py-1 text-[11px] font-semibold text-sky-700"}>
                          {unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={isDark ? "text-xs uppercase tracking-[0.16em] text-slate-500" : "text-xs uppercase tracking-[0.16em] text-slate-500"}>
                        {getChatRoleLabel(peer.role, isEnglish)}
                      </span>
                      {participantState.muted ? (
                        <span className={isDark ? "rounded-full border border-white/8 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300" : "rounded-full border border-slate-300 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600"}>
                          {isEnglish ? "Muted" : "Silenciado"}
                        </span>
                      ) : null}
                    </div>
                    <p className={isDark ? "mt-2 line-clamp-2 text-sm leading-6 text-slate-300" : "mt-2 line-clamp-2 text-sm leading-6 text-slate-600"}>
                      {lastMessage?.body ?? t("emptyConversation")}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
                        {getChatConversationStatusLabel(
                          conversation,
                          currentUserId,
                          isEnglish,
                          unreadCount,
                          participantState.muted,
                          blockedBy?.id ?? null,
                        )}
                      </span>
                      <span className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
                        {lastMessage ? formatChatDate(lastMessage.sentAt, locale) : ""}
                      </span>
                    </div>
                  </button>
                );
              }) : (
                <div className={isDark ? "rounded-[1.3rem] border border-white/8 bg-white/4 px-4 py-5 text-sm text-slate-300" : "rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600"}>
                  {isEnglish ? "No company has contacted you yet." : "Aún ninguna empresa te ha escrito."}
                </div>
              )}
            </div>
          </aside>

          <section className={isDark ? "rounded-[1.7rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4" : "rounded-[1.7rem] border border-slate-300 bg-white/92 p-4"}>
            {activeConversation && activePeer ? (
              <>
                <div className={isDark ? "rounded-[1.3rem] border border-white/8 bg-white/4 px-4 py-4" : "rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4"}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className={isDark ? "text-lg font-semibold text-white" : "text-lg font-semibold text-slate-950"}>
                        {activePeer.name}
                      </p>
                      <p className={isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-600"}>
                        {activePeer.headline} {activePeer.location ? `· ${activePeer.location}` : ""}
                      </p>
                    </div>
                    <span className={isDark ? "rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100" : "rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"}>
                      {getChatConversationStatusLabel(
                        activeConversation,
                        currentUserId,
                        isEnglish,
                        getConversationUnreadCount(activeConversation, currentUserId),
                        Boolean(activeParticipantState?.muted),
                        activeBlockedBy?.id ?? null,
                      )}
                    </span>
                  </div>

                  {activeParticipantState ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={toggleMute}
                        className={isDark ? "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-2 text-xs font-semibold text-slate-200" : "inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"}
                      >
                        {activeParticipantState.muted ? <BellRing className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                        {activeParticipantState.muted
                          ? isEnglish ? "Unmute notifications" : "Activar notificaciones"
                          : isEnglish ? "Mute notifications" : "Silenciar notificaciones"}
                      </button>
                      <button
                        type="button"
                        onClick={toggleBlock}
                        className={isDark ? "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-2 text-xs font-semibold text-slate-200" : "inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"}
                      >
                        {activeParticipantState.blocked ? <RotateCcw className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                        {activeParticipantState.blocked
                          ? isEnglish ? "Unblock company" : "Desbloquear empresa"
                          : isEnglish ? "Block company" : "Bloquear empresa"}
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className={isDark ? "mt-4 rounded-[1.3rem] border border-white/8 bg-white/4 p-4" : "mt-4 rounded-[1.3rem] border border-slate-200 bg-slate-50 p-4"}>
                  <div className="flex items-center gap-2">
                    <ShieldAlert className={isDark ? "h-4 w-4 text-amber-200" : "h-4 w-4 text-amber-700"} />
                    <p className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>
                      {isEnglish ? "Report inappropriate conduct" : "Reportar conducta inapropiada"}
                    </p>
                  </div>
                  <textarea
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    rows={3}
                    placeholder={isEnglish ? "Describe the conduct you want to report" : "Describe la conducta que quieres reportar"}
                    className={isDark ? "mt-3 min-h-[90px] w-full rounded-[1rem] border border-white/10 bg-[#081120] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" : "mt-3 min-h-[90px] w-full rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"}
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
                      {activeParticipantState?.reportedAt
                        ? isEnglish
                          ? `Last report sent on ${formatChatDate(activeParticipantState.reportedAt, locale)}.`
                          : `Último reporte enviado el ${formatChatDate(activeParticipantState.reportedAt, locale)}.`
                        : isEnglish
                          ? "Reports are sent to backend moderation for review."
                          : "Los reportes se envían al backend de moderación para revisión."}
                    </p>
                    <button
                      type="button"
                      onClick={reportActiveConversation}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:scale-[1.01]"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      {isEnglish ? "Report chat" : "Reportar chat"}
                    </button>
                  </div>
                </div>

                {activeBlockedBy ? (
                  <div className={isDark ? "mt-4 rounded-[1.3rem] border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100" : "mt-4 rounded-[1.3rem] border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700"}>
                    {activeBlockedBy.id === currentUserId
                      ? isEnglish
                        ? "You blocked this company. Unblock it to resume the conversation."
                        : "Bloqueaste esta empresa. Desbloquéala para retomar la conversación."
                      : isEnglish
                        ? "This chat is blocked by the other user, so no more messages can be sent."
                        : "Este chat está bloqueado por la otra persona, por lo que no se pueden enviar más mensajes."}
                  </div>
                ) : null}

                <ChatMessageThread
                  messages={activeConversation.messages}
                  currentUserId={currentUserId}
                  isDark={isDark}
                  locale={locale}
                  isEnglish={isEnglish}
                  hasOlderMessages={hasOlderMessages}
                  isLoadingOlderMessages={isLoadingOlderMessages}
                  onLoadOlder={() => {
                    void loadOlderMessages(activeConversation.id);
                  }}
                />

                <div className={isDark ? "mt-4 rounded-[1.3rem] border border-white/8 bg-white/4 p-3" : "mt-4 rounded-[1.3rem] border border-slate-200 bg-slate-50 p-3"}>
                  <label className="sr-only" htmlFor="chat-message-candidate">
                    {t("composerLabel")}
                  </label>
                  <div className="flex gap-3">
                    <textarea
                      id="chat-message-candidate"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          sendActiveMessage();
                        }
                      }}
                      rows={3}
                      placeholder={t("composerPlaceholder")}
                      disabled={Boolean(activeBlockedBy)}
                      className={isDark ? "min-h-[90px] flex-1 rounded-[1rem] border border-white/10 bg-[#081120] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60" : "min-h-[90px] flex-1 rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"}
                    />
                    <button
                      type="button"
                      onClick={sendActiveMessage}
                      disabled={Boolean(activeBlockedBy)}
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className={isDark ? "rounded-[1.4rem] border border-white/8 bg-white/4 px-5 py-8 text-center text-slate-300" : "rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-8 text-center text-slate-600"}>
                {t("emptyConversation")}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
