"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Monitor, Palette, Save, UserCog, Wrench } from "lucide-react";
import { RoleRouteGuard } from "@/compartido/components/role/role-route-guard";
import { useAuthUser } from "@/compartido/hooks/use-auth-user";
import { useAppLanguage } from "@/compartido/hooks/use-app-language";
import { useVacancyTheme } from "@/compartido/theme/use-vacancy-theme";
import { apiRequest } from "@/compartido/lib/api";
import { LanguageSwitcher } from "@/app/ajustes/_components/language-switcher";
import { CompanyDashboardShell } from "@/frontend/empresa/components/system/company-dashboard-shell";

type SettingsSectionId =
  | "profile"
  | "account"
  | "appearance"
  | "notifications"
  | "display";

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

type CompanySettingsResponse = {
  ok: boolean;
  chatAutoMessage?: string;
  billingHistory?: Array<{ id: string; description: string; amountCop: number; paidAt: string }>;
};

const SETTINGS_SECTIONS: Array<{
  id: SettingsSectionId;
  title: string;
  desc: string;
  icon: typeof UserCog;
}> = [
  {
    id: "profile",
    title: "Perfil",
    desc: "Cómo se ve tu empresa dentro de TalentSyncro.",
    icon: UserCog,
  },
  {
    id: "account",
    title: "Cuenta",
    desc: "Idioma, mensaje automático y datos base de la cuenta.",
    icon: Wrench,
  },
  {
    id: "appearance",
    title: "Apariencia",
    desc: "Preferencias visuales del dashboard.",
    icon: Palette,
  },
  {
    id: "notifications",
    title: "Notificaciones",
    desc: "Preferencias internas para reclutamiento y seguimiento.",
    icon: Bell,
  },
  {
    id: "display",
    title: "Display",
    desc: "Opciones visuales de lectura y organización.",
    icon: Monitor,
  },
];

