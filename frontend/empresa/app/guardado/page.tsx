"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FolderHeart } from "lucide-react";
import { RoleRouteGuard } from "@/compartido/components/role/role-route-guard";
import { useAuthUser } from "@/compartido/hooks/use-auth-user";
import { useCompanyFavoriteCandidates } from "@/compartido/hooks/use-company-favorite-candidates";
import { useVacancyTheme } from "@/compartido/theme/use-vacancy-theme";
import { CompanyDashboardShell } from "@/frontend/empresa/components/system/company-dashboard-shell";
import { useCompanyCandidates } from "@/frontend/empresa/hooks/use-company-candidates";

export default function GuardadoEmpresaPage() {
  const { isDark, toggleTheme } = useVacancyTheme();
  const { authUser } = useAuthUser();
  const company = authUser?.role === "company" ? authUser : null;
  const candidates = useCompanyCandidates(company?.id);
  const { favoriteCandidateIds } = useCompanyFavoriteCandidates();

  const favorites = useMemo(
    () => candidates.filter((candidate) => favoriteCandidateIds.includes(candidate.id)),
    [candidates, favoriteCandidateIds],
  );

  return (
    <RoleRouteGuard allowedRole="company">
      <CompanyDashboardShell isDark={isDark} onToggleTheme={toggleTheme} title="Guardado" description="Candidatos marcados como favoritos por tu equipo.">
        <section className={isDark ? "rounded-[1.7rem] border border-white/8 bg-white/4 p-5" : "rounded-[1.7rem] border border-slate-200 bg-white p-5"}>
          <div className="flex items-center gap-3">
            <FolderHeart className={isDark ? "h-5 w-5 text-cyan-200" : "h-5 w-5 text-sky-700"} />
            <h2 className={isDark ? "text-xl font-semibold text-white" : "text-xl font-semibold text-slate-950"}>{favorites.length} perfiles guardados</h2>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {favorites.map((candidate) => (
              <article key={candidate.id} className={isDark ? "rounded-[1.4rem] border border-white/8 bg-white/3 p-4" : "rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4"}>
                <p className={isDark ? "text-lg font-semibold text-white" : "text-lg font-semibold text-slate-950"}>{candidate.nombre}</p>
                <p className={isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-600"}>{candidate.rol}</p>
                <Link href={`/perfil?preview=${encodeURIComponent(candidate.id)}`} className="mt-4 inline-flex rounded-[1rem] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                  Ver perfil
                </Link>
              </article>
            ))}
            {favorites.length === 0 ? (
              <div className={isDark ? "rounded-[1.4rem] border border-white/8 bg-white/3 p-5 text-sm text-slate-300" : "rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600"}>
                No hay candidatos guardados todavía.
              </div>
            ) : null}
          </div>
        </section>
      </CompanyDashboardShell>
    </RoleRouteGuard>
  );
}
