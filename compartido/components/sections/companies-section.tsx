"use client";

import { motion } from "framer-motion";
import {
  Building2,
  Phone,
  Cloud,
  BriefcaseBusiness,
  Home,
  Flame,
} from "lucide-react";

const companies = [
  { name: "Avato Tech", text: "Buscando perfiles de desarrollo y producto", icon: Flame },
  { name: "Meta Lab", text: "Talento en diseño, data y growth", icon: Building2 },
  { name: "Call Profesionales", text: "Perfiles de servicio y experiencia de cliente", icon: Phone },
  { name: "Ingebice SAS", text: "Candidatos para áreas comerciales y financieras", icon: BriefcaseBusiness },
  { name: "Telcom Cloud", text: "Especialistas cloud y backend remoto", icon: Cloud },
  { name: "Inmuebles Cotizados", text: "Perfiles administrativos y de operaciones", icon: Home },
];

export function CompaniesSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Empresas usando el directorio</h2>
        <p className="mt-2 text-slate-600">
          Equipos en Colombia que ya filtran y contactan talento desde perfiles.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {companies.map((company, index) => {
          const Icon = company.icon;

          return (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.03, duration: 0.18 }}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                  <Icon className="h-4.5 w-4.5" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold leading-tight text-slate-900">{company.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{company.text}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
