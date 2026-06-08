"use client";

import { X } from "lucide-react";
import { CompanySidebarContent } from "@/frontend/empresa/components/system/company-dashboard-shell";

export function CompanyMenuSheet({
  open,
  isDark,
  onClose,
  onToggleTheme,
}: {
  open: boolean;
  isDark: boolean;
  onClose: () => void;
  onToggleTheme: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[190]">
      <button type="button" className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        className={
          isDark
            ? "company-menu-sheet absolute left-4 top-4 z-10 max-w-[calc(100vw-2rem)] rounded-[1.8rem] border border-white/8 bg-[linear-gradient(180deg,rgba(7,16,31,0.98),rgba(8,17,32,0.94))] p-4 shadow-[0_28px_90px_rgba(0,0,0,0.42)]"
            : "company-menu-sheet absolute left-4 top-4 z-10 max-w-[calc(100vw-2rem)] rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-[0_24px_70px_rgba(148,163,184,0.20)]"
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={isDark ? "text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500" : "text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400"}>
              Empresa
            </p>
            <p className={isDark ? "mt-2 text-lg font-semibold text-white" : "mt-2 text-lg font-semibold text-slate-950"}>
              Menú
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={
              isDark
                ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/4 text-slate-200 transition hover:bg-white/8 hover:text-white"
                : "inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-white hover:text-slate-950"
            }
            aria-label="Cerrar menú"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5">
          <CompanySidebarContent
            isDark={isDark}
            onToggleTheme={onToggleTheme}
            onNavigate={onClose}
          />
        </div>
      </aside>
    </div>
  );
}
