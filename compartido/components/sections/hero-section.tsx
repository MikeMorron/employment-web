"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-18">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          className="max-w-2xl"
        >
          <p className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Talento colombiano
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Encuentra perfiles listos para contratar
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Una plataforma simple donde las empresas filtran talento por especialidad,
            ciudad y modalidad para contactar candidatos directamente.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/vacantes"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Explorar perfiles <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Publicar mi perfil
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, delay: 0.05 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="mb-3 text-sm font-semibold text-slate-700">Búsqueda rápida</p>

          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rol o habilidad"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </div>
            <input
              type="text"
              placeholder="Ciudad"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </div>

          <Link
            href="/vacantes"
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Buscar perfiles
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
