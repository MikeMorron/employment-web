import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import {
  buildDefaultCalibrationRecords,
  CALIBRATABLE_MATCH_KEYS,
  getCalibrationDelta,
} from "@/lib/matching-calibration";
import { getCanonicalMatchWeights } from "@/lib/matching";
import type { MatchCalibrationKey, MatchCalibrationRecord } from "@/types/matching";

type MatchingCalibrationStore = Pick<
  PrismaClient,
  "matchingCalibration" | "matchingFeedback" | "matchingCalibrationHistory"
>;

type CalibrationFactorSnapshot = Partial<Record<MatchCalibrationKey, number>>;

function toStorageKey(key: MatchCalibrationKey) {
  return key === "modality" ? "workMode" : key;
}

function fromStorageKey(key: string): MatchCalibrationKey | null {
  if (key === "workMode") {
    return "modality";
  }

  return CALIBRATABLE_MATCH_KEYS.includes(key as MatchCalibrationKey)
    ? (key as MatchCalibrationKey)
    : null;
}

function parseFactorSnapshot(contextJson: string | null): CalibrationFactorSnapshot {
  if (!contextJson) {
    return {};
  }

  try {
    const parsed = JSON.parse(contextJson) as { factors?: CalibrationFactorSnapshot };
    return parsed.factors ?? {};
  } catch {
    return {};
  }
}

export async function ensureCompanyCalibrations(
  prisma: MatchingCalibrationStore,
  companyId: string,
) {
  const existing = await prisma.matchingCalibration.findMany({
    where: { companyId },
    orderBy: { key: "asc" },
  });

  const presentKeys = new Set(existing.map((row) => fromStorageKey(row.key)).filter(Boolean));
  const missingKeys = CALIBRATABLE_MATCH_KEYS.filter((key) => !presentKeys.has(key));

  if (missingKeys.length === 0 && existing.length > 0) {
    return existing;
  }

  const defaults = buildDefaultCalibrationRecords(getCanonicalMatchWeights());
  const data = defaults
    .filter((item) => missingKeys.includes(item.key))
    .map((item) => ({
      id: randomUUID(),
      companyId,
      key: toStorageKey(item.key),
      weight: item.weight,
      minWeight: item.minWeight,
      maxWeight: item.maxWeight,
      sampleCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      lastDelta: 0,
    }));

  if (data.length > 0) {
    await prisma.matchingCalibration.createMany({
      data,
    });
  }

  return prisma.matchingCalibration.findMany({
    where: { companyId },
    orderBy: { key: "asc" },
  });
}

export async function getCompanyCalibrationRecords(
  prisma: MatchingCalibrationStore,
  companyId: string,
): Promise<MatchCalibrationRecord[]> {
  const rows = await ensureCompanyCalibrations(prisma, companyId);

  return rows.map((row) => ({
    key: fromStorageKey(row.key) ?? "skills",
    weight: row.weight,
    minWeight: row.minWeight,
    maxWeight: row.maxWeight,
    sampleCount: row.sampleCount,
    acceptedCount: row.acceptedCount,
    rejectedCount: row.rejectedCount,
    lastDelta: row.lastDelta,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function recalibrateCompanyMatching(
  prisma: MatchingCalibrationStore,
  companyId: string,
) {
  const calibrations = await ensureCompanyCalibrations(prisma, companyId);
  const feedbackRows = await prisma.matchingFeedback.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const defaultWeights = getCanonicalMatchWeights();
  const grouped = new Map<
    MatchCalibrationKey,
    { sampleCount: number; acceptedCount: number; rejectedCount: number }
  >(
    CALIBRATABLE_MATCH_KEYS.map((key) => [
      key,
      { sampleCount: 0, acceptedCount: 0, rejectedCount: 0 },
    ]),
  );

  for (const row of feedbackRows) {
    const factorSnapshot = parseFactorSnapshot(row.contextJson);
    const touchedKeys = CALIBRATABLE_MATCH_KEYS.filter(
      (key) => typeof factorSnapshot[key] === "number" && (factorSnapshot[key] ?? 0) >= 60,
    );

    for (const key of touchedKeys) {
      const current = grouped.get(key)!;
      current.sampleCount += 1;
      if (row.scoreDelta > 0) {
        current.acceptedCount += 1;
      }
      if (row.scoreDelta < 0) {
        current.rejectedCount += 1;
      }
    }
  }

  for (const calibration of calibrations) {
    const key = calibration.key as MatchCalibrationKey;
    const aggregate = grouped.get(key)!;
    const delta = getCalibrationDelta(aggregate);
    const nextWeight = Math.max(
      calibration.minWeight,
      Math.min(calibration.maxWeight, calibration.weight + delta),
    );

    if (delta !== 0 || calibration.sampleCount !== aggregate.sampleCount) {
      await prisma.matchingCalibration.update({
        where: {
          companyId_key: {
            companyId,
            key: toStorageKey(key),
          },
        },
        data: {
          weight: nextWeight,
          sampleCount: aggregate.sampleCount,
          acceptedCount: aggregate.acceptedCount,
          rejectedCount: aggregate.rejectedCount,
          lastDelta: delta,
        },
      });

      if (delta !== 0) {
        await prisma.matchingCalibrationHistory.create({
          data: {
            id: randomUUID(),
            companyId,
            key: toStorageKey(key),
            previousWeight: calibration.weight,
            nextWeight,
            delta,
            sampleCount: aggregate.sampleCount,
            acceptedCount: aggregate.acceptedCount,
            rejectedCount: aggregate.rejectedCount,
            reason: `Auto calibration from feedback. Base=${defaultWeights[key]}`,
          },
        });
      }
    }
  }

  return getCompanyCalibrationRecords(prisma, companyId);
}

export async function resetCompanyMatchingCalibration(
  prisma: MatchingCalibrationStore,
  companyId: string,
) {
  const defaults = buildDefaultCalibrationRecords(getCanonicalMatchWeights());

  for (const item of defaults) {
    await prisma.matchingCalibration.upsert({
      where: {
        companyId_key: {
          companyId,
          key: toStorageKey(item.key),
        },
      },
      update: {
        weight: item.weight,
        minWeight: item.minWeight,
        maxWeight: item.maxWeight,
        sampleCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        lastDelta: 0,
      },
      create: {
        id: randomUUID(),
        companyId,
        key: toStorageKey(item.key),
        weight: item.weight,
        minWeight: item.minWeight,
        maxWeight: item.maxWeight,
        sampleCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        lastDelta: 0,
      },
    });

    await prisma.matchingCalibrationHistory.create({
      data: {
        id: randomUUID(),
        companyId,
        key: toStorageKey(item.key),
        previousWeight: item.weight,
        nextWeight: item.weight,
        delta: 0,
        sampleCount: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        reason: "Manual reset",
      },
    });
  }

  return getCompanyCalibrationRecords(prisma, companyId);
}
