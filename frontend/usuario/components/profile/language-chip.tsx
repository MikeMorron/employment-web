import Image from "next/image";
import { getLanguageFlagIconSrc } from "@/data/derived/language-flags";

export function LanguageChip({
  name,
  level,
  isDark,
  removable = false,
  onRemove,
}: {
  name: string;
  level: string;
  isDark: boolean;
  removable?: boolean;
  onRemove?: () => void;
}) {
  const className = removable
    ? isDark
      ? "inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-white/6 px-3 py-2 text-sm font-medium text-cyan-100 transition hover:border-rose-300/30 hover:bg-rose-500/10 hover:text-rose-100"
      : "inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-2 text-sm font-medium text-sky-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
    : isDark
      ? "inline-flex items-center gap-2 rounded-full border border-cyan-300/16 bg-white/6 px-3 py-2 text-sm font-medium text-slate-100"
      : "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700";

  const content = (
    <>
      <Image
        src={getLanguageFlagIconSrc(name)}
        alt={`Bandera ${name}`}
        width={20}
        height={16}
        unoptimized
        className="h-4 w-5 rounded-[0.28rem] object-cover shadow-[0_0_0_1px_rgba(148,163,184,0.22)]"
      />
      <span>{name} · {level}</span>
      {removable ? <span className="text-xs font-semibold">x</span> : null}
    </>
  );

  if (!removable) {
    return <span className={className}>{content}</span>;
  }

  return (
    <button type="button" onClick={onRemove} className={className}>
      {content}
    </button>
  );
}
