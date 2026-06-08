"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, BriefcaseBusiness, CircleUserRound, FolderHeart, Languages, LogOut, MessageSquareMore, Moon, Search, Settings2, Sun, Target, Users } from "lucide-react";
import { InlineConfirm } from "@/compartido/components/ui/inline-confirm";
import { useAppLanguage } from "@/compartido/hooks/use-app-language";
import { useAuthUser } from "@/compartido/hooks/use-auth-user";

type ShellProps = {
  isDark: boolean;
  onToggleTheme: () => void;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

type NavItem = {
  label: string;
  href: string;
  icon: typeof BarChart3;
};

export const COMPANY_NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "General",
    items: [
      { label: "Dashboard", href: "/analytics", icon: BarChart3 },
      { label: "Encontrar talento", href: "/vacantes", icon: Users },
      { label: "Administrar vacantes", href: "/publicadas", icon: BriefcaseBusiness },
      { label: "Candidatos", href: "/candidatos", icon: Target },
      { label: "Chats", href: "/chat", icon: MessageSquareMore },
    ],
  },
  {
    title: "Páginas",
    items: [
      { label: "Guardado", href: "/guardado", icon: FolderHeart },
      { label: "Perfil", href: "/perfil", icon: CircleUserRound },
      { label: "Ajustes", href: "/ajustes", icon: Settings2 },
    ],
  },
];

