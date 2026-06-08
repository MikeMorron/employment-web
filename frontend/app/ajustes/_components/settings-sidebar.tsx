"use client";

interface SidebarSection {
  id: string;
  sidebar: string;
}

interface SettingsSidebarProps {
  isDark: boolean;
  sections: SidebarSection[];
  activeSection: string;
}

export function SettingsSidebar({ isDark, sections, activeSection }: SettingsSidebarProps) {
  return (
    <aside
      className={
        isDark
          ? "overflow-x-auto rounded-[1.3rem] border border-white/8 bg-white/[0.03] p-3 lg:h-fit lg:rounded-[1.8rem] lg:p-4 lg:sticky lg:top-6"
          : "overflow-x-auto rounded-[1.3rem] border border-slate-300 bg-white/88 p-3 shadow-[0_18px_40px_rgba(148,163,184,0.12)] lg:h-fit lg:rounded-[1.8rem] lg:p-4 lg:sticky lg:top-6"
      }
    >
      <div className="flex flex-wrap gap-2 lg:block lg:space-y-2 lg:gap-0">
        {sections.map((section) => {
          const active = activeSection === section.id;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`block min-w-0 rounded-[1rem] px-3.5 py-2.5 transition duration-300 lg:rounded-[1.1rem] lg:px-4 lg:py-3 ${
                active
                  ? isDark
                    ? "translate-x-1 border border-cyan-300/24 bg-[linear-gradient(90deg,rgba(34,211,238,0.16),rgba(59,130,246,0.1))] text-white shadow-[0_14px_32px_rgba(34,211,238,0.08)]"
                    : "translate-x-1 border border-sky-300 bg-[linear-gradient(90deg,rgba(224,242,254,0.96),rgba(239,246,255,0.92))] text-slate-950 shadow-[0_14px_32px_rgba(56,189,248,0.10)]"
                  : isDark
                    ? "border border-transparent bg-white/[0.02] text-slate-300 hover:border-white/8 hover:bg-white/[0.05]"
                    : "border border-transparent bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-white"
              }`}
            >
              <span className="text-sm font-semibold">{section.sidebar}</span>
            </a>
          );
        })}
      </div>
    </aside>
  );
}
