import assert from "node:assert/strict";
import { getCandidateJobMatch } from "@/lib/matching";
import type { CandidateProfile } from "@/types/profile";
import type { Vacancy } from "@/types/vacancy";

function buildCandidate(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    id: "candidate-test-001",
    role: "candidate",
    plan: "pro",
    displayName: "Test Candidate",
    nombre: "Test Candidate",
    rol: "Senior Frontend Engineer",
    ubicacion: "Bogota, Colombia",
    email: "test@example.com",
    tipoRegistro: "persona",
    modalidadTrabajo: "Remoto",
    expectativaSalarial: "10000000",
    expectativaSalarialMin: "9000000",
    expectativaSalarialMax: "11000000",
    jornada: "Tiempo completo",
    resumenPerfil: "Perfil de prueba",
    categoriasEnfoque: ["Frontend"],
    telefono: "3105550000",
    website: "",
    avatar: "",
    avatarStoredFileName: "",
    cv: "cv.pdf",
    cvStoredFileName: "",
    bio: "Activo recientemente",
    idiomas: [
      { name: "Español", levelSystem: "CEFR", level: "Nativo" },
      { name: "Inglés", levelSystem: "CEFR", level: "B2" },
    ],
    disponibilidadViaje: "Si",
    movilidad: "Carro",
    profileVisibility: "public",
    skills: ["React", "TypeScript", "Next.js", "Testing"],
    experiencia: [
      {
        rol: "Senior Frontend Engineer",
        empresa: "Acme",
        tiempo: "2020 - Actualidad",
        fechaInicio: "2020-01",
        actualidad: true,
      },
      {
        rol: "Frontend Engineer",
        empresa: "Beta",
        tiempo: "2018 - 2019",
        fechaInicio: "2018-01",
        fechaFin: "2019-12",
      },
    ],
    education: ["Ingeniería de Sistemas"],
    certifications: ["AWS Practitioner"],
    ...overrides,
  };
}

function buildVacancy(overrides: Partial<Vacancy> = {}): Vacancy {
  return {
    id: "vacancy-test-001",
    titulo: "Senior Frontend Engineer",
    publicadorTipo: "empresa",
    empresa: "Acme Corp",
    ubicacion: "Bogota, Colombia",
    modalidad: "Hibrido",
    salario: "$9M - $11M COP",
    descripcion:
      "Buscamos frontend senior con React, Next.js y TypeScript. Inglés B2 requerido. Trabajo híbrido en Bogotá.",
    descripcionCompleta:
      "Rol senior con 5 años de experiencia mínima, trabajo híbrido en Bogotá e inglés B2. Se valora testing y diseño de sistemas.",
    etiquetas: ["React", "Next.js", "TypeScript", "Testing"],
    experienciaMinimaAnos: 5,
    diasDesdePublicacion: 3,
    ...overrides,
  };
}

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("candidate with correct skills but salary out of range gets a real salary gap", () => {
  const candidate = buildCandidate({
    expectativaSalarialMin: "15000000",
    expectativaSalarialMax: "17000000",
  });
  const vacancy = buildVacancy();
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.ok(result.visibleScore < 75);
  assert.ok(result.gaps.some((item) => item.key === "salary_above_range"));
  assert.ok(result.debug.criticalGaps.includes("salary_gap"));
});

runTest("salary below vacancy range is only a mild positive, not a strong boost", () => {
  const candidate = buildCandidate({
    expectativaSalarialMin: "5000000",
    expectativaSalarialMax: "6000000",
  });
  const vacancy = buildVacancy();
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.ok(result.breakdown.salary >= 70);
  assert.ok(result.breakdown.salary <= 80);
});

runTest("small salary gap is a moderate penalty, not an instant collapse", () => {
  const candidate = buildCandidate({
    expectativaSalarialMin: "11100000",
    expectativaSalarialMax: "11600000",
  });
  const vacancy = buildVacancy();
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.ok(result.breakdown.salary >= 45);
  assert.ok(result.breakdown.salary <= 60);
});

