/*
  Reusable alias layer for matching.

  Goals:
  - improve recall for equivalent skill labels
  - keep normalization centralized and extensible
  - dedupe skills after canonicalization before comparing
*/

export const SKILL_ALIASES: Record<string, string[]> = {
  javascript: ["js", "ecmascript", "java script"],
  typescript: ["ts", "type script"],
  react: ["reactjs", "react.js", "react js"],
  nextjs: ["next", "next.js", "next js"],
  nodejs: ["node", "node.js", "node js"],
  python: ["py"],
  sql: ["postgres", "postgresql", "mysql", "sql server", "sqlserver", "tsql", "t-sql"],
  html: ["html5"],
  css: ["css3"],
  git: ["git flow", "version control git"],
  docker: ["containers", "docker containers", "contenedores"],
  aws: ["amazon web services", "aws cloud"],
  excel: ["excel avanzado", "microsoft excel", "ms excel"],
  powerpoint: ["power point", "microsoft powerpoint", "ms powerpoint", "ppt"],
  word: ["microsoft word", "ms word"],
  office: ["office 365", "microsoft office", "ms office"],
  powerbi: ["power bi", "power-bi"],
  sap: ["sap hana", "sap erp"],
  crm: ["customer relationship management"],
  salesforce: ["crm salesforce", "salesforce crm", "sfdc"],
  customerservice: [
    "atencion al cliente",
    "atención al cliente",
    "servicio al cliente",
    "customer service",
    "customer support",
  ],
  callcenter: ["call center", "contact center"],
  sales: ["ventas", "comercial", "sales enablement"],
  negotiation: ["negociacion", "negociación", "negotiation"],
  inventory: ["inventarios", "inventory control"],
  warehouse: ["almacen", "almacén", "warehouse operations", "bodega"],
  logistics: ["logistica", "logística", "logistics"],
  supplychain: ["supply chain", "cadena de suministro"],
  production: ["produccion", "producción", "production"],
  seo: ["search engine optimization"],
  sem: ["search engine marketing"],
  googleads: ["google ads", "google adwords", "adwords"],
  metaads: ["meta ads", "facebook ads", "instagram ads"],
  socialmedia: ["social media", "social media management", "redes sociales"],
  emailmarketing: ["email marketing", "mailchimp", "email campaigns"],
  ecommerce: ["e-commerce", "comercio electronico", "comercio electrónico"],
  uxui: ["ui ux", "ux ui", "ux/ui", "ui/ux"],
};

function normalizeAliasString(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9+#./\s-]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[./-]/g, "")
    .trim();
}

const SKILL_LOOKUP = new Map<string, string>(
  Object.entries(SKILL_ALIASES).flatMap(([canonical, aliases]) =>
    [canonical, ...aliases].map((alias) => [normalizeAliasString(alias).replace(/\s+/g, ""), canonical] as const),
  ),
);

export function normalizeSkillToken(value: string) {
  return normalizeAliasString(value).replace(/\s+/g, "");
}

export function canonicalizeSkill(value: string) {
  const normalized = normalizeSkillToken(value);
  return SKILL_LOOKUP.get(normalized) ?? normalized;
}

export function dedupeCanonicalSkills(values: string[]) {
  return [...new Set(values.map(canonicalizeSkill).filter(Boolean))];
}

