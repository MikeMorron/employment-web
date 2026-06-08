"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { RoleRouteGuard } from "@/compartido/components/role/role-route-guard";
import { useAuthUser } from "@/compartido/hooks/use-auth-user";
import { useVacancyTheme } from "@/compartido/theme/use-vacancy-theme";
import { apiRequest } from "@/compartido/lib/api";
import { CompanyDashboardShell } from "@/frontend/empresa/components/system/company-dashboard-shell";

type CompanyProfileForm = {
  companyName: string;
  industry: string;
  companySize: string;
  companyLocation: string;
  companyWebsite: string;
  companyDescription: string;
  companyMission: string;
  companyVision: string;
};

export default function PerfilEmpresaPage() {
  const { isDark, toggleTheme } = useVacancyTheme();
  const { authUser, refreshUser } = useAuthUser();
  const companyUser = authUser?.role === "company" ? authUser : null;
  const [form, setForm] = useState<CompanyProfileForm>(() => ({
    companyName: companyUser?.companyName ?? "",
    industry: companyUser?.industry ?? "",
    companySize: companyUser?.companySize ?? "",
    companyLocation: companyUser?.companyLocation ?? "",
    companyWebsite: companyUser?.companyWebsite ?? "",
    companyDescription: companyUser?.companyDescription ?? "",
    companyMission: companyUser?.companyMission ?? "",
    companyVision: companyUser?.companyVision ?? "",
  }));
  const [notice, setNotice] = useState<string | null>(null);

  const saveProfile = async () => {
    const response = await apiRequest<{ ok: boolean; message?: string }>("/api/profile/me", {
      method: "PATCH",
      body: JSON.stringify(form),
    });
    if (response.ok) {
      await refreshUser();
      setNotice("Perfil actualizado.");
      return;
    }
    setNotice(response.data?.message ?? "No se pudo actualizar el perfil.");
  };

  return (
    <RoleRouteGuard allowedRole="company">
      <CompanyDashboardShell isDark={isDark} onToggleTheme={toggleTheme} title="Perfil de empresa" description="Edita la información visible de tu empresa y su propuesta pública.">
        {notice ? (
          <div className={isDark ? "rounded-[1rem] border border-cyan-300/18 bg-cyan-300/8 px-4 py-3 text-sm text-cyan-100" : "rounded-[1rem] border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-700"}>
            {notice}
          </div>
        ) : null}
        <section className="grid gap-4 xl:grid-cols-2">
          {[
            { key: "companyName", label: "Nombre de empresa" },
            { key: "industry", label: "Industria" },
            { key: "companySize", label: "Tamaño" },
            { key: "companyLocation", label: "Ubicación" },
            { key: "companyWebsite", label: "Sitio web" },
          ].map((field) => (
            <label key={field.key} className={isDark ? "grid gap-2 text-sm text-slate-200" : "grid gap-2 text-sm text-slate-700"}>
              <span>{field.label}</span>
              <input
                value={form[field.key as keyof CompanyProfileForm] as string}
                onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                className="rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
              />
            </label>
          ))}
        </section>
        <label className={isDark ? "mt-5 grid gap-2 text-sm text-slate-200" : "mt-5 grid gap-2 text-sm text-slate-700"}>
          <span>Descripción</span>
          <textarea value={form.companyDescription} onChange={(event) => setForm((current) => ({ ...current, companyDescription: event.target.value }))} rows={5} className="rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none" />
        </label>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <label className={isDark ? "grid gap-2 text-sm text-slate-200" : "grid gap-2 text-sm text-slate-700"}>
            <span>Misión</span>
            <textarea value={form.companyMission} onChange={(event) => setForm((current) => ({ ...current, companyMission: event.target.value }))} rows={4} className="rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none" />
          </label>
          <label className={isDark ? "grid gap-2 text-sm text-slate-200" : "grid gap-2 text-sm text-slate-700"}>
            <span>Visión</span>
            <textarea value={form.companyVision} onChange={(event) => setForm((current) => ({ ...current, companyVision: event.target.value }))} rows={4} className="rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none" />
          </label>
        </div>
        <button type="button" onClick={() => void saveProfile()} className="mt-5 inline-flex items-center gap-2 rounded-[1rem] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
          <Save className="h-4 w-4" />
          Guardar perfil
        </button>
      </CompanyDashboardShell>
    </RoleRouteGuard>
  );
}
