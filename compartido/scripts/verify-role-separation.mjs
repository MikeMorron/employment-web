import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const buckets = [
  ["frontend", "usuario"],
  ["frontend", "empresa"],
  ["backend", "usuario"],
  ["backend", "empresa"],
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

const duplicates = [];

for (const [layer, role] of buckets) {
  const roleRoot = path.join(root, layer, role);
  const sharedRoot =
    layer === "frontend"
      ? path.join(root, "compartido")
      : path.join(root, layer, "compartido");
  if (!fs.existsSync(roleRoot) || !fs.existsSync(sharedRoot)) {
    continue;
  }

  for (const file of walk(roleRoot)) {
    const relative = path.relative(roleRoot, file);
    if (layer === "frontend" && relative.startsWith("app/")) {
      continue;
    }
    const maybeShared = path.join(sharedRoot, relative);
    if (fs.existsSync(maybeShared)) {
      duplicates.push(`${layer}/${role}/${relative}`);
    }
  }
}

if (duplicates.length > 0) {
  console.error("Found role-specific files duplicated inside compartido:");
  for (const duplicate of duplicates) {
    console.error(`- ${duplicate}`);
  }
  process.exit(1);
}

console.log("Role separation check passed.");
