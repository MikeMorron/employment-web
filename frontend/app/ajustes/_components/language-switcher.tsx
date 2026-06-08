"use client";

function FlagEs({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" aria-hidden="true" className={className}>
      <rect width="36" height="24" fill="#fcd116" />
      <rect y="12" width="36" height="6" fill="#003893" />
      <rect y="18" width="36" height="6" fill="#ce1126" />
    </svg>
  );
}

function FlagEn({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" aria-hidden="true" className={className}>
      <rect width="36" height="24" fill="#012169" />
      <path d="M0 0 36 24M36 0 0 24" stroke="#fff" strokeWidth="4" />
      <path d="M0 0 36 24M36 0 0 24" stroke="#c8102e" strokeWidth="2" />
      <path d="M18 0v24M0 12h36" stroke="#fff" strokeWidth="6" />
      <path d="M18 0v24M0 12h36" stroke="#c8102e" strokeWidth="3.5" />
    </svg>
  );
}

interface LanguageSwitcherProps {
  isDark: boolean;
  language: string;
  onSetLanguage: (lang: "es" | "en") => void;
}

export function LanguageSwitcher({ isDark, language, onSetLanguage }: LanguageSwitcherProps) {
  return (
    <div
      className={
        isDark
          ? "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 p-1"
          : "inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/90 p-1 shadow-[0_10px_24px_rgba(148,163,184,0.12)]"
      }
    >
      <button
        type="button"
        onClick={() => onSetLanguage("es")}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
          language === "es"
            ? isDark
              ? "bg-white text-slate-950"
              : "bg-slate-900 text-white"
            : isDark
              ? "text-slate-200 hover:bg-white/8"
              : "text-slate-700 hover:bg-slate-50"
        }`}
      >
        <FlagEs className="h-3.5 w-3.5" />
        ES
      </button>
      <button
        type="button"
        onClick={() => onSetLanguage("en")}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
          language === "en"
            ? isDark
              ? "bg-white text-slate-950"
              : "bg-slate-900 text-white"
            : isDark
              ? "text-slate-200 hover:bg-white/8"
              : "text-slate-700 hover:bg-slate-50"
        }`}
      >
        <FlagEn className="h-3.5 w-3.5" />
        EN
      </button>
    </div>
  );
}
