export function BackgroundEffects() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[10%] top-14 h-80 w-80 rounded-full bg-cyan-400/8 blur-3xl" />
      <div className="absolute right-[8%] top-24 h-72 w-72 rounded-full bg-sky-500/7 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-80 w-[32rem] rounded-full bg-teal-400/6 blur-3xl" />
      <div className="absolute inset-x-[8%] top-36 h-px bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent" />
      <div className="absolute left-[14%] top-[22%] h-2 w-2 rounded-full bg-cyan-300/40 shadow-[0_0_18px_rgba(103,232,249,0.32)]" />
      <div className="absolute right-[22%] top-[18%] h-1.5 w-1.5 rounded-full bg-sky-300/40 shadow-[0_0_16px_rgba(56,189,248,0.30)]" />
      <div className="absolute right-[16%] top-[52%] h-2 w-2 rounded-full bg-cyan-300/35 shadow-[0_0_18px_rgba(34,211,238,0.28)]" />
      <div className="absolute left-[22%] top-[64%] h-1.5 w-1.5 rounded-full bg-teal-300/35 shadow-[0_0_16px_rgba(45,212,191,0.26)]" />
    </div>
  );
}
