"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const ratingPalette = {
  1: {
    border: "#ef4444",
    glow: "rgba(239,68,68,0.20)",
    star: "#ef4444",
    text: "#b91c1c",
  },
  2: {
    border: "#f97316",
    glow: "rgba(249,115,22,0.20)",
    star: "#f97316",
    text: "#c2410c",
  },
  3: {
    border: "#eab308",
    glow: "rgba(234,179,8,0.22)",
    star: "#eab308",
    text: "#a16207",
  },
  4: {
    border: "#84cc16",
    glow: "rgba(132,204,22,0.22)",
    star: "#84cc16",
    text: "#4d7c0f",
  },
  5: {
    border: "#16a34a",
    glow: "rgba(22,163,74,0.24)",
    star: "#16a34a",
    text: "#166534",
  },
} as const;

export function AnimatedRatingBadge({
  value,
  onChange,
}: {
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (value: 1 | 2 | 3 | 4 | 5) => void;
}) {
  const [displayValue, setDisplayValue] = useState<1 | 2 | 3 | 4 | 5>(1);

  useEffect(() => {
    if (displayValue === value) {
      return;
    }

    const direction = value > displayValue ? 1 : -1;
    const timer = window.setTimeout(() => {
      setDisplayValue((current) => {
        const next = current + direction;
        return Math.max(1, Math.min(5, next)) as 1 | 2 | 3 | 4 | 5;
      });
    }, 280);

    return () => window.clearTimeout(timer);
  }, [displayValue, value]);

  const palette = useMemo(() => ratingPalette[displayValue], [displayValue]);

  return (
    <div className="flex flex-col items-center">
      <motion.div
        key={displayValue}
        initial={{ scale: 0.96, opacity: 0.9 }}
        animate={{ scale: [1, 1.035, 1], opacity: 1 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        className="flex h-44 w-44 flex-col items-center justify-center rounded-full border-[7px] bg-white text-center"
        style={{
          borderColor: palette.border,
          boxShadow: `0 20px 45px ${palette.glow}`,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={displayValue}
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.94 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="text-6xl font-semibold leading-none"
            style={{ color: palette.text }}
          >
            {displayValue}
          </motion.span>
        </AnimatePresence>
        <span className="mt-3 text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-400">
          Rating
        </span>
      </motion.div>

      <div className="mt-6 flex items-center gap-2">
        {([1, 2, 3, 4, 5] as const).map((star) => {
          const active = star <= displayValue;
          return (
            <motion.button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              whileHover={{ y: -2, scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="inline-flex h-11 w-11 items-center justify-center"
              aria-label={`${star} estrellas`}
            >
              <Star
                className="h-7 w-7 transition-colors duration-300"
                style={{
                  color: active ? palette.star : "#cbd5e1",
                  fill: active ? palette.star : "transparent",
                  filter: active ? `drop-shadow(0 0 8px ${palette.glow})` : "none",
                }}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
