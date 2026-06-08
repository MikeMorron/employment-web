import type { MatchCalibrationKey, MatchCalibrationRecord, MatchWeights } from "@/types/matching";

export const CALIBRATABLE_MATCH_KEYS: MatchCalibrationKey[] = [
  "skills",
  "experience",
  "seniority",
  "modality",
  "salary",
  "languages",
];

export function buildDefaultCalibrationRecords(baseWeights: MatchWeights): MatchCalibrationRecord[] {
  return CALIBRATABLE_MATCH_KEYS.map((key) => {
    const baseWeight = baseWeights[key] ?? 0;
    return {
      key,
      weight: baseWeight,
      minWeight: Math.max(0, Math.round(baseWeight * 0.6)),
      maxWeight: Math.max(baseWeight, Math.round(baseWeight * 1.4)),
      sampleCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      lastDelta: 0,
    };
  });
}

export function getCalibrationDelta(input: {
  sampleCount: number;
  acceptedCount: number;
  rejectedCount: number;
}) {
  if (input.sampleCount < 5) {
    return 0;
  }

  const acceptanceRate = input.acceptedCount / Math.max(1, input.sampleCount);
  if (acceptanceRate >= 0.65) {
    return 1;
  }

  if (acceptanceRate <= 0.35) {
    return -1;
  }

  return 0;
}

export function applyMatchCalibration(
  weights: MatchWeights,
  calibration: MatchCalibrationRecord[] | null | undefined,
): MatchWeights {
  if (!calibration?.length) {
    return weights;
  }

  return calibration.reduce<MatchWeights>(
    (current, record) => ({
      ...current,
      [record.key]: record.weight,
    }),
    { ...weights },
  );
}
