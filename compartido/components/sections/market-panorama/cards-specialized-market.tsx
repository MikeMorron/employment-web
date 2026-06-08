"use client";

import { useAppLanguage } from "@/hooks/use-app-language";
import type { SpecializedCardProps } from "@/components/sections/market-panorama/cards-specialized-shared";

export function SectorTimelineCard({ isDark }: SpecializedCardProps) {
  const { isEnglish } = useAppLanguage();
  const sectorsByYear = [
    {
      year: "2020",
      focus: isEnglish ? "Essential sectors" : "Sectores esenciales",
      items: isEnglish
        ? ["Trade (retail, food)", "Healthcare", "Logistics", "Basic services"]
        : ["Comercio (retail, alimentos)", "Salud", "Logística", "Servicios básicos"],
    },
    {
      year: "2021",
      focus: isEnglish ? "Reopening" : "Reapertura",
      items: isEnglish
        ? ["Trade", "Services", "Construction", "Logistics"]
        : ["Comercio", "Servicios", "Construcción", "Logística"],
    },
    {
      year: "2022",
      focus: isEnglish ? "Strong growth" : "Crecimiento fuerte",
      items: isEnglish
        ? ["Trade and sales", "Industry / manufacturing", "Construction", "Logistics and transportation"]
        : ["Comercio y ventas", "Industria / manufactura", "Construcción", "Logística y transporte"],
    },
    {
      year: "2023",
      focus: isEnglish ? "Normalization" : "Normalización",
      items: isEnglish
        ? ["Services", "Trade", "Industry", "Administrative"]
        : ["Servicios", "Comercio", "Industria", "Administrativo"],
    },
    {
      year: "2024",
      focus: isEnglish ? "Stability" : "Estabilidad",
      items: isEnglish
        ? ["Trade", "Services", "Logistics", "Healthcare"]
        : ["Comercio", "Servicios", "Logística", "Salud"],
    },
    {
      year: "2025",
      focus: isEnglish ? "Consumption and services" : "Consumo y servicios",
      items: isEnglish
        ? ["Trade (strong retail)", "Services", "Logistics", "Technology (growing, not dominant)"]
        : ["Comercio (retail fuerte)", "Servicios", "Logística", "Tecnología (crece pero no domina)"],
    },
    {
      year: "2026",
      focus: isEnglish ? "Current" : "Actual",
      items: isEnglish
        ? ["Services", "Trade", "Logistics", "Technology (niche, not mass-market)"]
        : ["Servicios", "Comercio", "Logística", "Tecnología (nicho, no masivo)"],
    },
  ];

  return (
    <div className={isDark ? "mt-4 rounded-[1rem] border border-white/8 bg-white/[0.03] p-3" : "mt-4 rounded-[1rem] border border-slate-200 bg-slate-50/90 p-3"}>
      <div className="grid gap-3 xl:grid-cols-2">
        {sectorsByYear.map((block) => (
          <div
            key={block.year}
            className={
              isDark
                ? "rounded-[1.1rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-3"
                : "rounded-[1.1rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] px-4 py-3"
            }
          >
            <div className="flex items-center justify-between gap-3">
              <span className={isDark ? "inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-cyan-400/12 px-2.5 text-[11px] font-semibold text-cyan-200" : "inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-sky-100 px-2.5 text-[11px] font-semibold text-sky-700"}>
                {block.year}
              </span>
              <span className={isDark ? "text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400" : "text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500"}>
                {block.focus}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {block.items.map((item, itemIndex) => (
                <div
                  key={`${block.year}-${item}`}
                  className={isDark ? "inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5" : "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5"}
                >
                  <span className={isDark ? "h-2 w-2 shrink-0 rounded-full bg-cyan-300" : "h-2 w-2 shrink-0 rounded-full bg-sky-600"} style={{ opacity: 1 - itemIndex * 0.1 }} />
                  <span className={isDark ? "text-[11px] leading-5 text-slate-200" : "text-[11px] leading-5 text-slate-700"}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompanyTimelineCard({ isDark }: SpecializedCardProps) {
  const { isEnglish } = useAppLanguage();
  const companiesByYear = [
    { year: "2020", focus: isEnglish ? "Essential companies" : "Empresas esenciales", items: ["D1 / Ara / Grupo Éxito", "Rappi", "Cruz Verde / Sanitas / Sura", "Servientrega / Coordinadora"] },
    { year: "2021", focus: isEnglish ? "Reopening and mass hiring" : "Reapertura y contratación masiva", items: ["Grupo Éxito", "Sodimac (Homecenter)", "Eficacia / Activos", "Teleperformance / Konecta"] },
    { year: "2022", focus: isEnglish ? "High vacancy volume" : "Alto volumen de vacantes", items: ["Grupo Éxito / Olímpica", "Alkosto / Corbeta", "Teleperformance / Konecta", "Eficacia / Activos"] },
    { year: "2023", focus: isEnglish ? "Employment stabilization" : "Estabilización del empleo", items: isEnglish ? ["Grupo Éxito", "Teleperformance", "Bancolombia", "Claro / Movistar", "Temporary staffing remains strong"] : ["Grupo Éxito", "Teleperformance", "Bancolombia", "Claro / Movistar", "Temporales siguen fuertes"] },
    { year: "2024", focus: isEnglish ? "Steady volume" : "Volumen constante", items: ["Grupo Éxito", "Eficacia / Activos", "Teleperformance / Konecta", "Sodimac", "Olímpica"] },
    { year: "2025", focus: isEnglish ? "Stability + digitalization" : "Estabilidad + digitalización", items: isEnglish ? ["Grupo Éxito / Ara / D1", "Teleperformance / BPOs", "Bancolombia / SURA", "Tech companies (lower volume)", "Last-mile logistics"] : ["Grupo Éxito / Ara / D1", "Teleperformance / BPOs", "Bancolombia / SURA", "Empresas tech (menor volumen)", "Logística de última milla"] },
    { year: "2026", focus: isEnglish ? "Current" : "Actual", items: isEnglish ? ["Grupo Éxito", "Teleperformance / Konecta", "Retail (D1, Ara, Olímpica)", "Logistics (last mile, e-commerce)", "Technology companies (growing)"] : ["Grupo Éxito", "Teleperformance / Konecta", "Retail (D1, Ara, Olímpica)", "Logística (última milla, e-commerce)", "Empresas tecnológicas (creciendo)"] },
  ];

  return (
    <div className={isDark ? "mt-4 rounded-[1rem] border border-white/8 bg-white/[0.03] p-3" : "mt-4 rounded-[1rem] border border-slate-200 bg-slate-50/90 p-3"}>
      <div className="grid gap-3 xl:grid-cols-2">
        {companiesByYear.map((block) => (
          <div
            key={block.year}
            className={
              isDark
                ? "rounded-[1.1rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-3"
                : "rounded-[1.1rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] px-4 py-3"
            }
          >
            <div className="flex items-center justify-between gap-3">
              <span className={isDark ? "inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-cyan-400/12 px-2.5 text-[11px] font-semibold text-cyan-200" : "inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-sky-100 px-2.5 text-[11px] font-semibold text-sky-700"}>
                {block.year}
              </span>
              <span className={isDark ? "text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400" : "text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500"}>
                {block.focus}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {block.items.map((item, itemIndex) => (
                <div key={`${block.year}-${item}`} className={isDark ? "inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5" : "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5"}>
                  <span className={isDark ? "h-2 w-2 shrink-0 rounded-full bg-cyan-300" : "h-2 w-2 shrink-0 rounded-full bg-sky-600"} style={{ opacity: 1 - itemIndex * 0.1 }} />
                  <span className={isDark ? "text-[11px] leading-5 text-slate-200" : "text-[11px] leading-5 text-slate-700"}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LaborConditionsCard({ isDark }: SpecializedCardProps) {
  const { isEnglish } = useAppLanguage();
  const timeline = [
    { year: "2020", title: isEnglish ? "Pandemic" : "Pandemia", focus: isEnglish ? "Strong shock" : "Choque fuerte", items: isEnglish ? ["Sharp employment drop (DANE)", "Contract suspensions", "Higher informality", "Remote-work surge"] : ["Caída fuerte del empleo (DANE)", "Suspensión de contratos", "Aumento de informalidad", "Auge del teletrabajo"] },
    { year: "2021", title: isEnglish ? "Reactivation" : "Reactivación", focus: isEnglish ? "Employment recovery" : "Recuperación del empleo", items: isEnglish ? ["Fixed-term contracts remained dominant", "Gradual return to on-site work", "Informality still high"] : ["Predominio de contratos a término fijo", "Regreso progresivo a presencialidad", "Informalidad aún alta"] },
    { year: "2022", title: isEnglish ? "Strong recovery" : "Recuperación fuerte", focus: isEnglish ? "Higher momentum" : "Mayor dinamismo", items: isEnglish ? ["Formal employment increased", "Stability improved", "Minimum wage increased", "Higher economic momentum"] : ["Aumento del empleo formal", "Mejora en estabilidad", "Incremento del salario mínimo", "Mayor dinamismo económico"] },
    { year: "2023", title: isEnglish ? "Stabilization" : "Estabilización", focus: isEnglish ? "Moderate growth" : "Crecimiento moderado", items: isEnglish ? ["Formal contracts (fixed-term + some permanent)", "Higher experience requirements", "Partial recovery of real income"] : ["Contratos formales (fijo + algunos indefinidos)", "Mayor exigencia de experiencia", "Recuperación parcial de ingresos reales"] },
    { year: "2024", title: isEnglish ? "Slowdown" : "Desaceleración", focus: isEnglish ? "Selective hiring" : "Contratación selectiva", items: isEnglish ? ["Lower employment growth", "More selective hiring", "Wages growing below inflation", "Hybrid work limited to certain sectors"] : ["Menor crecimiento del empleo", "Contratación más selectiva", "Salarios creciendo por debajo de inflación", "Modalidad híbrida limitada a ciertos sectores"] },
    { year: "2025", title: isEnglish ? "Market adjustment" : "Ajuste del mercado", focus: isEnglish ? "Lower momentum" : "Menor dinamismo", items: isEnglish ? ["Stability with lower momentum", "Greater use of formal contracts in large companies", "Informality persists (~55%)", "Higher demand for digital skills"] : ["Estabilidad con menor dinamismo", "Mayor uso de contratos formales en grandes empresas", "Persistencia de informalidad (~55%)", "Mayor demanda de habilidades digitales"] },
    { year: "2026", title: isEnglish ? "Current" : "Actual", focus: isEnglish ? "General stability" : "Estabilidad general", items: isEnglish ? ["General employment stability", "Unemployment around 10-11%", "Informality gaps persist", "Low wages in operational roles", "Hybrid work is present but not dominant"] : ["Estabilidad general del empleo", "Desempleo alrededor de 10–11%", "Persisten brechas de informalidad", "Bajos salarios en empleos operativos", "Modelo híbrido presente pero no dominante"] },
  ];

  return (
    <div className={isDark ? "mt-4 rounded-[1rem] border border-white/8 bg-white/[0.03] p-3" : "mt-4 rounded-[1rem] border border-slate-200 bg-slate-50/90 p-3"}>
      <div className="touch-scroll-x overflow-x-auto">
        <div className="relative min-w-[940px] px-2 py-2">
          <div className={isDark ? "absolute left-8 right-8 top-10 h-[2px] bg-gradient-to-r from-cyan-400/50 via-sky-400/40 to-cyan-300/50" : "absolute left-8 right-8 top-10 h-[2px] bg-gradient-to-r from-sky-300 via-cyan-300 to-sky-400"} />
          <div className="grid grid-cols-7 gap-3">
            {timeline.map((block, index) => (
              <div key={block.year} className="relative">
                <div className="mx-auto flex w-full justify-center">
                  <span className={isDark ? "relative z-[1] inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/20 bg-[#0b1729] text-[11px] font-semibold text-cyan-200" : "relative z-[1] inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 bg-white text-[11px] font-semibold text-sky-700"}>
                    {index + 1}
                  </span>
                </div>
                <div className={isDark ? "mt-4 rounded-[1.05rem] border border-white/6 bg-black/10 p-3" : "mt-4 rounded-[1.05rem] border border-slate-200 bg-white/85 p-3"}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={isDark ? "text-[11px] font-semibold uppercase tracking-[0.08em] text-cyan-200" : "text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-700"}>{block.year}</p>
                    <p className={isDark ? "text-[10px] font-medium uppercase tracking-[0.06em] text-slate-400" : "text-[10px] font-medium uppercase tracking-[0.06em] text-slate-500"}>{block.focus}</p>
                  </div>
                  <p className={isDark ? "mt-1 text-sm font-semibold text-slate-100" : "mt-1 text-sm font-semibold text-slate-900"}>{block.title}</p>
                  <div className="mt-3 space-y-2">
                    {block.items.map((item, itemIndex) => (
                      <div key={`${block.year}-${item}`} className="flex items-start gap-2">
                        <span className={isDark ? "mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300" : "mt-1 h-2 w-2 shrink-0 rounded-full bg-sky-600"} style={{ opacity: 1 - itemIndex * 0.12 }} />
                        <span className={isDark ? "text-[11px] leading-5 text-slate-300" : "text-[11px] leading-5 text-slate-700"}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
