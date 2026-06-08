import { JobCard } from "@/components/vacancies/job-card";
import type { VacancyBadgeSignals } from "@/lib/vacancy-popularity";
import type { Vacancy } from "@/types/vacancy";
import type { CandidateApplication } from "@/types/workflows";

export function JobGrid({
  jobs,
  badgeSignalsByJobId,
  savedIds,
  pendingSavedIds = [],
  urgentFilterActive = false,
  applicationsByJobId,
  applyingJobId,
  viewerRole = null,
  previewMode = false,
  emptyStateTitle,
  emptyStateMessage,
  onToggleSave,
  onOpenDetails,
  onViewApplication,
}: {
  jobs: Vacancy[];
  badgeSignalsByJobId?: Record<string, VacancyBadgeSignals>;
  savedIds: string[];
  pendingSavedIds?: string[];
  urgentFilterActive?: boolean;
  applicationsByJobId?: Record<string, CandidateApplication>;
  applyingJobId?: string | null;
  viewerRole?: "candidate" | "company" | null;
  previewMode?: boolean;
  emptyStateTitle?: string;
  emptyStateMessage?: string;
  onToggleSave: (id: string) => void;
  onOpenDetails: (job: Vacancy) => void;
  onViewApplication?: (job: Vacancy) => void;
}) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-[4rem] border border-dashed border-cyan-400/18 bg-[linear-gradient(180deg,rgba(7,16,31,0.82),rgba(8,17,32,0.76))] px-4 py-5 text-center shadow-[inset_0_1px_0_rgba(125,211,252,0.04)]">
        <h3 className="text-2xl font-semibold text-white">{emptyStateTitle ?? "No encontramos vacantes con esos filtros"}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-400 sm:text-base">
          {emptyStateMessage ?? "Ajusta la búsqueda o cambia los filtros para volver a abrir el panorama."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          badgeSignals={badgeSignalsByJobId?.[job.id]}
          urgentFilterActive={urgentFilterActive}
          saved={savedIds.includes(job.id)}
          savePending={pendingSavedIds.includes(job.id)}
          application={applicationsByJobId?.[job.id]}
          isApplying={applyingJobId === job.id}
          viewerRole={viewerRole}
          previewMode={previewMode}
          onToggleSave={onToggleSave}
          onOpenDetails={onOpenDetails}
          onViewApplication={onViewApplication}
        />
      ))}
    </div>
  );
}
