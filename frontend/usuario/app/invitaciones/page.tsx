"use client";

import { useMemo, useState } from "react";
import { Check, FileText, Handshake, UserRound, X } from "lucide-react";
import { ApplicationVacancyPreviewModal } from "@/components/applications/application-vacancy-preview-modal";
import { GlobalLoadingScreen } from "@/components/ui/global-loading-screen";
import { MiniPageNav } from "@/components/ui/mini-page-nav";
import { RoleRouteGuard } from "@/components/role/role-route-guard";
import { useAppLanguage } from "@/hooks/use-app-language";
import { useAuthUser } from "@/hooks/use-auth-user";
import { useChatPageState } from "@/hooks/use-chat-page-state";
import { useVacancyFeed } from "@/hooks/use-vacancy-feed";
import { useVacancyTheme } from "@/hooks/use-vacancy-theme";

export default function InvitacionesPage() {
  const { isDark, themeReady, toggleTheme } = useVacancyTheme();
  const { isEnglish } = useAppLanguage();
  const { authUser, authLoading } = useAuthUser();
  const [selectedInviteId, setSelectedInviteId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [profileInviteId, setProfileInviteId] = useState<string | null>(null);
  const { pendingInvites, respondToInvite, currentParticipant } = useChatPageState({
    authLoading,
    authUser,
    isEnglish,
  });
  const { vacancies } = useVacancyFeed(
    authUser?.role === "candidate" ? `vacancy-feed:${authUser.id}` : "vacancy-feed:guest",
  );
  const selectedInvite = useMemo(
    () => pendingInvites.find((invite) => invite.id === selectedInviteId) ?? pendingInvites[0] ?? null,
    [pendingInvites, selectedInviteId],
  );
  const profileInvite =
    pendingInvites.find((invite) => invite.id === profileInviteId) ?? selectedInvite;
  const selectedJob = vacancies.find((job) => job.id === selectedJobId) ?? null;

  if (authLoading || !authUser || authUser.role !== "candidate" || !currentParticipant) {
    return <GlobalLoadingScreen />;
  }

  return (
    <RoleRouteGuard allowedRole="candidate">
      <main className={`min-h-screen px-5 py-10 ${isDark ? "vacancies-shell text-[#eef6ff]" : "vacancies-shell-light text-slate-900"} ${themeReady ? "" : "invisible"}`}>
        <div className="mx-auto max-w-6xl space-y-6">
          <MiniPageNav isDark={isDark} onToggleTheme={toggleTheme} />

          <section className={isDark ? "rounded-[1.8rem] border border-emerald-300/16 bg-emerald-400/10 p-6" : "rounded-[1.8rem] border border-emerald-300 bg-emerald-50 p-6"}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200" : "text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700"}>
                  {isEnglish ? "Company offers" : "Ofertas de empresas"}
                </p>
                <h1 className={isDark ? "mt-2 text-3xl font-semibold text-white" : "mt-2 text-3xl font-semibold text-slate-950"}>
                  {isEnglish ? "Process invitations" : "Invitaciones a proceso"}
                </h1>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
                <Handshake className="h-4 w-4" />
                {pendingInvites.length}
              </span>
            </div>
          </section>

          {pendingInvites.length === 0 ? (
            <section className={isDark ? "rounded-[1.6rem] border border-white/8 bg-white/4 p-6 text-slate-300" : "rounded-[1.6rem] border border-slate-300 bg-white p-6 text-slate-700"}>
              {isEnglish ? "You do not have pending company offers." : "No tienes ofertas pendientes de empresas."}
            </section>
          ) : (
            <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="space-y-3">
                {pendingInvites.map((invite) => (
                  <button
                    key={invite.id}
                    type="button"
                    onClick={() => setSelectedInviteId(invite.id)}
                    className={`w-full rounded-[1.2rem] border p-4 text-left transition ${
                      invite.id === selectedInvite?.id
                        ? isDark
                          ? "border-emerald-300/28 bg-emerald-400/12"
                          : "border-emerald-400 bg-emerald-50"
                        : isDark
                          ? "border-white/8 bg-white/4"
                          : "border-slate-300 bg-white"
                    }`}
                  >
                    <p className={isDark ? "font-semibold text-white" : "font-semibold text-slate-950"}>
                      {invite.companyName}
                    </p>
                    <p className={isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-600"}>
                      {invite.jobTitle}
                    </p>
                  </button>
                ))}
              </aside>

              {selectedInvite ? (
                <article className={isDark ? "rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "rounded-[1.6rem] border border-slate-300 bg-white p-5"}>
                  <p className={isDark ? "text-xl font-semibold text-white" : "text-xl font-semibold text-slate-950"}>
                    {selectedInvite.jobTitle}
                  </p>
                  <p className={isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-600"}>
                    {selectedInvite.companyName}
                  </p>
                  <p className={isDark ? "mt-5 whitespace-pre-line text-sm leading-7 text-slate-200" : "mt-5 whitespace-pre-line text-sm leading-7 text-slate-700"}>
                    {selectedInvite.messageTemplatePreview}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void respondToInvite(selectedInvite.id, "accept")}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      <Check className="h-4 w-4" />
                      {isEnglish ? "Accept" : "Aceptar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void respondToInvite(selectedInvite.id, "reject")}
                      className={isDark ? "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-semibold text-slate-100" : "inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"}
                    >
                      <X className="h-4 w-4" />
                      {isEnglish ? "Reject" : "Rechazar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedJobId(selectedInvite.jobId)}
                      className={isDark ? "inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2.5 text-sm font-semibold text-cyan-100" : "inline-flex items-center gap-2 rounded-full border border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700"}
                    >
                      <FileText className="h-4 w-4" />
                      {isEnglish ? "Show offer" : "Mostrar oferta"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileInviteId(selectedInvite.id)}
                      className={isDark ? "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-semibold text-slate-100" : "inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"}
                    >
                      <UserRound className="h-4 w-4" />
                      {isEnglish ? "Company profile" : "Perfil empresa"}
                    </button>
                  </div>
                </article>
              ) : null}
            </section>
          )}
        </div>

        <ApplicationVacancyPreviewModal
          open={Boolean(selectedJob)}
          isDark={isDark}
          isEnglish={isEnglish}
          selectedJob={selectedJob}
          onClose={() => setSelectedJobId(null)}
        />

        {profileInviteId && profileInvite ? (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/60 px-4" onClick={() => setProfileInviteId(null)}>
            <div className={isDark ? "w-full max-w-md rounded-[1.4rem] border border-white/10 bg-[#081120] p-5" : "w-full max-w-md rounded-[1.4rem] border border-slate-300 bg-white p-5"} onClick={(event) => event.stopPropagation()}>
              <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200" : "text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"}>
                {isEnglish ? "Company profile" : "Perfil empresa"}
              </p>
              <h2 className={isDark ? "mt-2 text-xl font-semibold text-white" : "mt-2 text-xl font-semibold text-slate-950"}>
                {profileInvite.companyName}
              </h2>
              <p className={isDark ? "mt-3 text-sm leading-6 text-slate-300" : "mt-3 text-sm leading-6 text-slate-700"}>
                {isEnglish
                  ? `Hiring for ${profileInvite.jobTitle}.`
                  : `Está contratando para ${profileInvite.jobTitle}.`}
              </p>
              <button
                type="button"
                onClick={() => setProfileInviteId(null)}
                className="mt-5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                {isEnglish ? "Close" : "Cerrar"}
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </RoleRouteGuard>
  );
}
