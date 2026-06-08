"use client";

import { motion } from "framer-motion";

const features = [
  {
    title: "Postulación en un clic",
    text: "Proceso optimizado para que no pierdas tiempo en formularios infinitos.",
  },
  {
    title: "Filtros inteligentes",
    text: "Encuentra exactamente lo que buscas: remoto, híbrido o presencial.",
  },
  {
    title: "Alertas de salario",
    text: "Recibe notificaciones cuando aparezcan vacantes acordes a tu perfil.",
  },
];

export function FeaturesSection() {
  return (
    <section className="border-y bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-3 lg:px-8">
        {features.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08 }}
            className="rounded-[28px] border border-slate-200 p-6 shadow-sm"
          >
            <h3 className="text-xl font-semibold">{item.title}</h3>
            <p className="mt-3 text-slate-600">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}