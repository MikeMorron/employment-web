export type SupportedLanguage = "es" | "en";

// Diccionario operativo para tarjetas de vacantes.
// Se mantiene aislado para que solo aplique en textos de tarjetas, no en toda la UI.
// Base: corpus en-es (`data/translations-en-es.xml`) + ajustes de producto.

const ES_STOP_WORDS = new Set([
  "a",
  "de",
  "la",
  "el",
  "para",
  "con",
  "una",
  "un",
  "en",
  "que",
  "por",
  "los",
  "las",
  "del",
  "al",
  "y",
  "o",
]);

const EN_STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "in",
  "to",
  "of",
  "on",
  "by",
  "from",
  "a",
  "an",
  "is",
]);

const PHRASES_ES_TO_EN: Record<string, string> = {
  "Vacante backend con NestJS y TypeScript, consumo de APIs REST y SOAP, microservicios, AWS y apoyo en aplicaciones web y moviles dentro de un esquema remoto.":
    "Backend role with NestJS and TypeScript, REST and SOAP APIs, microservices, AWS, and support for web/mobile apps in a remote setup.",
  "Cargo orientado a liderar y priorizar iniciativas de analitica, maximizando valor para el negocio y alineando roadmap, plazos y calidad con la celula tecnica.":
    "Role focused on leading and prioritizing analytics initiatives, maximizing business value and aligning roadmap, timelines, and quality with the technical team.",
  "Rol estrategico para potenciar la linea de Google Workspace y evolucionarla hacia servicios consultivos apoyados en IA, automatizacion y transformacion digital.":
    "Strategic role to strengthen the Google Workspace line and evolve it toward consulting services powered by AI, automation, and digital transformation.",
  "Vacante orientada a SEO tecnico y analitica de buscadores, con manejo de paginas web, consolas, IA aplicada a busqueda y disponibilidad para lanzamientos puntuales.":
    "Role focused on technical SEO and search analytics, managing websites, consoles, AI-assisted search, and punctual launch support.",
  "Lider del frente cloud para una compania de tecnologia con foco en infraestructura segura, resiliente y escalable para equipos de producto de alto volumen.":
    "Lead the cloud area for a technology company focused on secure, resilient, and scalable infrastructure for high-volume product teams.",
  "Rol senior para modernizacion cloud con Azure, AWS u OpenStack, Kubernetes y Terraform, trabajando con equipos regionales y locales de IT.":
    "Senior role for cloud modernization with Azure, AWS or OpenStack, Kubernetes, and Terraform, working with regional and local IT teams.",
  "Vacante para aseguramiento de calidad con pruebas manuales y automatizadas, integracion continua y colaboracion cercana con equipos de producto e ingenieria.":
    "QA role with manual and automated testing, continuous integration, and close collaboration with product and engineering teams.",
  "Profile de testing con enfasis en automatizacion, pruebas REST y SOAP para equipos que necesitan cobertura funcional y disciplina de calidad en ciclos agiles.":
    "Testing profile focused on automation, REST and SOAP testing for teams needing functional coverage and quality discipline in agile cycles.",
  "Cargo para planeacion, ejecucion, control y cierre de proyectos con foco en cronograma, costos, riesgos y coordinacion operativa desde oficina en Bogota.":
    "Role for planning, execution, control, and project closure focused on schedule, costs, risks, and operational coordination from Bogota office.",
};

const WORDS_ES_TO_EN: Record<string, string> = {
  vacante: "role",
  vacantes: "roles",
  para: "for",
  con: "with",
  pruebas: "tests",
  manuales: "manual",
  automatizadas: "automated",
  integracion: "integration",
  continua: "continuous",
  colaboracion: "collaboration",
  cercana: "close",
  equipos: "teams",
  producto: "product",
  ingenieria: "engineering",
  desarrollo: "development",
  aplicacion: "application",
  aplicaciones: "applications",
  apoyo: "support",
  compania: "company",
  tecnologia: "technology",
  infraestructura: "infrastructure",
  segura: "secure",
  resiliente: "resilient",
  escalable: "scalable",
  trabajo: "work",
  remoto: "remote",
  hibrido: "hybrid",
};

const WORD_REGEX = /\b[\p{L}]+\b/gu;

const PHRASES_EN_TO_ES: Record<string, string> = Object.fromEntries(
  Object.entries(PHRASES_ES_TO_EN).map(([es, en]) => [en, es]),
);

const WORDS_EN_TO_ES: Record<string, string> = Object.fromEntries(
  Object.entries(WORDS_ES_TO_EN).map(([es, en]) => [en, es]),
);

function normalize(input: string) {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase();
}

function countMatches(input: string, lexicon: Set<string>) {
  const tokens = normalize(input).match(/[a-z]+/g) ?? [];
  return tokens.reduce((total, token) => total + (lexicon.has(token) ? 1 : 0), 0);
}

function swapWords(input: string, map: Record<string, string>) {
  return input.replace(WORD_REGEX, (word) => {
    const translated = map[normalize(word)];
    if (!translated) {
      return word;
    }

    if (word === word.toUpperCase()) {
      return translated.toUpperCase();
    }

    if (word[0] === word[0]?.toUpperCase()) {
      return translated[0]?.toUpperCase() + translated.slice(1);
    }

    return translated;
  });
}

export function detectTextLanguage(input: string): SupportedLanguage {
  const esScore = countMatches(input, ES_STOP_WORDS);
  const enScore = countMatches(input, EN_STOP_WORDS);
  return enScore > esScore ? "en" : "es";
}

export function translateJobText(
  input: string,
  fromLanguage: SupportedLanguage,
  toLanguage: SupportedLanguage,
) {
  if (fromLanguage === toLanguage) {
    return input;
  }

  const phraseMap = fromLanguage === "es" ? PHRASES_ES_TO_EN : PHRASES_EN_TO_ES;
  const phraseMatch = phraseMap[input.trim()];
  if (phraseMatch) {
    return phraseMatch;
  }

  const wordsMap = fromLanguage === "es" ? WORDS_ES_TO_EN : WORDS_EN_TO_ES;
  return swapWords(input, wordsMap);
}
