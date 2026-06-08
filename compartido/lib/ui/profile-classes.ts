export function getProfileUi(isDark: boolean) {
  return {
    card: isDark
      ? "rounded-[2rem] border border-cyan-300/22 bg-[linear-gradient(180deg,rgba(6,14,30,0.96),rgba(8,18,35,0.92))] shadow-[inset_0_1px_0_rgba(125,211,252,0.08),0_0_0_1px_rgba(71,214,255,0.04),0_28px_80px_rgba(1,8,20,0.52)] backdrop-blur-xl"
      : "rounded-[2rem] border border-sky-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(244,250,255,0.78))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_0_0_1px_rgba(56,189,248,0.04),0_28px_74px_rgba(148,163,184,0.14)] backdrop-blur-xl",
    sectionCard: isDark
      ? "rounded-[1.5rem] border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(8,24,48,0.9),rgba(8,18,35,0.78))] shadow-[inset_0_1px_0_rgba(125,211,252,0.05),0_18px_40px_rgba(0,0,0,0.22)]"
      : "rounded-[1.5rem] border border-sky-100/90 bg-[linear-gradient(180deg,rgba(248,252,255,0.98),rgba(240,248,255,0.94))] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_18px_40px_rgba(59,130,246,0.08)]",
    input: isDark
      ? "w-full rounded-[1.15rem] border border-cyan-300/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/42 focus:ring-4 focus:ring-cyan-400/10"
      : "w-full rounded-[1.15rem] border border-sky-100/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,251,255,0.94))] px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100",
    buttonPrimary:
      "inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#0d63ff] via-[#2563eb] to-[#12327a] text-sm font-semibold text-white shadow-[0_16px_36px_rgba(37,99,235,0.22)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_rgba(37,99,235,0.28)]",
    buttonSecondary: isDark
      ? "inline-flex items-center justify-center rounded-[1rem] border border-cyan-300/18 bg-white/[0.04] text-sm font-semibold text-slate-100 shadow-[0_14px_30px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/34 hover:bg-white/[0.08]"
      : "inline-flex items-center justify-center rounded-[1rem] border border-sky-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,249,255,0.94))] text-sm font-semibold text-slate-800 shadow-[0_14px_30px_rgba(59,130,246,0.10)] transition duration-300 hover:-translate-y-0.5 hover:border-[#0d63ff]/40 hover:bg-[linear-gradient(180deg,rgba(239,249,255,0.98),rgba(255,247,237,0.94))]",
    badge: isDark
      ? "rounded-full border border-cyan-300/24 bg-cyan-300/10 text-sm font-medium text-cyan-100 shadow-[0_10px_22px_rgba(34,211,238,0.08)]"
      : "rounded-full border border-amber-200 bg-[linear-gradient(180deg,rgba(255,251,235,0.98),rgba(255,255,255,0.94))] text-sm font-medium text-amber-800 shadow-[0_10px_22px_rgba(245,158,11,0.10)]",
  };
}