runTest("candidate with language present but insufficient level gets a real language gap", () => {
  const candidate = buildCandidate({
    idiomas: [
      { name: "Español", levelSystem: "CEFR", level: "Nativo" },
      { name: "Inglés", levelSystem: "CEFR", level: "B1" },
    ],
  });
  const vacancy = buildVacancy({
    languageRequirements: [{ name: "Inglés", minLevel: "B2", levelSystem: "CEFR" }],
  });
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.ok(result.breakdown.languages < 100);
  assert.ok(result.gaps.some((item) => item.key.includes("language_level_gap")));
});

runTest("vacancy salary coming only from visible text is normalized with usable confidence", () => {
  const candidate = buildCandidate();
  const vacancy = buildVacancy({
    salario: "$7M - $9M COP",
    salaryMinAmount: undefined,
    salaryMaxAmount: undefined,
  });
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.equal(result.debug.qualitySignals.hasStructuredSalary, true);
  assert.ok(result.breakdown.salary >= 80);
  assert.ok(!result.debug.missingData.includes("vacancy_salary_unstructured"));
});

runTest("incomplete vacancy reduces confidence and warns explicitly", () => {
  const candidate = buildCandidate();
  const vacancy = buildVacancy({
    titulo: "Software role",
    descripcion: "Rol generalista",
    descripcionCompleta: "",
    etiquetas: ["Software / Desarrollo"],
    salario: "",
    modalidad: "",
    experienciaMinimaAnos: undefined,
  });
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.ok(result.confidenceScore < 60);
  assert.ok(result.visibleScore < 55);
  assert.ok(result.warnings.some((item) => item.key === "vacancy_quality_low"));
});

runTest("candidate with many experiences but few valid dates lowers experience confidence", () => {
  const candidate = buildCandidate({
    experiencia: [
      {
        rol: "Engineer",
        empresa: "A",
        tiempo: "Sin fecha",
      },
      {
        rol: "Engineer",
        empresa: "B",
        tiempo: "Proyecto reciente",
      },
      {
        rol: "Engineer",
        empresa: "C",
        tiempo: "2022 - Actualidad",
        fechaInicio: "2022-01",
        actualidad: true,
      },
    ],
  });
  const vacancy = buildVacancy({
    experienciaMinimaAnos: 4,
  });
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.ok(result.confidenceScore < 80);
  assert.ok(result.debug.missingData.includes("candidate_experience_dates_partial"));
});

runTest("senior candidate applying to junior vacancy is penalized by seniority distance", () => {
  const candidate = buildCandidate();
  const vacancy = buildVacancy({
    titulo: "Junior Frontend Engineer",
    descripcion: "Rol junior de entrada con React",
    descripcionCompleta: "Vacante junior con 1 año de experiencia.",
    experienciaMinimaAnos: 1,
  });
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.ok(result.breakdown.seniority < 60);
  assert.ok(result.debug.criticalGaps.includes("seniority_gap"));
});

runTest("one seniority step no longer looks like a strong match", () => {
  const candidate = buildCandidate({
    rol: "Senior Frontend Engineer",
    experiencia: [
      {
        rol: "Senior Frontend Engineer",
        empresa: "Acme",
        tiempo: "2021 - Actualidad",
        fechaInicio: "2021-01",
        actualidad: true,
      },
    ],
  });
  const vacancy = buildVacancy({
    titulo: "Mid Frontend Engineer",
    descripcion: "Rol mid con React, Next.js y TypeScript.",
    descripcionCompleta: "Vacante mid con 4 años de experiencia mínima.",
    experienciaMinimaAnos: 4,
  });
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.ok(result.breakdown.seniority <= 55);
  assert.ok(result.level !== "high");
});

