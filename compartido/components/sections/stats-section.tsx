"use client";

import {
  UserRound,
  Building2,
  Star,
  BadgeDollarSign,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";

export function StatsSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight text-[#12285e]">
          Indicadores de TalentSyncro
        </h2>
        <p className="mt-2 text-slate-500">
          Un ecosistema donde empresas colombianas encuentran perfiles reales.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          value="12k+"
          label="Perfiles profesionales"
          icon={UserRound}
          color="red"
        />
        <StatCard
          value="30"
          label="Empresas activas buscando"
          icon={Building2}
          color="blue"
        />
        <StatCard
          value="4.6 / 5.0"
          label="Experiencia de contratación"
          icon={Star}
          color="yellow"
        />
        <StatCard
          value="COP"
          label="Expectativas salariales en COP"
          icon={BadgeDollarSign}
          color="blue"
        />
      </div>
    </section>
  );
}
