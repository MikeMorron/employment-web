import type { ReactNode } from "react";

type TagPillTone = "sky" | "amber" | "neutral" | "match";

const toneClassNames: Record<TagPillTone, string> = {
  sky: "border-cyan-300/35 bg-[linear-gradient(180deg,rgba(224,242,254,0.95),rgba(240,249,255,0.95))] text-sky-800 shadow-[0_10px_22px_rgba(14,165,233,0.08)] transition duration-200 hover:border-red-300 hover:bg-[linear-gradient(180deg,rgba(254,242,242,0.95),rgba(255,241,242,0.95))] hover:text-red-700 hover:shadow-[0_12px_26px_rgba(239,68,68,0.10)]",
  amber:
    "border-amber-300/50 bg-[linear-gradient(180deg,rgba(255,247,237,0.95),rgba(255,251,235,0.95))] text-amber-800 shadow-[0_10px_22px_rgba(245,158,11,0.08)] transition duration-200 hover:border-red-300 hover:bg-[linear-gradient(180deg,rgba(254,242,242,0.95),rgba(255,241,242,0.95))] hover:text-red-700 hover:shadow-[0_12px_26px_rgba(239,68,68,0.10)]",
  neutral:
    "border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] text-slate-700 shadow-[0_10px_22px_rgba(148,163,184,0.08)] transition duration-200 hover:border-red-300 hover:bg-[linear-gradient(180deg,rgba(254,242,242,0.98),rgba(255,241,242,0.96))] hover:text-red-700 hover:shadow-[0_12px_26px_rgba(239,68,68,0.10)]",
  match: "",
};

const darkMatchClassName =
  "border-cyan-300/24 bg-[linear-gradient(180deg,rgba(9,25,49,0.96),rgba(7,18,35,0.96))] text-cyan-100 shadow-[0_14px_30px_rgba(8,47,73,0.24)] transition duration-200 hover:border-sky-300/60 hover:bg-[linear-gradient(180deg,rgba(11,37,73,0.98),rgba(8,25,48,0.98))] hover:text-white hover:shadow-[0_18px_36px_rgba(13,99,255,0.28)]";

const lightMatchClassName =
  "border-sky-200 bg-[linear-gradient(180deg,rgba(239,249,255,0.98),rgba(255,248,240,0.96))] text-slate-700 shadow-[0_10px_22px_rgba(59,130,246,0.08)] transition duration-200 hover:border-[#ff5a67]/45 hover:bg-[linear-gradient(180deg,rgba(255,240,242,0.98),rgba(255,247,237,0.96))] hover:text-red-700 hover:shadow-[0_12px_26px_rgba(239,68,68,0.10)]";

export function TagPill({
  children,
  tone = "sky",
  isDark = false,
  className = "",
  action,
}: {
  children: ReactNode;
  tone?: TagPillTone;
  isDark?: boolean;
  className?: string;
  action?: ReactNode;
}) {
  const toneClassName =
    tone === "match" ? (isDark ? darkMatchClassName : lightMatchClassName) : toneClassNames[tone];

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium ${toneClassName} ${className}`}
    >
      <span>{children}</span>
      {action}
    </span>
  );
}