runTest("remote vs hybrid vs onsite modality ordering stays consistent", () => {
  const candidate = buildCandidate({ modalidadTrabajo: "Remoto" });
  const remote = getCandidateJobMatch(candidate, buildVacancy({ modalidad: "Remoto" }));
  const hybrid = getCandidateJobMatch(candidate, buildVacancy({ modalidad: "Hibrido" }));
  const onsite = getCandidateJobMatch(candidate, buildVacancy({ modalidad: "Presencial" }));

  assert.ok(remote.breakdown.modality > hybrid.breakdown.modality);
  assert.ok(hybrid.breakdown.modality > onsite.breakdown.modality);
});

runTest("missing modality and location stay low instead of looking almost compatible", () => {
  const candidate = buildCandidate();
  const vacancy = buildVacancy({
    ubicacion: "",
    modalidad: "",
    descripcion: "Vacante generalista",
    descripcionCompleta: "Rol generalista sin precisar modalidad ni ubicación.",
  });
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.ok(result.breakdown.location <= 25);
  assert.ok(result.breakdown.modality <= 25);
});

runTest("missing required skills hurts much more than missing optional skills", () => {
  const candidate = buildCandidate({ skills: ["React", "TypeScript"] });
  const mostlyOptionalMiss = getCandidateJobMatch(
    candidate,
    buildVacancy({
      requiredSkills: ["React", "TypeScript"],
      optionalSkills: ["AWS", "Node.js", "GraphQL"],
    }),
  );
  const requiredMiss = getCandidateJobMatch(
    candidate,
    buildVacancy({
      requiredSkills: ["React", "TypeScript", "Node.js", "AWS"],
      optionalSkills: [],
    }),
  );

  assert.ok(mostlyOptionalMiss.visibleScore > requiredMiss.visibleScore);
  assert.ok(requiredMiss.debug.criticalGaps.includes("required_skills_gap"));
});

runTest("one critical required skill missing applies a hard ceiling", () => {
  const candidate = buildCandidate({ skills: ["React", "TypeScript", "Next.js"] });
  const vacancy = buildVacancy({
    requiredSkills: ["React", "TypeScript", "Next.js", "Testing"],
    optionalSkills: [],
  });
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.ok(result.debug.criticalGaps.includes("required_skills_gap"));
  assert.ok(result.visibleScore <= 74);
});

runTest("two or more critical required skills missing apply a stronger hard ceiling", () => {
  const candidate = buildCandidate({ skills: ["React", "TypeScript"] });
  const vacancy = buildVacancy({
    requiredSkills: ["React", "TypeScript", "Next.js", "Testing"],
    optionalSkills: [],
  });
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.ok(result.debug.criticalGaps.includes("required_skills_major_gap"));
  assert.ok(result.visibleScore <= 59);
});

runTest("soft factors do not rescue the match when hard evidence is weak", () => {
  const candidate = buildCandidate({
    rol: "Junior Designer",
    modalidadTrabajo: "Remoto",
    expectativaSalarialMin: "7000000",
    expectativaSalarialMax: "8000000",
    skills: ["Figma"],
    experiencia: [
      {
        rol: "Junior Designer",
        empresa: "Studio",
        tiempo: "2024 - Actualidad",
        fechaInicio: "2024-01",
        actualidad: true,
      },
    ],
    bio: "Activo recientemente",
  });
  const vacancy = buildVacancy({
    titulo: "Senior Backend Engineer",
    descripcion: "Buscamos backend senior con Node.js, AWS y arquitectura de sistemas.",
    descripcionCompleta: "Vacante senior backend con 5 años de experiencia mínima, Node.js, AWS, microservicios e inglés B2.",
    modalidad: "Remoto",
    salario: "$7M - $8M COP",
    requiredSkills: ["Node.js", "AWS", "Microservices", "TypeScript"],
    optionalSkills: ["Docker"],
    experienciaMinimaAnos: 5,
    languageRequirements: [{ name: "Inglés", minLevel: "B2", levelSystem: "CEFR" }],
  });
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.ok(result.breakdown.salary >= 80);
  assert.ok(result.breakdown.modality >= 80);
  assert.ok(result.visibleScore < 45);
  assert.ok(result.debug.criticalGaps.includes("required_skills_gap"));
});

