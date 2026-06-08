import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, ".integrity-manifest.json");
const command = process.argv.includes("--verify") ? "verify" : "build";

const includeRoots = [
  "backend",
  "frontend",
  "compartido",
];

const includeFiles = [
  "package.json",
  "pnpm-lock.yaml",
  "tsconfig.json",
  "eslint.config.mjs",
  "frontend/next.config.ts",
  "frontend/postcss.config.mjs",
  "frontend/proxy.ts",
  "frontend/tsconfig.json",
  "frontend/next-env.d.ts",
];

const ignoredSegmentNames = new Set([".git", ".next", "node_modules", ".omx"]);
const ignoredFiles = new Set([".integrity-manifest.json"]);

function shouldIgnorePath(relativePath) {
  return relativePath.split("/").some((segment) => ignoredSegmentNames.has(segment));
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, relativeBase = "") {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.posix.join(relativeBase, entry.name);

    if (ignoredFiles.has(relativePath)) {
      continue;
    }

    if (shouldIgnorePath(relativePath)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(fullPath, relativePath));
      continue;
    }

    if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

async function collectProtectedFiles() {
  const files = new Set();

  for (const includeRoot of includeRoots) {
    const absoluteRoot = path.join(root, includeRoot);
    if (await exists(absoluteRoot)) {
      for (const file of await walk(absoluteRoot, includeRoot)) {
        files.add(file);
      }
    }
  }

  for (const includeFile of includeFiles) {
    if (await exists(path.join(root, includeFile))) {
      files.add(includeFile);
    }
  }

  return [...files].sort();
}

async function hashFile(relativePath) {
  const absolutePath = path.join(root, relativePath);
  const buffer = await fs.readFile(absolutePath);

  return {
    sha256: createHash("sha256").update(buffer).digest("hex"),
    size: buffer.byteLength,
  };
}

async function buildManifest() {
  const files = await collectProtectedFiles();
  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    files: {},
  };

  for (const file of files) {
    manifest.files[file] = await hashFile(file);
  }

  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Integrity manifest written: ${manifestPath}`);
  console.log(`Protected files: ${files.length}`);
}

async function verifyManifest() {
  const raw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw);
  const mismatches = [];

  for (const [relativePath, expected] of Object.entries(manifest.files)) {
    try {
      const actual = await hashFile(relativePath);
      if (actual.sha256 !== expected.sha256 || actual.size !== expected.size) {
        mismatches.push(relativePath);
      }
    } catch {
      mismatches.push(relativePath);
    }
  }

  if (mismatches.length > 0) {
    console.error("Integrity verification failed:");
    for (const mismatch of mismatches) {
      console.error(`- ${mismatch}`);
    }
    process.exit(1);
  }

  console.log(`Integrity verification passed for ${Object.keys(manifest.files).length} files.`);
}

if (command === "verify") {
  await verifyManifest();
} else {
  await buildManifest();
}
