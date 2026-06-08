"use client";

import { motion } from "framer-motion";
import { Bookmark, Building2, Clock3, MapPin, Sparkles } from "lucide-react";

import type { Job } from "@/types/job";

type JobsSectionProfileCardProps = {
  profile: Job;
  saved: boolean;
  onToggleSave: (id: number) => void;
  onViewProfile: (profile: Job) => void;
};

export function JobsSectionProfileCard({
  profile,
  saved,
  onToggleSave,
  onViewProfile,
}: JobsSectionProfileCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.24 }}
      className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)] transition hover:border-slate-300"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#12327a,#1f57c3)] text-lg font-bold text-white">
            {profile.title.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold leading-tight text-slate-900">
                {profile.title}
              </h3>

              {profile.featured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Perfil destacado
                </span>
              ) : null}
            </div>

            <div className="mt-1 flex items-center gap-2 text-slate-600">
              <Building2 className="h-4 w-4" />
              <span>{profile.company}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                {profile.category}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                {profile.seniority}
              </span>
              <span className="rounded-full bg-red-50 px-3 py-1 font-medium text-red-700">
                {profile.mode}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {profile.city}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4" />
                Disponible para proceso
              </span>
            </div>
          </div>
        </div>

        <div className="flex min-w-[210px] flex-col items-start gap-3 lg:items-end">
          <p className="text-lg font-semibold text-emerald-700">{profile.salary}</p>
          <p className="text-xs text-slate-500">Expectativa salarial mensual</p>

          <div className="flex gap-2">
            <button
              onClick={() => onToggleSave(profile.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
                saved
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Bookmark className={`h-4 w-4 ${saved ? "fill-amber-500" : ""}`} />
              {saved ? "Guardado" : "Guardar"}
            </button>

            <button
              onClick={() => onViewProfile(profile)}
              className="rounded-xl bg-[#12327a] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1b4eb7]"
            >
              Ver perfil
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
