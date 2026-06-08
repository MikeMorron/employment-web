export function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCOP(value: number) {
  return `${new Intl.NumberFormat("es-CO", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)} COP`;
}

export function truncateLabel(label: string, max = 24) {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}
