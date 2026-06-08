"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bookmark, Building2, MessageSquareMore, Search, UserRound } from "lucide-react";
import { RoleRouteGuard } from "@/compartido/components/role/role-route-guard";
import { useAuthUser } from "@/compartido/hooks/use-auth-user";
import { useCompanyFavoriteCandidates } from "@/compartido/hooks/use-company-favorite-candidates";
import { useVacancyTheme } from "@/compartido/theme/use-vacancy-theme";
import { SKILLS_CATALOG } from "@/compartido/data/skills-catalog";
import { CompanyDashboardShell } from "@/frontend/empresa/components/system/company-dashboard-shell";
import { useCompanyUsers } from "@/frontend/empresa/hooks/use-company-users";
import { useCompanyChatDirectory } from "@/frontend/empresa/hooks/use-company-chat-directory";
import { apiRequest } from "@/compartido/lib/api";
import type { RegisteredUserPreview } from "@/compartido/types/admin";

export default function CandidatosPage() {
  const { isDark, toggleTheme } = useVacancyTheme();
  const { authUser } = useAuthUser();
  const company = authUser?.role === "company" ? authUser : null;
  const users = useCompanyUsers(company?.id);
  const { favoriteCandidateIds, pendingFavoriteIds, toggleFavoriteCandidate } = useCompanyFavoriteCandidates();
  const { companyCandidates: directory, refreshCompanyCandidates } = useCompanyChatDirectory(authUser);
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("");
  const [immediateOnly, setImmediateOnly] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((user) => (
      (!normalized || [user.nombre, user.headline, user.location, user.companyName, ...user.skills].join(" ").toLowerCase().includes(normalized)) &&
      (!skill || user.skills.includes(skill)) &&
      (!immediateOnly || user.availabilityStatus === "available_now")
    ));
  }, [immediateOnly, query, skill, users]);

  const invite = async (user: RegisteredUserPreview) => {
    if (user.role !== "candidate") {
      return;
    }

    const directoryItem = directory.find((item) => item.candidateId === user.id);
    const response = await apiRequest<{ ok: boolean; message?: string }>("/api/chat/invitations", {
      method: "POST",
      body: JSON.stringify({
        applicationId: directoryItem?.applicationId,
        candidateId: directoryItem ? undefined : user.id,
      }),
    });

    setNotice(response.ok ? `Invitación enviada a ${user.nombre}.` : response.data?.message ?? "No se pudo crear la invitación.");
    refreshCompanyCandidates();
  };

  return (
    <RoleRouteGuard allowedRole="company">
      <CompanyDashboardShell isDark={isDark} onToggleTheme={toggleTheme} title="Usuarios registrados" description="Explora candidatos y empresas ya registradas dentro de la plataforma.">
        {notice ? (
          <div className={isDark ? "rounded-[1rem] border border-cyan-300/18 bg-cyan-300/8 px-4 py-3 text-sm text-cyan-100" : "rounded-[1rem] border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-700"}>
            {notice}
          </div>
        ) : null}

        <section className={isDark ? "rounded-[1.7rem] border border-white/8 bg-white/4 p-5" : "rounded-[1.7rem] border border-slate-200 bg-white p-5"}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative xl:col-span-2">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por rol, empresa, skill o ciudad" className="w-full rounded-[1rem] border border-slate-300 bg-white px-11 py-3 text-sm text-slate-900 outline-none" />
            </div>
            <select value={skill} onChange={(event) => setSkill(event.target.value)} className="rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none">
              <option value="">Habilidad</option>
              {SKILLS_CATALOG.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <label className={isDark ? "mt-3 inline-flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/4 px-4 py-3 text-sm text-slate-100" : "mt-3 inline-flex items-center gap-3 rounded-[1rem] border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700"}>
            <input type="checkbox" checked={immediateOnly} onChange={(event) => setImmediateOnly(event.target.checked)} />
            Disponibilidad inmediata
          </label>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          {filtered.map((user) => (
            <article key={`${user.role}-${user.id}`} className={isDark ? "rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "rounded-[1.6rem] border border-slate-200 bg-white p-5"}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={isDark ? "flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/10 bg-white/4 text-cyan-100" : "flex h-11 w-11 items-center justify-center rounded-[1rem] border border-slate-200 bg-slate-50 text-sky-700"}>
                    {user.role === "company" ? <Building2 className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className={isDark ? "text-xl font-semibold text-white" : "text-xl font-semibold text-slate-950"}>{user.nombre}</h3>
                    <p className={isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-600"}>{user.headline}</p>
                  </div>
                </div>

                <span className={isDark ? "rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs font-semibold text-slate-200" : "rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"}>
                  {user.role === "company" ? "Empresa" : user.profileVisibility === "private" ? "Privado" : user.availabilityStatus === "available_now" ? "Disponible" : "Usuario"}
                </span>
              </div>
              <p className={isDark ? "mt-3 text-sm text-slate-300" : "mt-3 text-sm text-slate-700"}>
                {user.location || "Colombia"}{user.companyName ? ` · ${user.companyName}` : ""}{typeof user.publishedJobs === "number" ? ` · ${user.publishedJobs} vacantes publicadas` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {user.role === "candidate"
                  ? user.skills.slice(0, 6).map((item) => (
                      <span key={item} className={isDark ? "rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-slate-200" : "rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-700"}>
                        {item}
                      </span>
                    ))
                  : (
                    <span className={isDark ? "rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-slate-200" : "rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-700"}>
                      Plan {user.plan}
                    </span>
                  )}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                {user.role === "candidate" ? (
                  <button
                    type="button"
                    onClick={async () => {
                      const wasSaved = favoriteCandidateIds.includes(user.id);
                      const result = await toggleFavoriteCandidate(user.id);
                      setNotice(result === true ? `${wasSaved ? "Se quitó de guardado" : "Se guardó"} ${user.nombre}.` : typeof result === "string" ? result : "No se pudo actualizar el guardado.");
                    }}
                    className={
                      favoriteCandidateIds.includes(user.id)
                        ? isDark
                          ? "inline-flex items-center gap-2 rounded-[1rem] border border-amber-300/30 bg-amber-400/10 px-4 py-2.5 text-sm font-semibold text-amber-100"
                          : "inline-flex items-center gap-2 rounded-[1rem] border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800"
                        : isDark
                          ? "inline-flex items-center gap-2 rounded-[1rem] border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-semibold text-slate-100"
                          : "inline-flex items-center gap-2 rounded-[1rem] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                    }
                    disabled={pendingFavoriteIds.includes(user.id)}
                  >
                    <Bookmark className={`h-4 w-4 ${favoriteCandidateIds.includes(user.id) ? "fill-current" : ""}`} />
                    {pendingFavoriteIds.includes(user.id) ? "Guardando..." : favoriteCandidateIds.includes(user.id) ? "Guardado" : "Guardar"}
                  </button>
                ) : null}
                {user.role === "candidate" && user.previewProfileId ? (
                  <Link href={`/perfil?preview=${encodeURIComponent(user.previewProfileId)}`} className={isDark ? "inline-flex items-center rounded-[1rem] border border-white/10 bg-white/4 px-4 py-2.5 text-sm font-semibold text-slate-100" : "inline-flex items-center rounded-[1rem] border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"}>
                    Ver perfil
                  </Link>
                ) : null}
                {user.role === "candidate" && user.profileVisibility !== "private" ? (
                  <button type="button" onClick={() => void invite(user)} className="inline-flex items-center gap-2 rounded-[1rem] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                    <MessageSquareMore className="h-4 w-4" />
                    Invitar a proceso
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      </CompanyDashboardShell>
    </RoleRouteGuard>
  );
}
