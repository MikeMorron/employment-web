"use client";

import { useAppLanguage } from "@/hooks/use-app-language";
import type { SpecializedCardProps } from "@/components/sections/market-panorama/cards-specialized-shared";

export function EducationDemandCard({ isDark }: SpecializedCardProps) {
  const { isEnglish } = useAppLanguage();
  const rows = [
    { year: "2020", text: isEnglish ? "High school" : "Bachiller" },
    { year: "2021", text: isEnglish ? "High school / technical" : "Bachiller / técnico" },
    { year: "2022", text: isEnglish ? "Technical / technologist" : "Técnico / tecnólogo" },
    { year: "2023", text: isEnglish ? "Technical / technologist" : "Técnico / tecnólogo" },
    { year: "2024", text: isEnglish ? "Technical / technologist + professional" : "Técnico/tecnólogo + profesional" },
    { year: "2025", text: isEnglish ? "Technical / technologist" : "Técnico / tecnólogo" },
    { year: "2026", text: isEnglish ? "Technical / technologist" : "Técnico / tecnólogo" },
  ];

  return (
    <div className={isDark ? "mt-4 rounded-[1rem] border border-white/8 bg-white/[0.03] p-3" : "mt-4 rounded-[1rem] border border-slate-200 bg-slate-50/90 p-3"}>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.year} className={isDark ? "rounded-xl border border-white/6 bg-black/10 px-3 py-2.5" : "rounded-xl border border-slate-200 bg-white/85 px-3 py-2.5"}>
            <div className="flex items-start gap-2.5">
              <span className={isDark ? "inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-cyan-400/12 px-2 text-[11px] font-semibold text-cyan-200" : "inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-sky-100 px-2 text-[11px] font-semibold text-sky-700"}>
                {row.year}
              </span>
              <span className={isDark ? "pt-0.5 text-[11px] leading-5 text-slate-300" : "pt-0.5 text-[11px] leading-5 text-slate-700"}>
                {row.text}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className={isDark ? "mt-3 text-[11px] leading-5 text-slate-400" : "mt-3 text-[11px] leading-5 text-slate-600"}>
        {isEnglish ? "Technical and operational profiles remain dominant, while professional roles carry less relative weight in vacancy volume." : "Predominan perfiles técnicos y operativos, con menor peso relativo de profesionales en volumen de vacantes."}
      </p>
    </div>
  );
}

