"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Wallet, Building2, Star } from "lucide-react";

import type { Job } from "@/types/job";

export function JobCard({ job }: { job: Job }) {
  const normalizedCity = job.city.trim().toLowerCase();
  const normalizedMode = job.mode.trim().toLowerCase();
  const showCity = normalizedCity !== normalizedMode;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {job.category}
          </span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {job.seniority}
          </span>
        </div>

        {job.featured && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <Star className="h-3.5 w-3.5" /> Destacada
          </span>
        )}
      </div>

      <h3 className="mt-5 text-xl font-semibold leading-tight text-slate-900">
        {job.title}
      </h3>

      <div className="mt-2 flex items-center gap-2 text-slate-600">
        <Building2 className="h-4 w-4" />
        <span>{job.company}</span>
      </div>

      <div className="mt-5 space-y-3 text-sm text-slate-600">
        {showCity ? (
          <div className="flex">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
              <MapPin className="h-4 w-4" />
              {job.city}
            </span>
          </div>
        ) : null}
        <div className="flex">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
            <MapPin className="h-4 w-4" />
            {job.mode}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4" /> {job.salary}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/vacantes"
          className="w-full flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-center font-medium text-white transition hover:opacity-95"
        >
          Ver vacantes
        </Link>

        <button className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto">
          Guardar
        </button>
      </div>
    </motion.div>
  );
}
