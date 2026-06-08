import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_CSV_PATHS = (
  process.env.TALENTOCO_COMPANIES_CSV_PATHS ??
  process.env.TALENTOCO_COMPANIES_CSV_PATH ??
  [
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/csv/1.csv"),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/csv/2.csv"),
  ].join(path.delimiter)
)
  .split(path.delimiter)
  .map((item) => item.trim())
  .filter(Boolean);

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.resolve(SCRIPT_DIR, "../data/derived/registered-companies.txt");

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

async function readCsvCompanies(filePath) {
  let content;
  try {
    content = await readFile(filePath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      console.warn(`Skipping CSV ${filePath}: file not found.`);
      return [];
    }

    throw error;
  }
  const lines = content.split(/\r?\n/).filter(Boolean);
  const header = lines[0] ?? "";

  if (header.includes('"RAZON SOCIAL"') && header.includes('"NIT"')) {
    return lines
      .slice(1)
      .map((line) => {
        const [, name, nit, city] = parseCsvLine(line);
        if (!name || !nit) {
          return null;
        }

        return {
          name,
          nit,
          city: city ?? "",
        };
      })
      .filter(Boolean);
  }

  return lines
    .map((line) => line.replace(/^"+|"+$/g, "").trim())
    .filter(
      (line) =>
        /\d{8,12}/.test(line) &&
        !/^NITNOMBRE O RAZON SOCIAL$/i.test(line) &&
        !/^NUMERO DE$/i.test(line) &&
        !/^FECHA DE$/i.test(line) &&
        !/^RESOLUCION$/i.test(line) &&
        !/^AUTORRETENEDORES DEL IMPUESTO SOBRE LA RENTA/i.test(line),
    )
    .map((line) => {
      const match = line.match(/^(\d{8,12})(.+)$/);
      if (!match) {
        return null;
      }

      const [, nit, rawTail] = match;
      const name = rawTail
        .replace(/,+\s*\d+\d{2}\/\d{2}\/\d{4}\s*$/u, "")
        .replace(/\d+\d{2}\/\d{2}\/\d{4}\s*$/u, "")
        .replace(/"+/gu, "")
        .replace(/,+$/u, "")
        .replace(/\s+/g, " ")
        .trim();
      if (!name || !nit || /^[\d\s.-]+$/u.test(name)) {
        return null;
      }

      return {
        name,
        nit,
        city: "",
      };
    })
    .filter(Boolean);
}

async function main() {
  const companies = [];
  const seenNits = new Set();

  for (const csvPath of DEFAULT_CSV_PATHS) {
    for (const company of await readCsvCompanies(csvPath)) {
      if (seenNits.has(company.nit)) {
        continue;
      }

      seenNits.add(company.nit);
      companies.push(company);
    }
  }

  companies.sort((left, right) => left.name.localeCompare(right.name, "es"));

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(
    OUTPUT_PATH,
    companies
      .map((company) =>
        [normalize(company.name), company.nit, company.city ?? "", company.name]
          .map((value) => String(value).replace(/\t/g, " ").trim())
          .join("\t"),
      )
      .join("\n"),
    "utf8",
  );

  console.log(`Wrote ${companies.length} companies to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
