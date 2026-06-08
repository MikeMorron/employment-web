import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const envCache = new Map<string, string>();
let loaded = false;

function stripQuotes(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function loadEnvFiles() {
  if (loaded) {
    return;
  }

  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "frontend/.env"),
    path.resolve(process.cwd(), "../.env"),
  ];

  for (const filePath of candidates) {
    if (!existsSync(filePath)) {
      continue;
    }

    const content = readFileSync(filePath, "utf8");
    for (const rawLine of content.split(/\r?\n/g)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = stripQuotes(line.slice(separatorIndex + 1));
      if (key && value && !envCache.has(key)) {
        envCache.set(key, value);
      }
    }
  }

  loaded = true;
}

export function getEnvWithLocalFallback(name: string) {
  const direct = process.env[name]?.trim();
  if (direct) {
    return direct;
  }

  loadEnvFiles();
  return envCache.get(name)?.trim() || "";
}
