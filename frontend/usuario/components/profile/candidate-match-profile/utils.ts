export function formatDisplayDate(value?: string) {
  if (!value) {
    return "";
  }

  const parsed = new Date(`${value}T00:00:00-05:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export function sanitizeClientFileSegment(value: string, maxLength: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, maxLength);
}

export function buildCertificationDisplayName(
  issuer: string,
  certificationName: string,
  userName: string,
) {
  const firstName =
    sanitizeClientFileSegment(userName.trim().split(/\s+/)[0] ?? "", 30) ||
    "usuario";
  const issuerSegment = sanitizeClientFileSegment(issuer, 40) || "entidad";
  const certificationSegment =
    sanitizeClientFileSegment(certificationName, 40) || "programa";
  return `${issuerSegment}_${certificationSegment}_${firstName}.webp`;
}

export function popupFieldClassName(
  inputClassName: string,
  hasError: boolean,
) {
  return hasError
    ? `${inputClassName} border-red-400 focus:border-red-500 focus:ring-red-500/30`
    : inputClassName;
}
