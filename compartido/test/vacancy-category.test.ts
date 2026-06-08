import assert from "node:assert/strict";
import { getVacancyFilterCategory } from "@/lib/vacancy-category";
import { getVacancyPresenter } from "@/lib/vacancy-presenters";
import type { Vacancy } from "@/types/vacancy";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function buildVacancy(overrides: Partial<Vacancy> = {}): Vacancy {
  return {
    id: "job-category",
    titulo: "Desarrollador Frontend",
    publicadorTipo: "empresa",
    empresa: "Mercado de Profesiones",
    descripcion: "Rol orientado a interfaces y experiencia web.",
    etiquetas: ["Tecnología e Informática", "React"],
    ...overrides,
  };
}

runTest("vacancy category uses the same taxonomy as the filter when it finds a direct match", () => {
  assert.equal(
    getVacancyFilterCategory(buildVacancy()),
    "Desarrollador Frontend",
  );
});

runTest("vacancy category falls back to the first job tag when taxonomy has no exact match", () => {
  assert.equal(
    getVacancyFilterCategory(
      buildVacancy({
        titulo: "Especialista en Salud Pública",
        descripcion: "Rol para salud pública y coordinación clínica.",
        etiquetas: ["Salud y Medicina", "Diagnóstico"],
      }),
    ),
    "Salud y Medicina",
  );
});

runTest("vacancy presenter exposes the display category without replacing the company identity", () => {
  const presenter = getVacancyPresenter(buildVacancy());

  assert.equal(presenter.primaryName, "Mercado de Profesiones");
  assert.equal(presenter.displayCategory, "Desarrollador Frontend");
});