runTest("meeting years alone does not make experience look fully aligned", () => {
  const candidate = buildCandidate({
    rol: "Operations Manager",
    skills: ["Leadership", "Operations"],
    experiencia: [
      {
        rol: "Operations Manager",
        empresa: "Ops Corp",
        tiempo: "2018 - Actualidad",
        fechaInicio: "2018-01",
        actualidad: true,
      },
    ],
  });
  const vacancy = buildVacancy({
    titulo: "Senior Frontend Engineer",
    descripcion: "Rol frontend senior con React, TypeScript y arquitectura frontend.",
    descripcionCompleta: "Vacante frontend senior con 5 años de experiencia mínima en React, Next.js y TypeScript.",
    requiredSkills: ["React", "Next.js", "TypeScript"],
    experienciaMinimaAnos: 5,
  });
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.ok(result.breakdown.experience < 70);
  assert.ok(result.visibleScore < 60);
  assert.ok(result.visibleScore <= 54);
});

runTest("not required factors stay neutral instead of gifting score", () => {
  const candidate = buildCandidate({
    idiomas: [],
    education: [],
    certifications: [],
  });
  const vacancy = buildVacancy({
    languageRequirements: [],
    requiredEducation: [],
    requiredCertifications: [],
  });
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.equal(result.breakdown.languages, 0);
  assert.equal(result.breakdown.education, 0);
  assert.equal(result.breakdown.certifications, 0);
});

runTest("required education without relevant evidence does not get a perfect score", () => {
  const candidate = buildCandidate({
    education: ["Administración de Empresas"],
  });
  const vacancy = buildVacancy({
    requiredEducation: ["Ingeniería de Sistemas"],
  });
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.ok(result.breakdown.education > 0);
  assert.ok(result.breakdown.education < 80);
});

runTest("required certifications without relevant evidence do not get a perfect score", () => {
  const candidate = buildCandidate({
    certifications: ["Scrum Fundamentals"],
  });
  const vacancy = buildVacancy({
    requiredCertifications: ["AWS Solutions Architect"],
  });
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.ok(result.breakdown.certifications > 0);
  assert.ok(result.breakdown.certifications < 80);
});

runTest("seniority distance of two or more applies a hard ceiling", () => {
  const candidate = buildCandidate({
    rol: "Lead Frontend Engineer",
  });
  const vacancy = buildVacancy({
    titulo: "Junior Frontend Engineer",
    descripcion: "Rol junior con React y TypeScript.",
    descripcionCompleta: "Vacante junior con 1 año de experiencia mínima.",
    experienciaMinimaAnos: 1,
  });
  const result = getCandidateJobMatch(candidate, vacancy);

  assert.ok(result.debug.criticalGaps.includes("seniority_gap"));
  assert.ok(result.visibleScore <= 64);
});

runTest("activity stays cosmetic and changes the visible score only marginally", () => {
  const candidate = buildCandidate({ bio: "" });
  const vacancy = buildVacancy({ diasDesdePublicacion: 40 });
  const cold = getCandidateJobMatch(candidate, vacancy, {
    ranking: {
      metadata: {
        isRecentlyActive: false,
        isPublishedRecently: false,
      },
    },
  });
  const active = getCandidateJobMatch(candidate, vacancy, {
    ranking: {
      metadata: {
        isRecentlyActive: true,
        isPublishedRecently: true,
      },
    },
  });

  assert.ok(active.breakdown.activity > cold.breakdown.activity);
  assert.ok(active.visibleScore - cold.visibleScore <= 1);
});

console.log("All matching engine tests passed.");
