"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type BoostInventoryItem = {
  id: string;
  sourcePlanId: string;
  durationHours: number;
  remainingUses: number;
};

type BoostActivationModalProps = {
  open: boolean;
  isDark: boolean;
  inventory: BoostInventoryItem[];
  onClose: () => void;
  onConfirm: (durationHours: number, quantity: number) => Promise<void> | void;
};

export function BoostActivationModal({
  open,
  isDark,
  inventory,
  onClose,
  onConfirm,
}: BoostActivationModalProps) {
  const durationOptions = useMemo(
    () => Array.from(new Set(inventory.map((item) => item.durationHours))).sort((a, b) => a - b),
    [inventory],
  );
  const [selectedDuration, setSelectedDuration] = useState<number>(durationOptions[0] ?? 24);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const resolvedDuration = durationOptions.includes(selectedDuration)
    ? selectedDuration
    : (durationOptions[0] ?? 24);
  const maxQuantity = inventory
    .filter((item) => item.durationHours === resolvedDuration)
    .reduce((sum, item) => sum + item.remainingUses, 0);

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className={isDark ? "absolute inset-0 bg-slate-950/60 backdrop-blur-sm" : "absolute inset-0 bg-slate-950/45 backdrop-blur-sm"}
        onClick={onClose}
        aria-label="Cerrar activación de boosts"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={isDark ? "relative z-10 w-full max-w-xl rounded-[1.6rem] border border-white/10 bg-[#081120] p-6 text-white" : "relative z-10 w-full max-w-xl rounded-[1.6rem] border border-slate-300 bg-white p-6 text-slate-900"}
      >
        <h3 className="text-2xl font-bold">Usar boosts</h3>
        <p className={isDark ? "mt-2 text-sm leading-7 text-slate-300" : "mt-2 text-sm leading-7 text-slate-600"}>
          Selecciona la duración y la cantidad. El backend suma el tiempo al boost activo actual y valida el inventario antes de aplicar cualquier cambio.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span>Duración</span>
            <select
              value={selectedDuration}
              onChange={(event) => {
                setSelectedDuration(Number(event.target.value));
                setQuantity(1);
              }}
              className={isDark ? "rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-white" : "rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"}
            >
              {durationOptions.map((duration) => (
                <option key={duration} value={duration}>
                  {duration} horas
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            <span>Cantidad</span>
            <input
              type="number"
              min={1}
              max={Math.max(1, maxQuantity)}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Math.min(maxQuantity, Number(event.target.value || 1))))}
              className={isDark ? "rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-white" : "rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"}
            />
          </label>
        </div>

        <div className={isDark ? "mt-4 rounded-xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-slate-300" : "mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"}>
          Disponibles para esta duración: {maxQuantity}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className={isDark ? "inline-flex items-center justify-center rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:scale-105" : "inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:scale-105"}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={maxQuantity < 1}
            onClick={() => void onConfirm(resolvedDuration, quantity)}
            className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:scale-105 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Activar boost
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
