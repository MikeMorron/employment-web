import type { Vacancy } from "@/types/vacancy";
import {
  detectTextLanguage,
  translateJobText,
  type SupportedLanguage,
} from "@/lib/i18n/realtime-job-translation";

const PHRASE_REPLACEMENTS: Array<[string, string]> = [
  ["Recursos Humanos", "Human Resources"],
  ["Salud y Medicina", "Health and Medicine"],
  ["Seguridad y Defensa", "Security and Defense"],
  ["Servicios Personales y Generales", "Personal and General Services"],
  ["Tecnología e Informática", "Technology and IT"],
  ["Minería y Petróleo", "Mining and Oil"],
  ["Turismo y Viajes", "Tourism and Travel"],
  ["Logística y Transporte", "Logistics and Transport"],
  ["Medio Ambiente y Sostenibilidad", "Environment and Sustainability"],
  ["Medicina Preventiva", "Preventive Medicine"],
  ["Seguridad de la Información", "Information Security"],
  ["Seguridad Informática", "IT Security"],
  ["Cloud Computing", "Cloud Computing"],
  ["People Analytics", "People Analytics"],
  ["HR Analytics", "HR Analytics"],
  ["HR Digital", "HR Digital"],
  ["QA y Testing", "QA and Testing"],
  ["Desarrollo Full Stack", "Full Stack Development"],
  ["Desarrollo Frontend", "Frontend Development"],
  ["Desarrollo Backend", "Backend Development"],
  ["Desarrollo Web", "Web Development"],
  ["Desarrollo Mobile", "Mobile Development"],
  ["Desarrollo de Software", "Software Development"],
  ["Ingeniería de Software", "Software Engineering"],
  ["Arquitectura de Software", "Software Architecture"],
  ["Aseguramiento de Calidad de Software", "Software Quality Assurance"],
  ["Automatización de Pruebas", "Test Automation"],
  ["Bases de Datos", "Databases"],
  ["Administración de Bases de Datos", "Database Administration"],
  ["Ingeniería de Datos", "Data Engineering"],
  ["Ciencia de Datos", "Data Science"],
  ["Analítica de Datos", "Data Analytics"],
  ["Inteligencia Artificial", "Artificial Intelligence"],
  ["Computación en la Nube", "Cloud Computing"],
  ["Administración de Sistemas", "Systems Administration"],
  ["Redes Informáticas", "Computer Networks"],
  ["Ingeniería de Redes", "Network Engineering"],
  ["Gestión de TI", "IT Management"],
  ["Gobierno de TI", "IT Governance"],
  ["Gestión de Proyectos IT", "IT Project Management"],
  ["Gestión de Proyectos", "Project Management"],
  ["Seguridad Industrial", "Industrial Safety"],
  ["Gestión Ambiental", "Environmental Management"],
  ["Gestión Ambiental Minera y Petrolera", "Mining and Oil Environmental Management"],
  ["Petróleo y Gas", "Oil and Gas"],
  ["Petróleo y Gas (Upstream)", "Oil and Gas (Upstream)"],
  ["Petróleo y Gas (Midstream)", "Oil and Gas (Midstream)"],
  ["Petróleo y Gas (Downstream)", "Oil and Gas (Downstream)"],
  ["Exploración Minera", "Mining Exploration"],
  ["Explotación Minera", "Mining Extraction"],
  ["Procesamiento de Minerales", "Mineral Processing"],
  ["Geología Aplicada", "Applied Geology"],
  ["Ingeniería de Minas", "Mining Engineering"],
  ["Ingeniería de Petróleos", "Petroleum Engineering"],
  ["Infraestructura Minera y Petrolera", "Mining and Oil Infrastructure"],
  ["Economía de Recursos Naturales", "Natural Resources Economics"],
  ["Gestión de Proyectos Extractivos", "Extractive Project Management"],
  ["Comercio de Recursos Naturales", "Natural Resources Trade"],
  ["Gestión del Desempeño", "Performance Management"],
  ["Evaluación de Desempeño", "Performance Evaluation"],
  ["Desarrollo de Talento", "Talent Development"],
  ["Capacitación y Formación", "Training and Development"],
  ["Planes de Carrera", "Career Planning"],
  ["Alta demanda", "High demand"],
  ["Cultura Organizacional", "Organizational Culture"],
  ["Compensación y Beneficios", "Compensation and Benefits"],
  ["Gestión del Cambio Organizacional", "Organizational Change Management"],
  ["Gestión de Diversidad e Inclusión", "Diversity and Inclusion Management"],
  ["Offboarding y Desvinculación", "Offboarding and Separation"],
  ["Coaching Organizacional", "Organizational Coaching"],
  ["Atención al Cliente", "Customer Service"],
  ["Calidad de Servicio", "Service Quality"],
  ["Cadena de Suministro", "Supply Chain"],
  ["Cumplimiento", "Compliance"],
  ["Monitoreo", "Monitoring"],
  ["Coordinación", "Coordination"],
  ["Organización", "Organization"],
  ["Comunicación", "Communication"],
  ["Operación", "Operations"],
  ["Análisis", "Analysis"],
  ["Diseño de Soluciones", "Solution Design"],
  ["Normativa", "Regulations"],
  ["Optimización", "Optimization"],
  ["Atención Clínica", "Clinical Care"],
  ["Diagnóstico", "Diagnostics"],
  ["Protocolos", "Protocols"],
  ["Rehabilitación", "Rehabilitation"],
  ["Promoción y Prevención", "Prevention and Health Promotion"],
  ["Gestión de Riesgos", "Risk Management"],
  ["Protección", "Protection"],
  ["Reservas", "Reservations"],
  ["Hospitalidad", "Hospitality"],
  ["Planeación", "Planning"],
  ["Inventarios", "Inventory"],
  ["Despacho", "Dispatch"],
  ["Seguimiento", "Follow-up"],
  ["Indicadores", "Metrics"],
  ["Sostenibilidad", "Sustainability"],
  ["Reportería", "Reporting"],
  ["Especialista en ", "Specialist in "],
  ["Coordinador/a de ", "Coordinator of "],
  ["Analista de ", "Analyst of "],
  ["Profesional de ", "Professional in "],
  ["Líder de ", "Lead of "],
  ["Rol enfocado en ", "Role focused on "],
  ["Vacante orientada a ", "Opening focused on "],
  ["Posición para gestionar ", "Position to manage "],
  ["dentro del frente de ", "within the "],
  ["con ejecución operativa, seguimiento a indicadores y coordinación transversal.", "with operational execution, metric follow-up, and cross-functional coordination."],
  ["con foco en cumplimiento, articulación de equipos y mejora continua dentro de ", "focused on compliance, team coordination, and continuous improvement within "],
  ["con criterios de calidad, control de procesos y soporte al crecimiento del frente de ", "with quality criteria, process control, and support for the growth of the "],
  ["Responsabilidades clave: ", "Key responsibilities: "],
  ["Coordinar actividades de ", "Coordinate activities in "],
  ["alineadas al frente de ", "aligned with the "],
  ["Dar seguimiento a indicadores, cumplimiento y necesidades del área de ", "Follow up on metrics, compliance, and area needs for "],
  ["Articular trabajo con equipos operativos y de soporte para ", "Coordinate work with operations and support teams for "],
  ["mantiene una búsqueda activa para perfiles de ", "is actively hiring profiles in "],
  ["mantiene una busqueda activa para perfiles de ", "is actively hiring profiles in "],
  ["en el frente de ", "within the "],
];

