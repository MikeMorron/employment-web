import type { Vacancy } from "@/types/vacancy";

const FEATURED_RECENT_CLICKS_THRESHOLD = 120;
const FEATURED_RECENT_WINDOW_DAYS = 14;

export function qualifiesAsFeaturedVacancy(job: Vacancy) {
  const recentClicks = job.clicksDetalleDosDias ?? 0;
  const daysSincePosted = job.diasDesdePublicacion ?? 0;

  return (
    job.publicadorTipo === "empresa" &&
    recentClicks >= FEATURED_RECENT_CLICKS_THRESHOLD &&
    daysSincePosted <= FEATURED_RECENT_WINDOW_DAYS
  );
}
