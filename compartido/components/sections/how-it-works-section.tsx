"use client";

import { motion } from "framer-motion";
import { UserPlus, FileText, Search, MessageSquareMore } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "El talento crea su perfil",
    text: "Cada persona publica habilidades, experiencia y disponibilidad.",
  },
  {
    icon: FileText,
    title: "Perfil estructurado",
    text: "La información queda ordenada para comparar candidatos fácilmente.",
  },
  {
    icon: Search,
    title: "La empresa filtra",
    text: "Busca por ciudad, especialidad, nivel profesional y modalidad de trabajo.",
  },
  {
    icon: MessageSquareMore,
    title: "Contacto directo",
    text: "Cuando hay match, la empresa contacta al perfil sin fricción.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold text-slate-900">Cómo funciona</h2>
        <p className="mt-2 text-slate-600">
          Un flujo claro y directo para contratación en Colombia.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04, duration: 0.2 }}
              whileHover={{ y: -2 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
                <Icon className="h-4.5 w-4.5" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.text}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
