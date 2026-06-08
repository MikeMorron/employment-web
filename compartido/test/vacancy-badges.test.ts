import assert from "node:assert/strict";
import { qualifiesAsFeaturedVacancy } from "@/lib/utils";
import { getVacancyBadgeSignals } from "@/lib/vacancy-popularity";
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
    id: "job-1",
    titulo: "Disenador UX",
    publicadorTipo: "empresa",
    empresa: "Talent Co",
    ubicacion: "Bogota",
    modalidad: "Remoto",
    descripcion: "Rol de prueba",
    etiquetas: [],
    clicksDetalleDosDias: 0,
    diasDesdePublicacion: 0,
    ...overrides,
  };
}

runTest("featured badge only applies to company jobs with many recent clicks", () => {
  assert.equal(
    qualifiesAsFeaturedVacancy(buildVacancy({ clicksDetalleDosDias: 160, diasDesdePublicacion: 4 })),
    true,
  );
  assert.equal(
    qualifiesAsFeaturedVacancy(buildVacancy({ clicksDetalleDosDias: 119, diasDesdePublicacion: 4 })),
    false,
  );
  assert.equal(
    qualifiesAsFeaturedVacancy(buildVacancy({ clicksDetalleDosDias: 200, diasDesdePublicacion: 20 })),
    false,
  );
  assert.equal(
    qualifiesAsFeaturedVacancy(buildVacancy({ publicadorTipo: "persona", clicksDetalleDosDias: 200, diasDesdePublicacion: 2 })),
    false,
  );
});

runTest("badge signals only expose featured state when the vacancy qualifies", () => {
  const signals = getVacancyBadgeSignals([
    buildVacancy({ id: "featured", clicksDetalleDosDias: 140, diasDesdePublicacion: 3 }),
    buildVacancy({ id: "plain", clicksDetalleDosDias: 40, diasDesdePublicacion: 3 }),
  ]);

  assert.deepEqual(signals, {
    featured: { isFeatured: true },
    plain: { isFeatured: false },
  });
});