const WORD_REPLACEMENTS: Array<[string, string]> = [
  ["Y", "And"],
  ["De", "Of"],
  ["En", "In"],
  ["Con", "With"],
  ["Para", "For"],
  ["Gestión", "Management"],
  ["Ingeniería", "Engineering"],
  ["Desarrollo", "Development"],
  ["Administración", "Administration"],
  ["Administrativo", "Administrative"],
  ["Ambiental", "Environmental"],
  ["Industrial", "Industrial"],
  ["General", "General"],
  ["Seguridad", "Security"],
  ["Defensa", "Defense"],
  ["Minería", "Mining"],
  ["Petróleo", "Oil"],
  ["Petróleos", "Petroleum"],
  ["Telecomunicaciones", "Telecommunications"],
  ["Tecnología", "Technology"],
  ["Informática", "IT"],
  ["Recursos", "Resources"],
  ["Humanos", "Human"],
  ["Salud", "Health"],
  ["Medicina", "Medicine"],
  ["Logística", "Logistics"],
  ["Transporte", "Transport"],
  ["Turismo", "Tourism"],
  ["Viajes", "Travel"],
  ["Servicios", "Services"],
  ["Personales", "Personal"],
  ["Sostenibilidad", "Sustainability"],
  ["Análisis", "Analysis"],
  ["Analítica", "Analytics"],
  ["Analítica", "Analytics"],
  ["Analista", "Analyst"],
  ["Especialista", "Specialist"],
  ["Profesional", "Professional"],
  ["Líder", "Lead"],
  ["Coordinador", "Coordinator"],
  ["Coordinadora", "Coordinator"],
  ["Operaciones", "Operations"],
  ["Operación", "Operations"],
  ["Software", "Software"],
  ["Datos", "Data"],
  ["Nube", "Cloud"],
  ["Redes", "Networks"],
  ["Sistema", "System"],
  ["Sistemas", "Systems"],
  ["Producto", "Product"],
  ["Productos", "Products"],
  ["Digital", "Digital"],
  ["Digitales", "Digital"],
  ["Infraestructura", "Infrastructure"],
  ["Automatización", "Automation"],
  ["Calidad", "Quality"],
  ["Pruebas", "Testing"],
  ["Bases", "Databases"],
  ["Base", "Database"],
  ["Inteligencia", "Intelligence"],
  ["Artificial", "Artificial"],
  ["Suministro", "Supply"],
  ["Cadena", "Chain"],
  ["Cumplimiento", "Compliance"],
  ["Mejora", "Improvement"],
  ["Continua", "Continuous"],
  ["Trabajo", "Work"],
  ["Equipo", "Team"],
  ["Equipos", "Teams"],
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildCaseVariants(replacements: Array<[string, string]>) {
  return replacements.flatMap(([source, target]) => {
    const lowerSource = source.toLowerCase();
    const lowerTarget = target.toLowerCase();

    if (lowerSource === source) {
      return [[source, target] as [string, string]];
    }

    return [
      [source, target] as [string, string],
      [lowerSource, lowerTarget] as [string, string],
    ];
  });
}

const PHRASE_REPLACEMENTS_WITH_VARIANTS = buildCaseVariants(PHRASE_REPLACEMENTS);
const WORD_REPLACEMENTS_WITH_VARIANTS = buildCaseVariants(WORD_REPLACEMENTS);

function replaceAll(value: string, replacements: Array<[string, string]>) {
  return replacements.reduce((current, [source, target]) => {
    return current.replace(new RegExp(escapeRegExp(source), "gu"), target);
  }, value);
}

function replaceWords(value: string, replacements: Array<[string, string]>) {
  return replacements.reduce((current, [source, target]) => {
    return current.replace(new RegExp(`(?<!\\p{L})${escapeRegExp(source)}(?!\\p{L})`, "gu"), target);
  }, value);
}

function translateSpanishVacancyText(value: string) {
  let output = value;
  output = replaceAll(output, PHRASE_REPLACEMENTS_WITH_VARIANTS);
  output = replaceWords(output, WORD_REPLACEMENTS_WITH_VARIANTS);
  output = output
    .replace(/\s+/gu, " ")
    .replace(/\s+([,.;:!?])/gu, "$1")
    .trim();
  return output;
}

export function translateVacancyText(
  value: string | null | undefined,
  toLanguage: SupportedLanguage,
) {
  const source = value?.trim() ?? "";
  if (!source) {
    return "";
  }

  const fromLanguage = detectTextLanguage(source);
  if (fromLanguage === toLanguage) {
    return source;
  }

  if (fromLanguage === "es" && toLanguage === "en") {
    const translated = translateSpanishVacancyText(source);
    if (translated !== source) {
      return translated;
    }
  }

  return translateJobText(source, fromLanguage, toLanguage);
}

export function localizeVacancyText(value: string | null | undefined, isEnglish: boolean) {
  return translateVacancyText(value, isEnglish ? "en" : "es");
}

export function getLocalizedVacancyTitle(job: Vacancy, isEnglish: boolean) {
  return localizeVacancyText(job.titulo, isEnglish);
}

export function getLocalizedVacancyDescription(job: Vacancy, isEnglish: boolean) {
  return localizeVacancyText(job.descripcion, isEnglish);
}

export function getLocalizedVacancyLongDescription(job: Vacancy, isEnglish: boolean) {
  const value = job.descripcionCompleta ?? job.descripcion;
  return localizeVacancyText(value, isEnglish);
}

export function getLocalizedVacancyTags(job: Vacancy, isEnglish: boolean) {
  const tags = job.etiquetas ?? [];
  return tags.map((tag) => localizeVacancyText(tag, isEnglish));
}

export function getRawVacancyCompanySummary(job: Vacancy) {
  return job.resumenEmpresa ?? job.descripcionCompleta ?? job.descripcion;
}

export function getLocalizedVacancyCompanySummary(job: Vacancy, isEnglish: boolean) {
  return localizeVacancyText(getRawVacancyCompanySummary(job), isEnglish);
}
