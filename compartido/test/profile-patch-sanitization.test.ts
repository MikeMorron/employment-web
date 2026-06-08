import assert from "node:assert/strict";
import {
  sanitizeCandidateProfilePatch,
  sanitizeCompanyProfilePatch,
} from "@/lib/server/profile-patch";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("candidate patch trims and normalizes scalar fields", () => {
  const result = sanitizeCandidateProfilePatch({
    nombre: "  Nina Candidate  ",
    rol: "  Senior Frontend Engineer ",
    ubicacion: "  Bogota ",
    website: "https://example.com/profile ",
    telefono: " 3105550000 ",
    profileVisibility: "recruiters_only",
  });

  assert.equal(result.nombre, "Nina Candidate");
  assert.equal(result.rol, "Senior Frontend Engineer");
  assert.equal(result.ubicacion, "Bogota");
  assert.equal(result.website, "https://example.com/profile");
  assert.equal(result.telefono, "3105550000");
  assert.equal(result.profileVisibility, "recruiters_only");
});

runTest("candidate patch drops invalid urls and sanitizes arrays", () => {
  const result = sanitizeCandidateProfilePatch({
    website: "javascript:alert(1)",
    skills: [" React ", "", "TypeScript", 7 as never],
    categoriasEnfoque: [" Frontend ", " Backend ", null as never],
  });

  assert.equal(result.website, undefined);
  assert.deepEqual(result.skills, ["React", "TypeScript"]);
  assert.deepEqual(result.categoriasEnfoque, ["Frontend", "Backend"]);
});

runTest("candidate patch sanitizes experience and languages", () => {
  const result = sanitizeCandidateProfilePatch({
    experiencia: [
      {
        rol: " Engineer ",
        empresa: " Acme ",
        tiempo: "2022 - Actualidad",
        opinion: " Muy bien ",
        canonicalRole: " engineer ",
        roleFamily: " engineering ",
        durationMonths: 14.8,
        description: " Lideré producto ",
        skillsUsed: [" React ", " TypeScript "],
        domainTags: [" SaaS "],
        functionalTags: [" Discovery "],
        peopleLedCount: 3.7,
      },
      {
        rol: "",
        empresa: "Missing role",
        tiempo: "2020",
      } as never,
    ],
    idiomas: [
      { name: " Inglés ", level: " B2 ", levelSystem: "CEFR" },
      { name: "Bad", level: "", levelSystem: "CEFR" },
    ] as never,
  });

  assert.equal(result.experiencia?.length, 1);
  assert.equal(result.experiencia?.[0]?.rol, "Engineer");
  assert.equal(result.experiencia?.[0]?.empresa, "Acme");
  assert.equal(result.experiencia?.[0]?.canonicalRole, "engineer");
  assert.equal(result.experiencia?.[0]?.roleFamily, "engineering");
  assert.equal(result.experiencia?.[0]?.durationMonths, 15);
  assert.equal(result.experiencia?.[0]?.description, "Lideré producto");
  assert.deepEqual(result.experiencia?.[0]?.skillsUsed, ["React", "TypeScript"]);
  assert.deepEqual(result.experiencia?.[0]?.domainTags, ["SaaS"]);
  assert.deepEqual(result.experiencia?.[0]?.functionalTags, ["Discovery"]);
  assert.equal(result.experiencia?.[0]?.peopleLedCount, 4);
  assert.equal(result.idiomas?.length, 1);
  assert.equal(result.idiomas?.[0]?.name, "Inglés");
  assert.equal(result.idiomas?.[0]?.level, "B2");
});

runTest("candidate patch removes suspicious code from used skills", () => {
  const result = sanitizeCandidateProfilePatch({
    experiencia: [
      {
        rol: "Engineer",
        empresa: "Acme",
        tiempo: "2022 - Actualidad",
        skillsUsed: [
          "React",
          "<script>alert('x')</script>",
          "javascript:alert(1)",
          "TypeScript",
          "window.location='https://bad.test'",
        ],
      },
    ],
  });

  assert.deepEqual(result.experiencia?.[0]?.skillsUsed, ["React", "TypeScript"]);
});

