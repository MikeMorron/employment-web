"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const testimonials = [
  {
    name: "Laura Gómez",
    role: "Diseñadora UX/UI",
    rating: 5,
    text: "Encontré una oportunidad remota en Medellín mucho más rápido de lo que esperaba. La experiencia fue clara y muy fácil de usar.",
  },
  {
    name: "Santiago Rojas",
    role: "Frontend Developer",
    rating: 5,
    text: "La plataforma se siente moderna y me permitió aplicar sin perder tiempo. Muy buena organización.",
  },
  {
    name: "Paula Martínez",
    role: "Recruiter",
    rating: 5,
    text: "Publicar vacantes y recibir candidatos relevantes fue mucho más simple de lo habitual.",
  },
  {
    name: "Camilo Herrera",
    role: "Analista de Datos",
    rating: 4,
    text: "Me gustó el diseño y encontré ofertas interesantes. Todavía espero ver más empresas publicando.",
  },
  {
    name: "Daniela Castro",
    role: "Customer Success",
    rating: 4,
    text: "La experiencia es buena y rápida. Me gustaría encontrar más vacantes en mi ciudad.",
  },
  {
    name: "Mariana López",
    role: "Marketing Specialist",
    rating: 5,
    text: "Identifiqué oportunidades alineadas con mi perfil en pocos minutos. Muy intuitiva.",
  },
  {
    name: "Juan Esteban Ruiz",
    role: "Product Designer",
    rating: 3,
    text: "La interfaz es bonita, aunque todavía siento que faltan más vacantes en diseño.",
  },
  {
    name: "Valentina Pérez",
    role: "Full Stack Developer",
    rating: 5,
    text: "Todo se entiende rápido y el flujo para explorar vacantes se siente natural.",
  },
  {
    name: "Andrés Mejía",
    role: "Ejecutivo Comercial",
    rating: 4,
    text: "Buscando vacantes en ventas encontré algunas interesantes. Buen inicio.",
  },
  {
    name: "Natalia Quintero",
    role: "Psicóloga Organizacional",
    rating: 5,
    text: "Como reclutadora valoro mucho la simplicidad. Tiene potencial real.",
  },
  {
    name: "Felipe Torres",
    role: "Ingeniero de Software",
    rating: 4,
    text: "El sitio carga rápido y visualmente se ve profesional.",
  },
  {
    name: "Karen Sánchez",
    role: "Atención al Cliente",
    rating: 3,
    text: "Me pareció fácil de usar aunque me gustaría ver más vacantes activas.",
  },
  {
    name: "Sebastián Vargas",
    role: "Founder / Hiring Manager",
    rating: 5,
    text: "El enfoque en Colombia es muy acertado. Se siente ordenado y claro.",
  },
];

const CARDS_PER_VIEW = 4;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="mt-4 flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
          }`}
        />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const [startIndex, setStartIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [showEdgeNotice, setShowEdgeNotice] = useState(false);

  const visibleTestimonials = useMemo(() => {
    return Array.from({ length: CARDS_PER_VIEW }, (_, i) => {
      const index = (startIndex + i) % testimonials.length;
      return testimonials[index];
    });
  }, [startIndex]);

  const next = () => {
    setStartIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setStartIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const triggerEdgeNotice = () => {
    setShowEdgeNotice(true);
    window.clearTimeout((triggerEdgeNotice as unknown as { timer?: number }).timer);
    (triggerEdgeNotice as unknown as { timer?: number }).timer = window.setTimeout(() => {
      setShowEdgeNotice(false);
    }, 1200);
  };

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight">Testimonios</h2>
        <p className="mt-2 text-slate-600">
          Historias de personas y empresas que ya usan TalentSyncro.
        </p>
      </div>

      <div className="relative mt-10 px-12 sm:px-14 lg:px-0">
        <button
          onClick={prev}
          className="absolute left-1 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 sm:left-2 sm:h-12 sm:w-12 lg:left-[-28px]"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          onClick={next}
          className="absolute right-1 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 sm:right-2 sm:h-12 sm:w-12 lg:right-[-28px]"
          aria-label="Siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="overflow-hidden">
          <motion.div
            drag="x"
            dragElastic={0.08}
            dragConstraints={{ left: 0, right: 0 }}
            style={{ touchAction: "pan-y" }}
            onDrag={(_, info) => {
              setDragOffset(info.offset.x);
            }}
            onDragEnd={(_, info) => {
              const threshold = 90;

              if (info.offset.x < -threshold) {
                next();
              } else if (info.offset.x > threshold) {
                prev();
              } else if (Math.abs(info.offset.x) > 20) {
                triggerEdgeNotice();
              }

              setDragOffset(0);
            }}
            animate={{
              x:
                dragOffset > 140
                  ? 16
                  : dragOffset < -140
                  ? -16
                  : 0,
            }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 cursor-grab active:cursor-grabbing"
          >
            {visibleTestimonials.map((item, index) => (
              <motion.div
                key={`${startIndex}-${index}-${item.name}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.22 }}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="leading-relaxed text-slate-700">“{item.text}”</p>

                <Stars rating={item.rating} />

                <div className="mt-6">
                  <h3 className="font-semibold text-slate-900">{item.name}</h3>
                  <p className="text-sm text-slate-500">{item.role}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <AnimatePresence>
          {showEdgeNotice && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mt-4 text-center text-sm font-medium text-slate-500"
            >
              No hay más por ver
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
