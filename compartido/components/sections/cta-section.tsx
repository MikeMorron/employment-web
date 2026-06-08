"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.22 }}
        className="rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-sm md:flex md:items-center md:justify-between"
      >
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">Directorio de talento para Colombia</h3>
          <p className="mt-2 max-w-2xl text-slate-600">
            Filtra perfiles, guarda candidatos y acelera tu proceso de contratación.
          </p>
        </div>

        <Link
          href="/vacantes"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 md:mt-0"
        >
          Ver perfiles <ChevronRight className="h-4 w-4" />
        </Link>
      </motion.div>
    </section>
  );
}