export function SalaryBySectorCard({ isDark }: SpecializedCardProps) {
  const { isEnglish } = useAppLanguage();
  const groups = [
    {
      title: isEnglish ? "Best-paid sectors" : "Sectores mejor pagados",
      items: [
        { sector: isEnglish ? "Technology (ICT)" : "Tecnología (TIC)", range: "$2.5M – $5M", note: isEnglish ? "Senior or specialized roles can reach $5M–$8M+." : "Perfiles senior o especializados pueden llegar a $5M–$8M+." },
        { sector: isEnglish ? "Finance" : "Finanzas", range: "$2M – $4M", note: isEnglish ? "Senior banking roles can move between $4M and $6M." : "Roles senior en banca pueden moverse entre $4M y $6M." },
        { sector: isEnglish ? "Energy / mining" : "Energía / minería", range: "$2.5M – $5M", note: isEnglish ? "Field engineers and senior specialists can exceed $5M." : "Ingenieros de campo y especialistas senior pueden superar $5M." },
      ],
    },
    {
      title: isEnglish ? "Mid-range sectors" : "Sectores de rango medio",
      items: [
        { sector: isEnglish ? "Industry / manufacturing" : "Industria / manufactura", range: "$1.5M – $2.3M", note: isEnglish ? "Operational roles; supervision can reach $3.5M." : "Operativo; la supervisión puede llegar a $3.5M." },
        { sector: isEnglish ? "Construction" : "Construcción", range: "$1.3M – $2M", note: isEnglish ? "Technical or site roles can reach $3M." : "Perfiles técnicos o de residencia pueden llegar a $3M." },
        { sector: isEnglish ? "Healthcare" : "Salud", range: "$1.5M – $2.5M", note: isEnglish ? "Professional healthcare roles can move between $2.5M and $4M." : "Profesionales de salud pueden moverse entre $2.5M y $4M." },
      ],
    },
    {
      title: isEnglish ? "Lower-paid sectors" : "Sectores con menor nivel salarial",
      items: [
        { sector: isEnglish ? "Trade" : "Comercio", range: "$1M – $1.5M", note: isEnglish ? "Retail and front-line sales." : "Ventas y retail de primera línea." },
        { sector: isEnglish ? "Services" : "Servicios", range: "$1M – $1.4M", note: isEnglish ? "BPO and customer support." : "BPO y atención al cliente." },
        { sector: isEnglish ? "Logistics" : "Logística", range: "$1.1M – $1.7M", note: isEnglish ? "Operational and support roles." : "Perfiles operativos y de apoyo." },
      ],
    },
  ];

  return (
    <div className="mt-4 grid gap-3 xl:grid-cols-3">
      {groups.map((group) => (
        <div key={group.title} className={isDark ? "rounded-[1.05rem] border border-white/8 bg-white/[0.03] px-4 py-3" : "rounded-[1.05rem] border border-slate-200 bg-slate-50/90 px-4 py-3"}>
          <p className={isDark ? "text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-100" : "text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-900"}>{group.title}</p>
          <div className="mt-3 space-y-3">
            {group.items.map((item) => (
              <div key={item.sector}>
                <p className={isDark ? "text-[11px] font-semibold text-slate-100" : "text-[11px] font-semibold text-slate-900"}>{item.sector}</p>
                <p className={isDark ? "mt-0.5 text-[11px] font-medium text-slate-200" : "mt-0.5 text-[11px] font-medium text-slate-700"}>{item.range}</p>
                <p className={isDark ? "mt-0.5 text-[10px] leading-5 text-slate-400" : "mt-0.5 text-[10px] leading-5 text-slate-500"}>{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SalaryByExperienceCard({ isDark }: SpecializedCardProps) {
  const { isEnglish } = useAppLanguage();
  const rows = [
    { title: isEnglish ? "Junior (0–2 years)" : "Junior (0–2 años)", range: "$1.2M – $2.2M", bullets: [isEnglish ? "First job or low experience." : "Primer empleo o baja experiencia."] },
    { title: isEnglish ? "Mid-level (2–5 years)" : "Semi-senior (2–5 años)", range: "$2M – $3.5M", bullets: [isEnglish ? "Higher responsibility and stability." : "Mayor responsabilidad y estabilidad."] },
    { title: isEnglish ? "Senior (5+ years)" : "Senior (5+ años)", range: "$3.5M – $6M", bullets: [isEnglish ? "High specialization and decision-making." : "Alta especialización y toma de decisiones."] },
    { title: isEnglish ? "Executives / experts" : "Ejecutivos / expertos", range: "$6M – $15M+", bullets: [isEnglish ? "Strategic and leadership roles; very high salaries are niche." : "Roles estratégicos y de liderazgo; salarios muy altos son nicho."] },
  ];

  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-2">
      {rows.map((row) => (
        <div key={row.title} className={isDark ? "rounded-[1.05rem] border border-white/8 bg-white/[0.03] px-4 py-3" : "rounded-[1.05rem] border border-slate-200 bg-slate-50/90 px-4 py-3"}>
          <p className={isDark ? "text-[11px] font-semibold text-slate-100" : "text-[11px] font-semibold text-slate-900"}>{row.title}</p>
          <p className={isDark ? "mt-1 text-[12px] font-semibold text-slate-200" : "mt-1 text-[12px] font-semibold text-slate-700"}>{row.range}</p>
          <div className="mt-3 space-y-2">
            {row.bullets.map((bullet) => (
              <div key={bullet} className="flex items-start gap-2.5">
                <span className={isDark ? "mt-1.5 h-2 w-2 rounded-full bg-cyan-300" : "mt-1.5 h-2 w-2 rounded-full bg-sky-600"} />
                <span className={isDark ? "text-[11px] leading-5 text-slate-300" : "text-[11px] leading-5 text-slate-700"}>{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RealSalaryVsInflationCard({ isDark }: SpecializedCardProps) {
  const { isEnglish } = useAppLanguage();
  const rows = [
    { year: "2020", value: "+1–2%", text: isEnglish ? "Approximate real change." : "Cambio real aproximado." },
    { year: "2021", value: "+3–4%", text: isEnglish ? "Approximate real change." : "Cambio real aproximado." },
    { year: "2022", value: "+2–3%", text: isEnglish ? "Adjusted for inflation." : "Ajustado por inflación." },
    { year: "2023", value: "+2–3%", text: isEnglish ? "Moderate real increase." : "Aumento real moderado." },
    { year: "2024", value: "+3–4%", text: isEnglish ? "Clear real improvement." : "Mejora real clara." },
    { year: "2025", value: "+2–4%", text: isEnglish ? "Approximate real increase." : "Aumento real aproximado." },
  ];

  return (
    <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.year} className={isDark ? "rounded-xl border border-white/6 bg-black/10 px-3 py-2.5" : "rounded-xl border border-slate-200 bg-white/85 px-3 py-2.5"}>
          <div className="flex items-center justify-between gap-2">
            <span className={isDark ? "text-[11px] font-semibold text-slate-100" : "text-[11px] font-semibold text-slate-900"}>{row.year}</span>
            <span className={isDark ? "text-[11px] font-semibold text-emerald-300" : "text-[11px] font-semibold text-emerald-700"}>{row.value}</span>
          </div>
          <p className={isDark ? "mt-1 text-[11px] leading-5 text-slate-400" : "mt-1 text-[11px] leading-5 text-slate-600"}>{row.text}</p>
        </div>
      ))}
    </div>
  );
}

export function ToolsByAreaCard({ isDark }: SpecializedCardProps) {
  const { isEnglish } = useAppLanguage();
  const areas = [
    { title: isEnglish ? "Engineering and technology" : "Ingeniería y tecnología", certifications: ["Scrum / Agile", "Cisco (CCNA)", "Microsoft / Google"], tools: isEnglish ? ["Python, Java, SQL", "Power BI, advanced Excel", "Git, Docker"] : ["Python, Java, SQL", "Power BI, Excel avanzado", "Git, Docker"] },
    { title: isEnglish ? "Administration, accounting, and finance" : "Administración, contabilidad y finanzas", certifications: isEnglish ? ["SENA (accounting / admin)", "IFRS", "Banking certifications"] : ["SENA (contable / administrativo)", "NIIF", "Certificaciones bancarias"], tools: isEnglish ? ["Advanced Excel", "SAP, Siigo, Helisa", "Accounting software"] : ["Excel avanzado", "SAP, Siigo, Helisa", "Software contable"] },
    { title: isEnglish ? "Commerce, sales, and marketing" : "Comercio, ventas y marketing", certifications: isEnglish ? ["SENA (sales, customer service)", "Google Ads / Meta Ads", "HubSpot / digital marketing"] : ["SENA (ventas, servicio al cliente)", "Google Ads / Meta Ads", "HubSpot / marketing digital"], tools: isEnglish ? ["CRM (Salesforce, HubSpot)", "Social media", "E-commerce platforms"] : ["CRM (Salesforce, HubSpot)", "Redes sociales", "Plataformas e-commerce"] },
    { title: isEnglish ? "Healthcare" : "Salud", certifications: isEnglish ? ["CPR / first aid", "SENA healthcare courses", "Specific clinical certifications"] : ["RCP / primeros auxilios", "Cursos SENA en salud", "Certificaciones clínicas específicas"], tools: isEnglish ? ["Hospital systems", "Digital medical records"] : ["Sistemas hospitalarios", "Historias clínicas digitales"] },
    { title: isEnglish ? "Logistics, industry, and construction" : "Logística, industria y construcción", certifications: isEnglish ? ["SENA (operations / logistics)", "C1, C2, C3 licenses", "Working at heights"] : ["SENA (operativo / logístico)", "Licencias C1, C2, C3", "Trabajo en alturas"], tools: isEnglish ? ["Inventory systems", "Machinery and equipment", "Basic logistics software"] : ["Sistemas de inventario", "Maquinaria y equipos", "Software logístico básico"] },
    { title: isEnglish ? "Education and training" : "Educación y formación", certifications: isEnglish ? ["Teaching degrees / pedagogy training", "SENA courses / diplomas"] : ["Licenciaturas / formación pedagógica", "Cursos SENA / diplomados"], tools: isEnglish ? ["Moodle, Teams", "Digital education tools"] : ["Moodle, Teams", "Herramientas digitales educativas"] },
  ];

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-3 xl:grid-cols-2">
        {areas.map((area) => (
          <div key={area.title} className={isDark ? "rounded-[1.05rem] border border-white/8 bg-white/[0.03] px-4 py-3" : "rounded-[1.05rem] border border-slate-200 bg-slate-50/90 px-4 py-3"}>
            <p className={isDark ? "text-[11px] font-semibold text-slate-100" : "text-[11px] font-semibold text-slate-900"}>{area.title}</p>
            <p className={isDark ? "mt-3 text-[10px] uppercase tracking-[0.1em] text-slate-400" : "mt-3 text-[10px] uppercase tracking-[0.1em] text-slate-500"}>{isEnglish ? "Certifications" : "Certificaciones"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {area.certifications.map((item) => (
                <span key={item} className={isDark ? "rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[11px] text-slate-200" : "rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700"}>{item}</span>
              ))}
            </div>
            <p className={isDark ? "mt-3 text-[10px] uppercase tracking-[0.1em] text-slate-400" : "mt-3 text-[10px] uppercase tracking-[0.1em] text-slate-500"}>{isEnglish ? "Tools" : "Herramientas"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {area.tools.map((item) => (
                <span key={item} className={isDark ? "rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] text-cyan-100" : "rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] text-sky-700"}>{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={isDark ? "rounded-[1.15rem] border border-emerald-300/16 bg-emerald-400/10 px-4 py-4" : "rounded-[1.15rem] border border-emerald-200 bg-emerald-50 px-4 py-4"}>
        <p className={isDark ? "text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200" : "text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800"}>{isEnglish ? "Key insight" : "Insight clave"}</p>
        <p className={isDark ? "mt-2 text-[12px] leading-6 text-emerald-50" : "mt-2 text-[12px] leading-6 text-emerald-900"}>
          {isEnglish ? "You do not need dozens of certifications: in Colombia, tools like Excel, CRM, and operational skills often carry more weight than extra credentials in many roles." : "No necesitas decenas de certificaciones: en Colombia, herramientas como Excel, CRM y habilidades operativas pesan más que títulos adicionales en muchos roles."}
        </p>
      </div>
    </div>
  );
}

export function DemandVsSalaryCard({ isDark }: SpecializedCardProps) {
  const { isEnglish } = useAppLanguage();
  const opportunities = [
    { role: isEnglish ? "Sales / commercial advisor" : "Ventas / asesor comercial", salary: "$1.3M – $2.2M", share: 18 },
    { role: isEnglish ? "Customer service / call center" : "Servicio al cliente / call center", salary: "$1.2M – $1.8M", share: 15 },
    { role: isEnglish ? "Operators / production" : "Operarios / producción", salary: "$1.2M – $1.7M", share: 14 },
    { role: isEnglish ? "Logistics (warehouse, delivery, picking)" : "Logística (bodega, reparto, picking)", salary: "$1.2M – $1.8M", share: 12 },
    { role: isEnglish ? "Administrative assistant" : "Auxiliar administrativo", salary: "$1.4M – $2.3M", share: 10 },
    { role: isEnglish ? "Construction (field, helpers)" : "Construcción (obra, ayudantes)", salary: "$1.3M – $2.0M", share: 8 },
    { role: isEnglish ? "Healthcare (assistants, technicians)" : "Salud (auxiliares, técnicos)", salary: "$1.5M – $2.8M", share: 7 },
    { role: isEnglish ? "Security" : "Seguridad (vigilancia)", salary: "$1.2M – $1.6M", share: 6 },
    { role: isEnglish ? "Accounting / finance support" : "Contabilidad / apoyo financiero", salary: "$1.8M – $3.0M", share: 5 },
    { role: isEnglish ? "Technology (support, junior dev+)" : "Tecnología (soporte, desarrollo junior+)", salary: "$2.5M – $5.0M", share: 3 },
    { role: isEnglish ? "Digital marketing / e-commerce" : "Marketing digital / e-commerce", salary: "$2.0M – $4.0M", share: 2 },
  ];

  return (
    <div className={isDark ? "mt-4 rounded-[1rem] border border-white/8 bg-white/[0.03] p-4" : "mt-4 rounded-[1rem] border border-slate-200 bg-slate-50/90 p-4"}>
      <div className="grid gap-2.5 xl:grid-cols-3">
        {opportunities.map((item, index) => (
          <div key={item.role} className={isDark ? "grid min-h-[5rem] grid-cols-[1.7rem_minmax(0,1fr)] gap-x-2.5 gap-y-1.5 rounded-[0.95rem] border border-white/6 bg-black/10 px-2.5 py-2.5" : "grid min-h-[5rem] grid-cols-[1.7rem_minmax(0,1fr)] gap-x-2.5 gap-y-1.5 rounded-[0.95rem] border border-slate-200 bg-white/85 px-2.5 py-2.5"}>
            <span className={isDark ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-400/12 text-[10px] font-semibold text-cyan-200" : "inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-[10px] font-semibold text-sky-700"}>{index + 1}</span>
            <div className="min-w-0">
              <p className={isDark ? "text-[10px] font-semibold leading-5 text-slate-100" : "text-[10px] font-semibold leading-5 text-slate-900"}>{item.role}</p>
              <p className={isDark ? "text-[10px] text-slate-400" : "text-[10px] text-slate-600"}>{item.salary}</p>
            </div>
            <span className={isDark ? "col-start-2 text-[10px] font-semibold text-slate-200" : "col-start-2 text-[10px] font-semibold text-slate-800"}>{item.share}%</span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className={isDark ? "rounded-xl border border-white/6 bg-black/10 px-4 py-4" : "rounded-xl border border-slate-200 bg-white/85 px-4 py-4"}>
          <p className={isDark ? "text-[12px] font-semibold text-slate-100" : "text-[12px] font-semibold text-slate-900"}>{isEnglish ? "How to read this" : "Cómo leer esto"}</p>
          <div className="mt-3 space-y-2.5">
            {[
              isEnglish ? "Higher volume does not mean better salaries." : "Mayor volumen no significa mejores salarios.",
              isEnglish ? "Most opportunities stay between COP $1.2M and $2M." : "La mayoría de oportunidades están entre $1.2M y $2M.",
              isEnglish ? "Higher salaries are concentrated in technology, finance, and specialized roles, but with low participation." : "Los salarios altos se concentran en tecnología, finanzas y roles especializados, pero con baja participación.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <span className={isDark ? "mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400" : "mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-500"} />
                <p className={isDark ? "text-[11px] leading-5 text-slate-300" : "text-[11px] leading-5 text-slate-700"}>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={isDark ? "rounded-xl border border-white/6 bg-black/10 px-4 py-4" : "rounded-xl border border-slate-200 bg-white/85 px-4 py-4"}>
          <p className={isDark ? "text-[12px] font-semibold text-slate-100" : "text-[12px] font-semibold text-slate-900"}>{isEnglish ? "Key insight" : "Insight clave"}</p>
          <p className={isDark ? "mt-3 text-[12px] leading-6 text-slate-200" : "mt-3 text-[12px] leading-6 text-slate-800"}>
            {isEnglish ? "More than 60% of vacancies in Colombia are concentrated in operational, commercial, and service roles, with salaries close to the minimum wage." : "Más del 60% de las vacantes en Colombia están en roles operativos, comerciales y de servicio, con salarios cercanos al mínimo."}
          </p>
        </div>
      </div>
    </div>
  );
}

export function MarketTrend2026Card({ isDark }: SpecializedCardProps) {
  const { isEnglish } = useAppLanguage();
  const blocks = [
    { title: isEnglish ? "Minimum wage history" : "Historial del salario mínimo", items: ["2020: $877.803", "2021: $908.526", "2022: $1.000.000", "2023: $1.160.000", "2024: $1.300.000", "2025: $1.423.500", isEnglish ? "2026: COP $1,750,905 (Current)" : "2026: $1.750.905 COP (Vigente)"] },
    { title: isEnglish ? "Minimum wage 2026" : "Salario mínimo 2026", items: [isEnglish ? "Estimated range, pending final definition" : "Rango estimado, aún por definir", isEnglish ? "≈ COP $1.600.000 – $1.750.000" : "≈ $1.600.000 – $1.750.000", isEnglish ? "Read 2026 as provisional." : "Lee 2026 como dato provisional."] },
    { title: isEnglish ? "Average labor income" : "Ingreso laboral promedio", items: [isEnglish ? "2020: COP $0.9M – $1.1M" : "2020: $900k – $1.1M", isEnglish ? "2023: COP $1.3M – $1.5M" : "2023: $1.3M – $1.5M", isEnglish ? "2026: COP $1.4M – $1.7M" : "2026: $1.4M – $1.7M"] },
  ];

  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-3">
      {blocks.map((block) => (
        <div key={block.title} className={isDark ? "rounded-[1.05rem] border border-white/8 bg-white/[0.03] px-4 py-3" : "rounded-[1.05rem] border border-slate-200 bg-slate-50/90 px-4 py-3"}>
          <p className={isDark ? "text-[11px] font-semibold text-slate-100" : "text-[11px] font-semibold text-slate-900"}>{block.title}</p>
          <div className="mt-3 space-y-2">
            {block.items.map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <span className={isDark ? "mt-1.5 h-2 w-2 rounded-full bg-cyan-300" : "mt-1.5 h-2 w-2 rounded-full bg-sky-600"} />
                <p className={isDark ? "text-[11px] leading-5 text-slate-300" : "text-[11px] leading-5 text-slate-700"}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
