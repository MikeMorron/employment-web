"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

export function EditCardToggleButton({
  isCollapsed,
  isDark,
  onClick,
}: {
  isCollapsed: boolean;
  isDark: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isCollapsed ? "Desplegar tarjeta" : "Plegar tarjeta"}
      title={isCollapsed ? "Desplegar" : "Plegar"}
      className={isDark
        ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/16 bg-white/6 text-cyan-100 transition hover:border-cyan-300/28 hover:bg-white/10"
        : "inline-flex h-10 w-10 items-center justify-center rounded-full border border-sky-200 bg-white text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"}
    >
      {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
    </button>
  );
}
