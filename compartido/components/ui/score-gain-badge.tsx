"use client";

import { AnimatePresence, motion } from "framer-motion";

export function ScoreGainBadge({
  isDark,
  points,
}: {
  isDark: boolean;
  points: number;
}) {
  return (
    <AnimatePresence>
      {points > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.96 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className={`pointer-events-none absolute right-4 top-4 z-20 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] shadow-[0_16px_32px_rgba(16,185,129,0.18)] ${
            isDark
              ? "border-emerald-300/24 bg-emerald-400/16 text-emerald-100"
              : "border-emerald-300 bg-white text-emerald-700"
          }`}
        >
          +{points} pts
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
