"use client";

import type { ComponentType } from "react";
import { KpiCard } from "@/app/analytics/_components/dashboard-visuals";

interface KpiItem {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  context: string;
  isZero: boolean;
}

interface KpiGridProps {
  isDark: boolean;
  items: KpiItem[];
}

export function KpiGrid({ isDark, items }: KpiGridProps) {
  return (
    <section className="grid gap-5 lg:grid-cols-3 xl:grid-cols-6">
      {items.map((item) => (
        <KpiCard
          key={item.label}
          isDark={isDark}
          icon={item.icon}
          label={item.label}
          value={item.value}
          context={item.context}
          isZero={item.isZero}
        />
      ))}
    </section>
  );
}
