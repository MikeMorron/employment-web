"use client";

import { createPortal } from "react-dom";

type UploadToast = {
  type: "success" | "error";
  message: string;
  progress: number;
};

export function JobFitUploadToast({
  uploadToast,
  onClose,
}: {
  uploadToast: UploadToast | null;
  onClose: () => void;
}) {
  if (!uploadToast) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[120]">
      <div
        className={`pointer-events-auto relative w-[min(92vw,420px)] overflow-hidden rounded-[1.35rem] border bg-white shadow-[0_18px_48px_rgba(15,23,42,0.18)] ${
          uploadToast.type === "success" ? "border-emerald-500" : "border-red-500"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          className={`absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition ${
            uploadToast.type === "success"
              ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              : "border-red-200 text-red-700 hover:bg-red-50"
          }`}
          aria-label="Cerrar notificacion"
        >
          X
        </button>
        <div className="px-5 pb-5 pt-6">
          <p
            className={`pr-10 text-sm font-semibold ${
              uploadToast.type === "success" ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {uploadToast.message}
          </p>
        </div>
        <div className={uploadToast.type === "success" ? "h-1.5 bg-emerald-100" : "h-1.5 bg-red-100"}>
          <div
            className={`h-full transition-[width] duration-75 ${
              uploadToast.type === "success" ? "bg-emerald-500" : "bg-red-500"
            }`}
            style={{ width: `${uploadToast.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function JobFitDeleteCvConfirm({
  isDark,
  isMounted,
  open,
  onCancel,
  onConfirm,
}: {
  isDark: boolean;
  isMounted: boolean;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!isMounted || !open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex h-screen w-screen items-center justify-center px-4">
      <button
        type="button"
        className={isDark ? "absolute inset-0 h-full w-full bg-slate-950/72 backdrop-blur-sm" : "absolute inset-0 h-full w-full bg-slate-900/28 backdrop-blur-sm"}
        onClick={onCancel}
        aria-label="Cerrar confirmacion"
      />
      <div
        className={`relative w-full max-w-md rounded-[1.6rem] border p-6 shadow-[0_24px_70px_rgba(15,23,42,0.22)] ${
          isDark
            ? "border-cyan-300/16 bg-[linear-gradient(180deg,rgba(7,16,31,0.98),rgba(8,17,32,0.94))]"
            : "border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))]"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={isDark ? "text-xs font-semibold uppercase tracking-[0.2em] text-red-300" : "text-xs font-semibold uppercase tracking-[0.2em] text-red-600"}>
              Confirmación
            </p>
            <h3 className={`mt-3 text-2xl font-semibold ${isDark ? "text-white" : "text-slate-950"}`}>
              ¿Estás seguro?
            </h3>
            <p className={`mt-3 text-sm leading-7 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Esta acción no se puede deshacer.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className={isDark ? "inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/16 bg-white/6 text-sm font-semibold text-slate-200 transition hover:bg-white/12" : "inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:bg-slate-100"}
            aria-label="Cerrar"
          >
            X
          </button>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className={isDark ? "inline-flex w-full items-center justify-center rounded-[1rem] border border-cyan-300/20 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14 sm:min-w-[150px] sm:w-auto" : "inline-flex w-full items-center justify-center rounded-[1rem] border border-slate-300 bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:min-w-[150px] sm:w-auto"}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex w-full items-center justify-center rounded-[1rem] border border-red-500 bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:border-red-600 hover:bg-red-600 sm:min-w-[150px] sm:w-auto"
          >
            Si, borrar CV
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
