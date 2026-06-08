"use client";

type JobDetailActionsProps = {
  isDark: boolean;
  className: string;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  showWithdraw?: boolean;
  onWithdraw?: () => void;
  withdrawLabel?: string;
  profileLabel: string;
  onOpenProfile: () => void;
  closeLabel?: string;
  onClose?: () => void;
};

export function JobDetailActions({
  isDark,
  className,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  showWithdraw = false,
  onWithdraw,
  withdrawLabel,
  profileLabel,
  onOpenProfile,
  closeLabel,
  onClose,
}: JobDetailActionsProps) {
  return (
    <div className={className}>
      <button
        type="button"
        disabled={primaryDisabled}
        onClick={onPrimary}
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(76,29,149,0.26)] transition duration-300 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-90"
      >
        {primaryLabel}
      </button>
      {showWithdraw && onWithdraw && withdrawLabel ? (
        <button
          type="button"
          onClick={onWithdraw}
          className={
            isDark
              ? "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/4 px-5 py-2.5 text-sm font-medium text-slate-100 transition duration-300 hover:border-rose-200/24 hover:bg-white/8"
              : "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition duration-300 hover:border-rose-300 hover:bg-rose-50"
          }
        >
          {withdrawLabel}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onOpenProfile}
        className={
          isDark
            ? "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/4 px-5 py-2.5 text-sm font-medium text-slate-100 transition duration-300 hover:border-cyan-200/24 hover:bg-white/8"
            : "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition duration-300 hover:border-slate-400 hover:bg-slate-50"
        }
      >
        {profileLabel}
      </button>
      {closeLabel && onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition duration-300 hover:border-slate-400 hover:bg-slate-50"
        >
          {closeLabel}
        </button>
      ) : null}
    </div>
  );
}
