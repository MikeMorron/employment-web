import assert from "node:assert/strict";
import {
  AVAILABILITY_LABEL_MAP,
  EDUCATION_LABEL_MAP,
  EMPTY_CERTIFICATION_DRAFT,
  EMPTY_EDUCATION_DRAFT,
  SENIORITY_LABEL_MAP,
} from "@/components/profile/candidate-match-profile/constants";
import {
  buildCertificationDisplayName,
  formatDisplayDate,
  popupFieldClassName,
  sanitizeClientFileSegment,
} from "@/components/profile/candidate-match-profile/utils";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("candidate match profile defaults stay initialized for new popups", () => {
  assert.equal(EMPTY_EDUCATION_DRAFT.educationType, "universidad_pregrado");
  assert.equal(EMPTY_EDUCATION_DRAFT.focusAreas.length, 0);
  assert.equal(EMPTY_CERTIFICATION_DRAFT.proofImageName, "");
  assert.equal(EMPTY_CERTIFICATION_DRAFT.proofImageThumbnailUrl, "");
});

runTest("candidate match profile label maps keep canonical labels", () => {
  assert.equal(SENIORITY_LABEL_MAP.senior, "Senior");
  assert.equal(AVAILABILITY_LABEL_MAP.available_now, "Disponible ahora");
  assert.equal(EDUCATION_LABEL_MAP.maestria, "Maestría");
});

runTest("candidate match profile utility helpers normalize display and file names", () => {
  assert.equal(formatDisplayDate("2026-04-15"), "15 de abril de 2026");
  assert.equal(formatDisplayDate("fecha libre"), "fecha libre");
  assert.equal(sanitizeClientFileSegment("José Pérez / QA", 30), "Jose_Perez_QA");
  assert.equal(
    buildCertificationDisplayName("SENA", "Cloud Practitioner", "María López"),
    "SENA_Cloud_Practitioner_Maria.webp",
  );
  assert.ok(popupFieldClassName("campo-base", true).includes("border-red-400"));
  assert.equal(popupFieldClassName("campo-base", false), "campo-base");
});
