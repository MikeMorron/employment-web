import { SlidersHorizontal } from "lucide-react";

export function FilterButton({
  activeCount,
  isOpen,
  onClick,
  isDark,
}: {
  activeCount: number;
  isOpen: boolean;
  onClick: () => void;
  isDark: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition duration-300 ${
        isDark
          ? isOpen
            ? "border-sky-300/38 bg-sky-400/16 text-cyan-50 shadow-[0_0_26px_rgba(34,211,238,0.14)]"
            : "border-sky-300/30 bg-sky-400/14 text-cyan-100 hover:border-sky-200/44 hover:bg-sky-400/20 hover:text-white hover:shadow-[0_0_22px_rgba(34,211,238,0.12)]"
          : isOpen
            ? "border-sky-400/40 bg-sky-100 text-sky-800 shadow-[0_10px_24px_rgba(56,189,248,0.16)]"
            : "border-sky-300/70 bg-white text-sky-700 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-800"
      }`}
    >
      <SlidersHorizontal className="h-4 w-4" />
      <span>Filtrar</span>
      {activeCount > 0 ? (
        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[#fcd116]/14 px-2 py-0.5 text-xs font-semibold text-[#fde68a]">
          {activeCount}
        </span>
      ) : null}
    </button>
  );
}
