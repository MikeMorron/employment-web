"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  value: string;
  label: string;
  icon: LucideIcon;
  color?: "yellow" | "blue" | "red";
};

function useAnimatedValue(target: number, duration = 1100) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let animationFrame = 0;
    const startTime = performance.now();

    const update = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      setCount(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(update);
      }
    };

    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);

  return count;
}

function getIconBadgeClass(color: StatCardProps["color"]) {
  switch (color) {
    case "yellow":
      return "bg-yellow-400 text-white";
    case "red":
      return "bg-red-400 text-white";
    case "blue":
    default:
      return "bg-blue-500 text-white";
  }
}

export function StatCard({
  value,
  label,
  icon: Icon,
  color = "blue",
}: StatCardProps) {
  const parsed = useMemo(() => {
    if (value.includes("12k")) return { type: "k", target: 12, suffix: "k+" };
    if (value.includes("4.6")) return { type: "decimal", target: 46, suffix: " / 5.0" };
    if (value.includes("4.4")) return { type: "decimal", target: 44, suffix: " / 5.0" };
    if (value === "COP") return { type: "text", target: 0, suffix: "COP" };

    const numeric = Number(value.replace(/[^\d]/g, ""));
    return { type: "number", target: numeric, suffix: "" };
  }, [value]);

  const animatedInteger = useAnimatedValue(
    parsed.type === "k" || parsed.type === "number" ? parsed.target : 0
  );

  const animatedDecimalBase = useAnimatedValue(
    parsed.type === "decimal" ? parsed.target : 0
  );

  const displayValue = useMemo(() => {
    if (parsed.type === "text") return parsed.suffix;
    if (parsed.type === "k") return `${animatedInteger}${parsed.suffix}`;
    if (parsed.type === "decimal") return `${(animatedDecimalBase / 10).toFixed(1)}${parsed.suffix}`;
    return `${animatedInteger}${parsed.suffix}`;
  }, [parsed, animatedInteger, animatedDecimalBase]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      whileHover={{ scale: 1.006, y: -2 }}
      className="rounded-[18px] border border-slate-200 bg-white px-5 py-4 shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${getIconBadgeClass(
            color
          )}`}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>

        <div>
          <div className="text-[1.7rem] font-bold leading-none tracking-tight text-[#12285e]">
            {displayValue}
          </div>
          <div className="mt-1 text-sm text-slate-500">{label}</div>
        </div>
      </div>
    </motion.div>
  );
}