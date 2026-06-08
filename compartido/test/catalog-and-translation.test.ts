import assert from "node:assert/strict";
import { CAREERS_CATALOG } from "@/data/careers-catalog";
import {
  colombiaDepartments,
  colombiaMunicipalities,
  vacancyCategoriesEn,
  vacancyCategoriesEs,
} from "@/data/colombia-locations";
import { mockJobs } from "@/data/mockJobs";
import { SKILLS_CATALOG } from "@/data/skills-catalog";
import { translateText } from "@/components/ui/auto-ui-translator/translation-utils";
import {
  getRawVacancyCompanySummary,
  getLocalizedVacancyDescription,
  getLocalizedVacancyTags,
  getLocalizedVacancyTitle,
  translateVacancyText,
} from "@/lib/vacancy-localization";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("skills catalog merges desktop data without duplicates", () => {
  assert.equal(SKILLS_CATALOG.length, 3948);
  assert.equal(new Set(SKILLS_CATALOG).size, SKILLS_CATALOG.length);
  assert.ok(SKILLS_CATALOG.includes("Python"));
  assert.ok(SKILLS_CATALOG.includes("React"));
  assert.ok(SKILLS_CATALOG.includes("Docker"));
  assert.ok(SKILLS_CATALOG.includes("Terraform"));
  assert.ok(SKILLS_CATALOG.includes("Postman"));
  assert.ok(SKILLS_CATALOG.includes("GraphQL Apollo"));
});

runTest("careers catalog keeps its original breadth after chunking", () => {
  assert.equal(CAREERS_CATALOG.length, 1087);
  assert.equal(new Set(CAREERS_CATALOG).size, CAREERS_CATALOG.length);
  assert.equal(CAREERS_CATALOG[0], "5G y Tecnologías Móviles");
  assert.equal(CAREERS_CATALOG.at(-1), "Vivienda y Hábitat");
});

runTest("colombia locations keep filters and bilingual vacancy categories", () => {
  assert.equal(colombiaDepartments.length, 33);
  assert.equal(colombiaDepartments[0], "Todos");
  assert.equal(colombiaDepartments.at(-1), "Vichada");
  assert.equal(Object.keys(colombiaMunicipalities).length, 32);
  assert.ok(colombiaMunicipalities.Cundinamarca?.includes("Bogota"));
  assert.equal(vacancyCategoriesEs[0], "Todas");
  assert.equal(vacancyCategoriesEn[0], "All");
  assert.ok(vacancyCategoriesEs.includes("Arquitecto de Software"));
  assert.ok(vacancyCategoriesEn.includes("Software Architect"));
});

runTest("mock jobs catalog keeps the seeded range intact", () => {
  assert.equal(mockJobs.length, 1122);
  assert.equal(mockJobs[0]?.id, "job-0001");
  assert.equal(mockJobs.at(-1)?.id, "job-1122");
});

runTest("auto ui translator preserves phrase, pattern and word replacements", () => {
  assert.equal(translateText("Iniciar sesión"), "Log in");
  assert.equal(translateText("15% apto"), "15% fit");
  assert.equal(translateText("Agregar habilidad"), "Add skill");
  assert.equal(translateText("Salario promedio"), "Average salary");
});

runTest("vacancy localization translates detail copy while keeping company summary manual", () => {
  const vacancy = {
    id: "vac-test",
    titulo: "Especialista en Recursos Humanos",
    descripcion: "Vacante orientada a coordinación y comunicación.",
    descripcionCompleta: "Vacante orientada a coordinación y comunicación.",
    etiquetas: ["Recursos Humanos", "Alta demanda"],
    resumenEmpresa: "Empresa confidencial mantiene una búsqueda activa para perfiles de recursos humanos.",
    modalidad: "Hibrido",
  };

  assert.equal(getLocalizedVacancyTitle(vacancy, true), "Specialist in Human Resources");
  assert.equal(getLocalizedVacancyDescription(vacancy, true), "Opening focused on coordination and communication.");
  assert.deepEqual(getLocalizedVacancyTags(vacancy, true), ["Human Resources", "High demand"]);
  assert.equal(
    translateVacancyText(vacancy.resumenEmpresa, "en"),
    "Empresa confidencial is actively hiring profiles in human resources.",
  );
  assert.equal(getRawVacancyCompanySummary(vacancy), vacancy.resumenEmpresa);
});
