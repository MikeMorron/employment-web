import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

type IntegrityManifest = {
  version: number;
  generatedAt: string;
  files: Record<string, { sha256: string; size: number }>;
};

type IntegrityStatus = {
  valid: boolean;
  reason?: string;
  checkedAt: string;
};

type IntegrityCache = {
  lastCheckedAt: number;
  status: IntegrityStatus;
};

const MANIFEST_PATH = path.join(process.cwd(), ".integrity-manifest.json");
const CACHE_TTL_MS = 30_000;

declare global {
  var __talentIntegrityCache__: IntegrityCache | undefined;
}

function isIntegrityEnforced() {
  return process.env.APP_INTEGRITY_ENFORCED === "true" || process.env.NODE_ENV === "production";
}

function createStatus(valid: boolean, reason?: string): IntegrityStatus {
  return {
    valid,
    reason,
    checkedAt: new Date().toISOString(),
  };
}

async function hashFile(filePath: string) {
  const buffer = await fs.readFile(filePath);
  return {
    sha256: createHash("sha256").update(buffer).digest("hex"),
    size: buffer.byteLength,
  };
}

async function readManifest() {
  const raw = await fs.readFile(MANIFEST_PATH, "utf8");
  return JSON.parse(raw) as IntegrityManifest;
}

async function computeIntegrityStatus(): Promise<IntegrityStatus> {
  if (!isIntegrityEnforced()) {
    return createStatus(true, "Integrity enforcement disabled");
  }

  let manifest: IntegrityManifest;

  try {
    manifest = await readManifest();
  } catch {
    return createStatus(false, "Missing or unreadable integrity manifest");
  }

  for (const [relativePath, expected] of Object.entries(manifest.files)) {
    const absolutePath = path.join(process.cwd(), relativePath);

    try {
      const actual = await hashFile(absolutePath);
      if (actual.sha256 !== expected.sha256 || actual.size !== expected.size) {
        return createStatus(false, `Integrity mismatch detected in ${relativePath}`);
      }
    } catch {
      return createStatus(false, `Protected file missing or unreadable: ${relativePath}`);
    }
  }

  return createStatus(true);
}

export async function getAppIntegrityStatus(): Promise<IntegrityStatus> {
  const now = Date.now();
  const cached = globalThis.__talentIntegrityCache__;
  if (cached && now - cached.lastCheckedAt < CACHE_TTL_MS) {
    return cached.status;
  }

  const status = await computeIntegrityStatus();
  globalThis.__talentIntegrityCache__ = {
    lastCheckedAt: now,
    status,
  };
  return status;
}
