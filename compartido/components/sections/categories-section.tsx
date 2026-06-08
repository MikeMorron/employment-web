"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Code2,
  Palette,
  Megaphone,
  BadgeDollarSign,
  BriefcaseBusiness,
  Headset,
} from "lucide-react";

const categories = [
  { name: "Tecnología", jobs: "Desarrolladores, QA, data y producto", icon: Code2 },
  { name: "Marketing", jobs: "Growth, pauta, contenido y analítica", icon: Megaphone },
  { name: "Diseño", jobs: "UX/UI, branding e identidad visual", icon: Palette },
  { name: "Finanzas", jobs: "Contabilidad, planeación y control", icon: BadgeDollarSign },
  { name: "Ventas", jobs: "Ejecutivos B2B, SDR y cierre comercial", icon: BriefcaseBusiness },
  { name: "Atención al cliente", jobs: "Soporte, customer success y operaciones", icon: Headset },
];

export function CategoriesSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Perfiles por especialidad</h2>
        <p className="mt-2 text-slate-600">
          Filtra talento por área profesional y encuentra candidatos más rápido.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((item, index) => {
          const Icon = item.icon;

          return (
            <Link
              key={`${item.name}-${index}`}
              href={`/vacantes?categoria=${encodeURIComponent(item.name)}`}
              className="block"
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03, duration: 0.18 }}
                whileHover={{ y: -2 }}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-slate-300"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                    <Icon className="h-4.5 w-4.5" />
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold leading-tight text-slate-900">{item.name}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.jobs}</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
