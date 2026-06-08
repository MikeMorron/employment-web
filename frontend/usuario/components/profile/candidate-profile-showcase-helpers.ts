import type { CandidateEducationRecord, ExperienceItem } from "@/types/profile";

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function formatDisplayDate(value?: string) {
  if (!value?.trim()) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "America/Bogota",
    }).format(new Date(`${value}T00:00:00-05:00`));
  }

  if (/^\d{4}-\d{2}$/.test(value.trim())) {
    const [year, month] = value.split("-");
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "short",
      timeZone: "America/Bogota",
    }).format(new Date(`${year}-${month}-01T00:00:00-05:00`));
  }

  return value;
}

export function formatExperienceRange(item: ExperienceItem) {
  const start = formatDisplayDate(item.fechaInicio ?? item.startDate);
  const end = item.actualidad || item.current ? "Hoy" : formatDisplayDate(item.fechaFin ?? item.endDate);

  if (start && end) {
    return `${start} - ${end}`;
  }

  if (item.tiempo?.trim()) {
    return item.tiempo.trim();
  }

  return start || end || "Trayectoria activa";
}

export function pickLatestEducation(records: CandidateEducationRecord[] | undefined) {
  if (!records?.length) {
    return null;
  }

  return [...records].sort((left, right) => {
    const leftValue = left.endDate ?? left.startDate ?? "";
    const rightValue = right.endDate ?? right.startDate ?? "";
    return rightValue.localeCompare(leftValue);
  })[0] ?? null;
}

export function formatSeniority(value?: string) {
  if (!value?.trim()) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function cleanLocation(value?: string) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

export function formatCopAmount(value?: number) {
  if (!value || Number.isNaN(value)) {
    return "";
  }

  return `$${new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(value)}`;
}

export function formatCopTextValue(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.includes("$")) {
    return trimmed;
  }

  const numericValue = Number(trimmed.replace(/[^\d]/g, ""));
  if (Number.isFinite(numericValue) && numericValue > 0) {
    return formatCopAmount(numericValue);
  }

  return `$${trimmed}`;
}
