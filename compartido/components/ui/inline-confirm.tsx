import type { ReactNode } from "react";

export function InlineConfirm({
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Si",
  cancelLabel = "No",
  className = "",
  confirmClassName = "rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition duration-300 hover:bg-red-700",
  cancelClassName = "rounded-full border border-red-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-red-800 transition duration-300 hover:bg-white",
}: {
  message: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  className?: string;
  confirmClassName?: string;
  cancelClassName?: string;
}) {
  return (
    <div
      className={className}
      onClick={(event) => {
        event.stopPropagation();
      }}
    >
      <p className="text-center text-sm font-medium">{message}</p>
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onConfirm();
          }}
          className={confirmClassName}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onCancel();
          }}
          className={cancelClassName}
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}
