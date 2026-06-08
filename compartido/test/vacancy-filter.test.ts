import assert from "node:assert/strict";
import {
  defaultSalary,
  matchesSalaryFilter,
  parseVisibleSalaryToCop,
} from "@/components/vacancies/job-dashboard-utils";
import { isVerifiedCompanyVacancy } from "@/lib/vacancy-filters";
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
    id: "vacancy-verified-1",
    titulo: "Backend Developer",
    publicadorTipo: "empresa",
    empresa: "Talent Co",
    descripcion: "Rol de prueba",
    companyVerificationStatus: "verified",
    ...overrides,
  };
}

runTest("verified company filter keeps only vacancies from verified companies", () => {
  assert.equal(isVerifiedCompanyVacancy(buildVacancy()), true);
  assert.equal(
    isVerifiedCompanyVacancy(buildVacancy({ companyVerificationStatus: "pending" })),
    false,
  );
  assert.equal(
    isVerifiedCompanyVacancy(buildVacancy({ publicadorTipo: "persona", companyVerificationStatus: "verified" })),
    false,
  );
});

runTest("salary filter keeps company vacancies with text salary at the default threshold", () => {
  const vacancy = buildVacancy({
    salario: "$2.500.000 - $3.200.000 COP",
    salarioMinimoMillones: undefined,
  });

  assert.equal(parseVisibleSalaryToCop(vacancy.salario), 2_500_000);
  assert.equal(matchesSalaryFilter(vacancy, defaultSalary), true);
});

runTest("salary filter does not hide negotiable company vacancies by default", () => {
  const vacancy = buildVacancy({
    salario: "Salario a convenir",
    salarioMinimoMillones: undefined,
  });

  assert.equal(matchesSalaryFilter(vacancy, defaultSalary), true);
  assert.equal(matchesSalaryFilter(vacancy, 3_000_000), false);
});
