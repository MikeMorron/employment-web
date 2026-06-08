"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { WidgetId, WidgetConfig } from "@/app/analytics/_lib/dashboard-config";

interface WidgetBadgeProps {
  isDark: boolean;
  badge: {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    mode: "drag" | "resize";
  } | null;
  widgets: Record<WidgetId, WidgetConfig>;
}

export function WidgetBadge({ isDark, badge, widgets }: WidgetBadgeProps) {
  return (
    <AnimatePresence>
      {badge ? (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: 0.16 }}
          className={
            isDark
              ? "fixed bottom-6 right-6 z-[200] rounded-[1rem] border border-cyan-300/18 bg-[#081120]/96 px-4 py-3 text-sm text-cyan-100 shadow-[0_18px_40px_rgba(0,0,0,0.34)] backdrop-blur-xl"
              : "fixed bottom-6 right-6 z-[200] rounded-[1rem] border border-sky-300 bg-white px-4 py-3 text-sm text-sky-800 shadow-[0_18px_40px_rgba(148,163,184,0.22)]"
          }
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">
            {badge.mode === "drag" ? "Moviendo widget" : "Redimensionando widget"}
          </p>
          <p className="mt-1 font-semibold">
            {widgets[badge.id as WidgetId]?.title ?? badge.id}
          </p>
          <p className="mt-1 text-xs opacity-90">
            x:{badge.x} y:{badge.y} · {badge.w}×{badge.h}
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
