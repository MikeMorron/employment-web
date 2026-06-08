const PLACEHOLDER_PATTERN =
  /\$\{\s*([a-zA-Z0-9_.-]+)\s*\}|\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}|\{\s*([a-zA-Z0-9_.-]+)\s*\}/g;

function getPathValue(source: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[key];
  }, source);
}

function stringifyVisibleValue(value: unknown) {
  if (value == null) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function compactVisibleText(value: string) {
  return value
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

export function sanitizeVisibleText(
  input: string,
  variables?: Record<string, unknown>,
) {
  if (!input) {
    return input;
  }

  const resolved = input.replace(PLACEHOLDER_PATTERN, (_match, jsStyleKey, doubleBraceKey, singleBraceKey) => {
    const key = jsStyleKey || doubleBraceKey || singleBraceKey;
    if (!key) {
      return "";
    }

    return stringifyVisibleValue(getPathValue(variables ?? {}, key));
  });

  return compactVisibleText(resolved);
}
