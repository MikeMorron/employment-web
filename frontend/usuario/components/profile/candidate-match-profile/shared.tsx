import type { ReactNode } from "react";

export function ReadOnlyDetail({
  label,
  value,
  isDark,
}: {
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <div
      className={`rounded-[1rem] border px-4 py-3 ${
        isDark ? "border-cyan-300/14 bg-white/6" : "border-slate-200 bg-white/70"
      }`}
    >
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
          isDark ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-2 text-sm leading-6 ${
          isDark ? "text-slate-100" : "text-slate-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function ReadOnlyChipList({
  label,
  values,
  isDark,
}: {
  label: string;
  values: string[];
  isDark: boolean;
}) {
  if (!values.length) {
    return null;
  }

  return (
    <div
      className={`rounded-[1rem] border px-4 py-3 ${
        isDark ? "border-cyan-300/14 bg-white/6" : "border-slate-200 bg-white/70"
      }`}
    >
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
          isDark ? "text-slate-400" : "text-slate-500"
        }`}
      >
        {label}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className={
              isDark
                ? "inline-flex items-center rounded-full border border-cyan-300/18 bg-white/8 px-3 py-1.5 text-sm font-medium text-cyan-100"
                : "inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1.5 text-sm font-medium text-sky-700"
            }
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PopupShell({
  title,
  isDark,
  onCancel,
  onConfirm,
  confirmLabel,
  children,
}: {
  title: string;
  isDark: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center px-4">
      <button
        type="button"
        className={
          isDark
            ? "absolute inset-0 bg-slate-950/72 backdrop-blur-sm"
            : "absolute inset-0 bg-slate-900/28 backdrop-blur-sm"
        }
        onClick={onCancel}
        aria-label="Cerrar"
      />
      <div
        className={`relative w-full max-w-2xl rounded-[1.6rem] border p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)] ${
          isDark
            ? "border-cyan-300/16 bg-[linear-gradient(180deg,rgba(7,16,31,0.98),rgba(8,17,32,0.94))]"
            : "border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))]"
        }`}
      >
        <h3 className={isDark ? "text-2xl font-semibold text-white" : "text-2xl font-semibold text-slate-950"}>
          {title}
        </h3>
        <div className="mt-5">{children}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className={
              isDark
                ? "rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-slate-100"
                : "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            }
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
