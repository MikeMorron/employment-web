export function metricTone(score: number) {
  if (score >= 75) {
    return "from-emerald-400 to-teal-400";
  }

  if (score >= 55) {
    return "from-sky-500 to-cyan-400";
  }

  return "from-amber-400 to-orange-400";
}
