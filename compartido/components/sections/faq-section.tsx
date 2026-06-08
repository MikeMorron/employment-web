"use client";

import { motion } from "framer-motion";

const faqs = [
  {
    question: "¿Publicar mi perfil tiene costo?",
    answer: "No. Publicar el perfil profesional en TalentSyncro es gratuito para candidatos.",
  },
  {
    question: "¿Solo funciona para Colombia?",
    answer: "Sí. TalentSyncro está enfocada en talento y empresas dentro del mercado colombiano.",
  },
  {
    question: "¿Qué puede ver una empresa en mi perfil?",
    answer: "Experiencia, habilidades, área profesional, ciudad, modalidad y expectativa salarial.",
  },
  {
    question: "¿Cómo encuentran talento las empresas?",
    answer: "Usan búsqueda y filtros por especialidad, ciudad, modalidad y nivel profesional para contactar perfiles.",
  },
  {
    question: "¿Puedo actualizar mi perfil después?",
    answer: "Sí. La idea es que puedas mantener tu información profesional siempre actualizada.",
  },
];

export function FaqSection() {
  return (
    <section className="border-y bg-white">
      <div className="mx-auto max-w-5xl px-6 py-14 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight">Preguntas frecuentes</h2>
          <p className="mt-2 text-slate-600">
            Respuestas sobre el modelo de búsqueda de talento de la plataforma.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="rounded-[24px] border border-slate-200 bg-slate-50 p-5"
            >
              <h3 className="font-semibold text-slate-900">{faq.question}</h3>
              <p className="mt-2 text-slate-600">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