function NavGroup({ isDark, title, items, pathname, onNavigate }: { isDark: boolean; title: string; items: NavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <div>
      <p className={isDark ? "px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500" : "px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400"}>
        {title}
      </p>
      <div className="mt-2 space-y-1.5">
        {items.map((item) => {
          const active = item.href !== "#" && pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={
                active
                  ? isDark
                    ? "flex items-center gap-3 rounded-[1rem] border border-cyan-300/16 bg-cyan-300/10 px-3 py-2.5 text-sm font-semibold text-cyan-100"
                    : "flex items-center gap-3 rounded-[1rem] border border-sky-300 bg-sky-50 px-3 py-2.5 text-sm font-semibold text-sky-700"
                  : isDark
                    ? "flex items-center gap-3 rounded-[1rem] border border-transparent px-3 py-2.5 text-sm text-slate-300 transition hover:border-white/8 hover:bg-white/4 hover:text-white"
                    : "flex items-center gap-3 rounded-[1rem] border border-transparent px-3 py-2.5 text-sm text-slate-700 transition hover:border-slate-200 hover:bg-white hover:text-slate-950"
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function CompanySidebarContent({
  isDark,
  onToggleTheme,
  onNavigate,
}: {
  isDark: boolean;
  onToggleTheme: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { language, setLanguage } = useAppLanguage();
  const { signOut } = useAuthUser();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  return (
    <div className="space-y-5">
      {COMPANY_NAV_GROUPS.map((group) => (
        <NavGroup key={group.title} isDark={isDark} title={group.title} items={group.items} pathname={pathname} onNavigate={onNavigate} />
      ))}

      <div>
        <p className={isDark ? "px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500" : "px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400"}>
          Accesibilidad
        </p>
        <div className="mt-2 space-y-1.5">
          <button
            type="button"
            onClick={() => void setLanguage(language === "es" ? "en" : "es")}
            className={isDark ? "flex w-full items-center gap-3 rounded-[1rem] border border-transparent px-3 py-2.5 text-sm text-slate-300 transition hover:border-white/8 hover:bg-white/4 hover:text-white" : "flex w-full items-center gap-3 rounded-[1rem] border border-transparent px-3 py-2.5 text-sm text-slate-700 transition hover:border-slate-200 hover:bg-white hover:text-slate-950"}
          >
            <Languages className="h-4 w-4" />
            Idioma: {language.toUpperCase()}
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className={isDark ? "flex w-full items-center gap-3 rounded-[1rem] border border-transparent px-3 py-2.5 text-sm text-slate-300 transition hover:border-white/8 hover:bg-white/4 hover:text-white" : "flex w-full items-center gap-3 rounded-[1rem] border border-transparent px-3 py-2.5 text-sm text-slate-700 transition hover:border-slate-200 hover:bg-white hover:text-slate-950"}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Tema: {isDark ? "Dark" : "Light"}
          </button>
        </div>
      </div>

      <div>
        <p className={isDark ? "px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500" : "px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400"}>
          Sesión
        </p>
        <div className="mt-2 space-y-1.5">
          {logoutConfirmOpen ? (
            <div className={isDark ? "rounded-[1rem] border border-white/8 bg-white/4 px-3 py-3 text-slate-100" : "rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3 text-slate-900"}>
              <InlineConfirm
                message="Cerrar sesión?"
                confirmLabel="Sí"
                cancelLabel="No"
                onConfirm={async () => {
                  setLogoutConfirmOpen(false);
                  onNavigate?.();
                  await signOut();
                }}
                onCancel={() => setLogoutConfirmOpen(false)}
                className="text-left"
                confirmClassName="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition duration-300 hover:bg-red-700"
                cancelClassName={isDark ? "rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold text-slate-100 transition duration-300 hover:bg-white/10" : "rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition duration-300 hover:bg-slate-100"}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setLogoutConfirmOpen(true)}
              className={isDark ? "flex w-full items-center gap-3 rounded-[1rem] border border-transparent px-3 py-2.5 text-sm text-slate-300 transition hover:border-white/8 hover:bg-white/4 hover:text-white" : "flex w-full items-center gap-3 rounded-[1rem] border border-transparent px-3 py-2.5 text-sm text-slate-700 transition hover:border-slate-200 hover:bg-white hover:text-slate-950"}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CompanyDashboardShell({ isDark, onToggleTheme, title, description, actions, children }: ShellProps) {
  return (
    <main className={`min-h-screen px-2 py-6 ${isDark ? "vacancies-shell text-[#eef6ff]" : "vacancies-shell-light text-slate-900"} sm:px-3 sm:py-8 lg:px-4`}>
      <div className="max-w-[1440px]">
        <div className="grid gap-5 xl:grid-cols-[272px_minmax(0,1fr)]">
          <aside className={isDark ? "h-fit rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,16,31,0.96),rgba(8,17,32,0.92))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)] xl:sticky xl:top-8" : "h-fit rounded-[1.8rem] border border-slate-200 bg-white/92 p-4 shadow-[0_18px_44px_rgba(148,163,184,0.12)] xl:sticky xl:top-8"}>
            <CompanySidebarContent isDark={isDark} onToggleTheme={onToggleTheme} />
          </aside>

          <section className="space-y-5">
            <section className={isDark ? "rounded-[1.8rem] border border-cyan-300/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[inset_0_1px_0_rgba(125,211,252,0.05)]" : "rounded-[1.8rem] border border-slate-300/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,252,0.94))] p-5 shadow-[0_18px_44px_rgba(148,163,184,0.10)]"}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h1 className={isDark ? "text-3xl font-semibold text-white" : "text-3xl font-semibold text-slate-950"}>
                    {title}
                  </h1>
                  {description ? (
                    <p className={isDark ? "mt-3 max-w-3xl text-sm leading-7 text-slate-300" : "mt-3 max-w-3xl text-sm leading-7 text-slate-600"}>
                      {description}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className={isDark ? "relative hidden md:block" : "relative hidden md:block"}>
                    <Search className={isDark ? "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200" : "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-700"} />
                    <input
                      readOnly
                      value=""
                      placeholder="Search"
                      className={isDark ? "h-11 w-44 rounded-[1rem] border border-cyan-300/18 bg-white/6 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-400" : "h-11 w-44 rounded-[1rem] border border-sky-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-500"}
                    />
                  </div>
                  {actions}
                </div>
              </div>
            </section>

            {children}
          </section>
        </div>
      </div>
    </main>
  );
}
