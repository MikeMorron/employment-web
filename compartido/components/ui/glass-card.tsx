import type { ReactNode } from "react";
import type { ComponentPropsWithoutRef } from "react";

export function GlassCard({
  children,
  className = "",
  isDark = false,
  ...props
}: {
  children: ReactNode;
  className?: string;
  isDark?: boolean;
} & ComponentPropsWithoutRef<"section">) {
  return (
    <section
      className={`${isDark
        ? "rounded-[2rem] border border-cyan-300/22 bg-[linear-gradient(180deg,rgba(6,14,30,0.96),rgba(8,18,35,0.92))] shadow-[inset_0_1px_0_rgba(125,211,252,0.08),0_0_0_1px_rgba(71,214,255,0.04),0_28px_80px_rgba(1,8,20,0.52)] backdrop-blur-xl"
        : "rounded-[2rem] border border-sky-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(244,250,255,0.78))] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_0_0_1px_rgba(56,189,248,0.04),0_28px_74px_rgba(148,163,184,0.14)] backdrop-blur-xl"} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