runTest("candidate patch sanitizes structured profile fields for matching", () => {
  const result = sanitizeCandidateProfilePatch({
    structuredSkills: [
      {
        skillName: " Figma ",
        canonicalSkill: " figma ",
        skillCategory: " design_tool ",
        skillLevel: "advanced",
        yearsExperience: 5.2,
        lastUsedAt: "2026-03",
        isCoreSkill: true,
        evidenceSource: " manual+experience ",
      },
    ],
    professionalProfile: {
      currentJobTitle: " Senior Product Designer ",
      canonicalRole: " product_designer ",
      roleFamily: " product_design ",
      seniorityLevel: "senior",
      yearsExperienceTotal: 8.4,
      yearsExperienceRelevant: 5.6,
      primarySpecialization: " product_design ",
      secondarySpecializations: [" UX Research ", " Design Systems "],
      topSkills: [" Figma ", " User Research "],
      preferredCompanyStages: [" Startup ", " Scaleup "],
      preferredCompanyTypes: [" Product ", " Remote-first "],
      preferredTeamSize: " 10-50 ",
      preferredIndustries: [" SaaS ", " Fintech "],
      preferredProductTypes: [" B2B ", " Platform "],
      hasExperienceWithDiscovery: true,
    },
    educationProfile: {
      highestEducationLevel: " Profesional ",
      records: [
        {
          degreeTitle: " Diseño industrial ",
          degreeField: " Diseño ",
          institutionName: " Uniandes ",
          startDate: "2015-01",
          endDate: "2020-06",
          isCompleted: true,
          isRelevant: true,
        },
      ],
    },
  } as never);

  assert.equal(result.structuredSkills?.[0]?.skillName, "Figma");
  assert.equal(result.structuredSkills?.[0]?.canonicalSkill, "figma");
  assert.equal(result.structuredSkills?.[0]?.yearsExperience, 5);
  assert.equal(result.professionalProfile?.canonicalRole, "product_designer");
  assert.equal(result.professionalProfile?.yearsExperienceRelevant, 6);
  assert.deepEqual(result.professionalProfile?.secondarySpecializations, ["UX Research", "Design Systems"]);
  assert.deepEqual(result.professionalProfile?.topSkills, ["Figma", "User Research"]);
  assert.deepEqual(result.professionalProfile?.preferredCompanyStages, ["Startup", "Scaleup"]);
  assert.equal(result.professionalProfile?.preferredTeamSize, "10-50");
  assert.equal(result.professionalProfile?.hasExperienceWithDiscovery, true);
  assert.equal(result.educationProfile?.highestEducationLevel, "Profesional");
  assert.equal(result.educationProfile?.records[0]?.degreeTitle, "Diseño industrial");
});

runTest("candidate patch sanitizes certifications, work preferences, location and profile quality", () => {
  const result = sanitizeCandidateProfilePatch({
    certificationProfile: {
      records: [
        {
          certificationName: " AWS Solutions Architect ",
          canonicalCertification: " aws_saa ",
          certificationCategory: " cloud ",
          issuer: " Amazon ",
          issuedAt: "2025-05",
          expiresAt: "2028-05",
          isActive: true,
          isRelevant: true,
        },
      ],
    },
    workPreferences: {
      expectedSalaryMin: 12000000.4,
      expectedSalaryMax: 15000000.8,
      salaryCurrency: " cop ",
      salaryPeriod: "monthly",
      preferredWorkModes: [" Remoto ", " Hibrido "],
      remotePreference: "preferred",
      preferredLocations: [" Bogota ", " Medellin "],
      willingToRelocate: true,
      preferredEmploymentTypes: [" Tiempo completo ", " Contractor "],
      noticePeriodDays: 27.9,
      availabilityDate: "2026-05-01",
    },
    locationProfile: {
      country: " Colombia ",
      city: " Bogota ",
      region: " Cundinamarca ",
      timezone: " America/Bogota ",
      hasVehicle: true,
      mobilityType: " Carro ",
      canTravel: true,
      travelAvailability: " Si ",
      canWorkOnsite: true,
    },
    profileQuality: {
      profileCompletenessScore: 89.6,
      experienceClarityScore: 74.2,
      dataConfidenceScore: 68.9,
      lastProfileUpdateAt: "2026-04-09",
    },
  } as never);

  assert.equal(result.certificationProfile?.records[0]?.certificationName, "AWS Solutions Architect");
  assert.equal(result.workPreferences?.expectedSalaryMin, 12000000);
  assert.deepEqual(result.workPreferences?.preferredWorkModes, ["Remoto", "Hibrido"]);
  assert.equal(result.locationProfile?.city, "Bogota");
  assert.equal(result.locationProfile?.mobilityType, "Carro");
  assert.equal(result.profileQuality?.profileCompletenessScore, 90);
  assert.equal(result.profileQuality?.experienceClarityScore, 74);
  assert.equal(result.profileQuality?.dataConfidenceScore, 69);
});

runTest("company patch keeps only safe urls and bounded arrays", () => {
  const result = sanitizeCompanyProfilePatch({
    companyName: " Acme Co ",
    website: "https://acme.example.com ",
    companyWebsite: "javascript:alert(1)",
    companySocialLinks: [
      "https://linkedin.com/company/acme",
      "javascript:alert(1)",
      "https://x.com/acme",
    ],
    hiringFocus: [" Frontend ", " Backend "],
  } as never);

  assert.equal(result.companyName, "Acme Co");
  assert.equal(result.website, undefined);
  assert.equal(result.companyWebsite, undefined);
  assert.deepEqual(result.companySocialLinks, [
    "https://linkedin.com/company/acme",
    "https://x.com/acme",
  ]);
  assert.deepEqual(result.hiringFocus, ["Frontend", "Backend"]);
});