function SidebarNav({
  isDark,
  activeSection,
  onSelect,
}: {
  isDark: boolean;
  activeSection: SettingsSectionId;
  onSelect: (id: SettingsSectionId) => void;
}) {
  return (
    <aside className="lg:w-1/4">
      <div className={isDark ? "rounded-[1.5rem] border border-white/8 bg-white/4 p-3" : "rounded-[1.5rem] border border-slate-200 bg-white p-3"}>
        <nav className="space-y-1.5">
          {SETTINGS_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(section.id)}
              className={
                activeSection === section.id
                  ? isDark
                    ? "flex w-full items-center gap-3 rounded-[1rem] border border-cyan-300/16 bg-cyan-300/10 px-4 py-3 text-left text-sm font-semibold text-cyan-100"
                    : "flex w-full items-center gap-3 rounded-[1rem] border border-sky-300 bg-sky-50 px-4 py-3 text-left text-sm font-semibold text-sky-700"
                  : isDark
                    ? "flex w-full items-center gap-3 rounded-[1rem] border border-transparent px-4 py-3 text-left text-sm text-slate-300 transition hover:border-white/8 hover:bg-white/4 hover:text-white"
                    : "flex w-full items-center gap-3 rounded-[1rem] border border-transparent px-4 py-3 text-left text-sm text-slate-700 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950"
              }
            >
              <section.icon className="h-5 w-5" />
              <span>{section.title}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}

function ContentSection({
  isDark,
  title,
  desc,
  children,
}: {
  isDark: boolean;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className={isDark ? "rounded-[1.6rem] border border-white/8 bg-white/4 p-5" : "rounded-[1.6rem] border border-slate-200 bg-white p-5"}>
      <div>
        <h2 className={isDark ? "text-xl font-semibold text-white" : "text-xl font-semibold text-slate-950"}>
          {title}
        </h2>
        <p className={isDark ? "mt-2 text-sm text-slate-300" : "mt-2 text-sm text-slate-600"}>
          {desc}
        </p>
      </div>
      <div className={isDark ? "my-4 h-px bg-white/8" : "my-4 h-px bg-slate-200"} />
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function AjustesEmpresaPage() {
  const { isDark, toggleTheme } = useVacancyTheme();
  const { language, setLanguage } = useAppLanguage();
  const { authUser, refreshUser } = useAuthUser();
  const companyUser = authUser?.role === "company" ? authUser : null;
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("profile");
  const [chatAutoMessage, setChatAutoMessage] = useState("");
  const [billingHistory, setBillingHistory] = useState<Array<{ id: string; description: string; amountCop: number; paidAt: string }>>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [compactCards, setCompactCards] = useState(false);
  const [showPipelineHints, setShowPipelineHints] = useState(true);
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

  const resetFormFromUser = () => {
    if (!companyUser) {
      return;
    }

    setForm({
      companyName: companyUser.companyName ?? "",
      industry: companyUser.industry ?? "",
      companySize: companyUser.companySize ?? "",
      companyLocation: companyUser.companyLocation ?? "",
      companyWebsite: companyUser.companyWebsite ?? "",
      companyDescription: companyUser.companyDescription ?? "",
      companyMission: companyUser.companyMission ?? "",
      companyVision: companyUser.companyVision ?? "",
    });
  };

  useEffect(() => {
    const run = async () => {
      const response = await apiRequest<CompanySettingsResponse>("/api/company/preferences");
      if (response.ok) {
        setChatAutoMessage(response.data?.chatAutoMessage ?? "");
        setBillingHistory(response.data?.billingHistory ?? []);
      }
    };

    void run();
  }, []);

  const activeMeta = useMemo(
    () => SETTINGS_SECTIONS.find((section) => section.id === activeSection) ?? SETTINGS_SECTIONS[0],
    [activeSection],
  );

  const saveProfile = async () => {
    const response = await apiRequest<{ ok: boolean; message?: string }>("/api/profile/me", {
      method: "PATCH",
      body: JSON.stringify(form),
    });

    if (response.ok) {
      await refreshUser();
      resetFormFromUser();
      setNotice("Perfil actualizado.");
      return;
    }

    setNotice(response.data?.message ?? "No se pudo actualizar el perfil.");
  };

  const saveAccountSettings = async () => {
    const response = await apiRequest<{ ok: boolean; message?: string }>("/api/company/preferences", {
      method: "PATCH",
      body: JSON.stringify({ chatAutoMessage }),
    });

    setNotice(response.ok ? "Ajustes guardados." : response.data?.message ?? "No se pudieron guardar los ajustes.");
  };

  return (
    <RoleRouteGuard allowedRole="company">
      <CompanyDashboardShell
        isDark={isDark}
        onToggleTheme={toggleTheme}
        title="Ajustes"
        description="Sistema de ajustes de empresa con navegación lateral, inspirado en el dashboard de referencia."
      >
        {notice ? (
          <div className={isDark ? "rounded-[1rem] border border-cyan-300/18 bg-cyan-300/8 px-4 py-3 text-sm text-cyan-100" : "rounded-[1rem] border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-700"}>
            {notice}
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <SidebarNav isDark={isDark} activeSection={activeSection} onSelect={setActiveSection} />

          <div className="space-y-5">
            <ContentSection isDark={isDark} title={activeMeta.title} desc={activeMeta.desc}>
              {activeSection === "profile" ? (
                <>
                  <div className="grid gap-4 xl:grid-cols-2">
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
                  </div>
                  <label className={isDark ? "grid gap-2 text-sm text-slate-200" : "grid gap-2 text-sm text-slate-700"}>
                    <span>Descripción</span>
                    <textarea value={form.companyDescription} onChange={(event) => setForm((current) => ({ ...current, companyDescription: event.target.value }))} rows={5} className="rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none" />
                  </label>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <label className={isDark ? "grid gap-2 text-sm text-slate-200" : "grid gap-2 text-sm text-slate-700"}>
                      <span>Misión</span>
                      <textarea value={form.companyMission} onChange={(event) => setForm((current) => ({ ...current, companyMission: event.target.value }))} rows={4} className="rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none" />
                    </label>
                    <label className={isDark ? "grid gap-2 text-sm text-slate-200" : "grid gap-2 text-sm text-slate-700"}>
                      <span>Visión</span>
                      <textarea value={form.companyVision} onChange={(event) => setForm((current) => ({ ...current, companyVision: event.target.value }))} rows={4} className="rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none" />
                    </label>
                  </div>
                  <button type="button" onClick={() => void saveProfile()} className="inline-flex items-center gap-2 rounded-[1rem] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                    <Save className="h-4 w-4" />
                    Guardar perfil
                  </button>
                </>
              ) : null}

              {activeSection === "account" ? (
                <>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <article className={isDark ? "rounded-[1.2rem] border border-white/8 bg-white/4 p-4" : "rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4"}>
                      <p className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>Idioma</p>
                      <div className="mt-4">
                        <LanguageSwitcher isDark={isDark} language={language} onSetLanguage={setLanguage} />
                      </div>
                    </article>
                    <article className={isDark ? "rounded-[1.2rem] border border-white/8 bg-white/4 p-4" : "rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4"}>
                      <p className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>Cuenta</p>
                      <p className={isDark ? "mt-3 text-sm text-slate-300" : "mt-3 text-sm text-slate-600"}>
                        {companyUser?.companyName} · {companyUser?.email}
                      </p>
                    </article>
                  </div>
                  <label className={isDark ? "grid gap-2 text-sm text-slate-200" : "grid gap-2 text-sm text-slate-700"}>
                    <span>Mensaje automático para invitaciones</span>
                    <textarea value={chatAutoMessage} onChange={(event) => setChatAutoMessage(event.target.value)} rows={6} className="rounded-[1rem] border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none" />
                  </label>
                  <button type="button" onClick={() => void saveAccountSettings()} className="inline-flex items-center gap-2 rounded-[1rem] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                    <Save className="h-4 w-4" />
                    Guardar ajustes
                  </button>
                </>
              ) : null}

              {activeSection === "appearance" ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  <article className={isDark ? "rounded-[1.2rem] border border-white/8 bg-white/4 p-4" : "rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4"}>
                    <p className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>Tema</p>
                    <p className={isDark ? "mt-2 text-sm text-slate-300" : "mt-2 text-sm text-slate-600"}>Usa el selector del menú para alternar entre modo claro y oscuro.</p>
                  </article>
                  <article className={isDark ? "rounded-[1.2rem] border border-white/8 bg-white/4 p-4" : "rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4"}>
                    <p className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>Estilo</p>
                    <p className={isDark ? "mt-2 text-sm text-slate-300" : "mt-2 text-sm text-slate-600"}>Este panel ya quedó integrado al nuevo sistema visual del dashboard de empresa.</p>
                  </article>
                </div>
              ) : null}

              {activeSection === "notifications" ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  <label className={isDark ? "flex items-center justify-between rounded-[1.2rem] border border-white/8 bg-white/4 p-4 text-sm text-slate-200" : "flex items-center justify-between rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"}>
                    <span>Alertas por correo</span>
                    <input type="checkbox" checked={emailNotifications} onChange={(event) => setEmailNotifications(event.target.checked)} />
                  </label>
                  <label className={isDark ? "flex items-center justify-between rounded-[1.2rem] border border-white/8 bg-white/4 p-4 text-sm text-slate-200" : "flex items-center justify-between rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"}>
                    <span>Alertas push</span>
                    <input type="checkbox" checked={pushNotifications} onChange={(event) => setPushNotifications(event.target.checked)} />
                  </label>
                  <article className={isDark ? "rounded-[1.2rem] border border-white/8 bg-white/4 p-4 xl:col-span-2" : "rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4 xl:col-span-2"}>
                    <p className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>Facturación</p>
                    <div className="mt-3 space-y-3">
                      {billingHistory.map((entry) => (
                        <div key={entry.id} className={isDark ? "rounded-[1rem] border border-white/8 bg-white/3 p-4" : "rounded-[1rem] border border-slate-200 bg-white p-4"}>
                          <p className={isDark ? "text-sm font-medium text-white" : "text-sm font-medium text-slate-950"}>{entry.description}</p>
                          <p className={isDark ? "mt-1 text-xs text-slate-400" : "mt-1 text-xs text-slate-500"}>${entry.amountCop.toLocaleString("es-CO")} · {new Date(entry.paidAt).toLocaleDateString("es-CO")}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              ) : null}

              {activeSection === "display" ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  <label className={isDark ? "flex items-center justify-between rounded-[1.2rem] border border-white/8 bg-white/4 p-4 text-sm text-slate-200" : "flex items-center justify-between rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"}>
                    <span>Tarjetas compactas</span>
                    <input type="checkbox" checked={compactCards} onChange={(event) => setCompactCards(event.target.checked)} />
                  </label>
                  <label className={isDark ? "flex items-center justify-between rounded-[1.2rem] border border-white/8 bg-white/4 p-4 text-sm text-slate-200" : "flex items-center justify-between rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"}>
                    <span>Ayudas visuales del pipeline</span>
                    <input type="checkbox" checked={showPipelineHints} onChange={(event) => setShowPipelineHints(event.target.checked)} />
                  </label>
                </div>
              ) : null}
            </ContentSection>
          </div>
        </div>
      </CompanyDashboardShell>
    </RoleRouteGuard>
  );
}
