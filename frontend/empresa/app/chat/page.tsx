"use client";

import { Send } from "lucide-react";
import { ChatMessageThread } from "@/compartido/components/chat/chat-message-thread";
import { GlobalLoadingScreen } from "@/compartido/components/ui/global-loading-screen";
import { useAppLanguage } from "@/compartido/hooks/use-app-language";
import { useAuthUser } from "@/compartido/hooks/use-auth-user";
import { useChatPageState } from "@/compartido/hooks/use-chat-page-state";
import { getConversationPeer } from "@/compartido/lib/chat-state";
import { useVacancyTheme } from "@/compartido/theme/use-vacancy-theme";
import { CompanyDashboardShell } from "@/frontend/empresa/components/system/company-dashboard-shell";
import { useCompanyChatDirectory } from "@/frontend/empresa/hooks/use-company-chat-directory";

export default function ChatEmpresaPage() {
  const { isDark, toggleTheme } = useVacancyTheme();
  const { authUser, authLoading } = useAuthUser();
  const { isEnglish } = useAppLanguage();
  const { companyCandidates, refreshCompanyCandidates } = useCompanyChatDirectory(authUser);
  const {
    activeConversation,
    activePeer,
    conversations,
    currentParticipant,
    currentUserId,
    draft,
    feedback,
    hasOlderMessages,
    isLoadingOlderMessages,
    loadOlderMessages,
    openConversation,
    sendActiveMessage,
    setDraft,
    startConversation,
  } = useChatPageState({ authLoading, authUser, isEnglish });

  if (authLoading || !authUser || authUser.role !== "company" || !currentParticipant) {
    return <GlobalLoadingScreen />;
  }

  return (
    <CompanyDashboardShell isDark={isDark} onToggleTheme={toggleTheme} title="Chats" description="Invita candidatos a proceso y responde conversaciones activas.">
      {feedback ? (
        <div className={isDark ? "rounded-[1rem] border border-cyan-300/18 bg-cyan-300/8 px-4 py-3 text-sm text-cyan-100" : "rounded-[1rem] border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-700"}>
          {feedback}
        </div>
      ) : null}
      <section className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className={isDark ? "rounded-[1.7rem] border border-white/8 bg-white/4 p-4" : "rounded-[1.7rem] border border-slate-200 bg-white p-4"}>
          <p className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>Invitar a proceso</p>
          <div className="mt-4 space-y-3">
            {companyCandidates.map((candidate) => (
              <div key={candidate.applicationId} className={isDark ? "rounded-[1rem] border border-white/10 bg-white/4 p-4" : "rounded-[1rem] border border-slate-200 bg-slate-50 p-4"}>
                <p className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>{candidate.nombre}</p>
                <p className={isDark ? "mt-1 text-xs text-slate-300" : "mt-1 text-xs text-slate-600"}>{candidate.rol} · {candidate.jobTitle}</p>
                <button
                  type="button"
                  onClick={() => {
                    if (candidate.activeConversationId) {
                      openConversation(candidate.activeConversationId);
                      return;
                    }
                    startConversation(candidate, "");
                    window.setTimeout(() => refreshCompanyCandidates(), 500);
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  <Send className="h-3.5 w-3.5" />
                  {candidate.activeConversationId ? "Abrir chat" : "Invitar"}
                </button>
              </div>
            ))}
          </div>

          <p className={isDark ? "mt-5 text-sm font-semibold text-white" : "mt-5 text-sm font-semibold text-slate-950"}>Bandeja</p>
          <div className="mt-4 space-y-3">
            {conversations.map((conversation) => {
              const peer = getConversationPeer(conversation, currentUserId);
              const lastMessage = conversation.messages.at(-1);
              const active = conversation.id === activeConversation?.id;
              return (
                <button key={conversation.id} type="button" onClick={() => openConversation(conversation.id)} className={`w-full rounded-[1.2rem] border px-4 py-3 text-left transition ${active ? isDark ? "border-cyan-300/28 bg-cyan-300/10" : "border-sky-300 bg-sky-50" : isDark ? "border-white/8 bg-white/3" : "border-slate-200 bg-slate-50"}`}>
                  <p className={isDark ? "truncate text-sm font-semibold text-white" : "truncate text-sm font-semibold text-slate-950"}>{peer.name}</p>
                  <p className={isDark ? "mt-2 line-clamp-2 text-sm leading-6 text-slate-300" : "mt-2 line-clamp-2 text-sm leading-6 text-slate-600"}>{lastMessage?.body ?? "Sin mensajes"}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className={isDark ? "rounded-[1.7rem] border border-white/8 bg-white/4 p-4" : "rounded-[1.7rem] border border-slate-200 bg-white p-4"}>
          {activeConversation && activePeer ? (
            <>
              <div className={isDark ? "rounded-[1.3rem] border border-white/8 bg-white/4 px-4 py-4" : "rounded-[1.3rem] border border-slate-200 bg-slate-50 px-4 py-4"}>
                <p className={isDark ? "text-lg font-semibold text-white" : "text-lg font-semibold text-slate-950"}>{activePeer.name}</p>
                <p className={isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-600"}>{activePeer.headline}</p>
              </div>
              <ChatMessageThread
                messages={activeConversation.messages}
                currentUserId={currentUserId}
                isDark={isDark}
                locale={isEnglish ? "en-US" : "es-CO"}
                isEnglish={isEnglish}
                hasOlderMessages={hasOlderMessages}
                isLoadingOlderMessages={isLoadingOlderMessages}
                onLoadOlder={() => void loadOlderMessages(activeConversation.id)}
              />
              <div className={isDark ? "mt-4 rounded-[1.3rem] border border-white/8 bg-white/4 p-3" : "mt-4 rounded-[1.3rem] border border-slate-200 bg-slate-50 p-3"}>
                <div className="flex items-end gap-3">
                  <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} className={isDark ? "min-h-[90px] flex-1 rounded-[1rem] border border-white/10 bg-[#081120] px-4 py-3 text-sm text-white outline-none" : "min-h-[90px] flex-1 rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none"} />
                  <button type="button" onClick={sendActiveMessage} className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white transition hover:scale-105">
                    <Send className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className={isDark ? "rounded-[1.4rem] border border-white/8 bg-white/4 px-5 py-8 text-center text-slate-300" : "rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-8 text-center text-slate-600"}>
              Selecciona una conversación o invita un candidato para empezar.
            </div>
          )}
        </section>
      </section>
    </CompanyDashboardShell>
  );
}
