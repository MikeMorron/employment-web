import { EditCardToggleButton } from "@/components/profile/edit-card-toggle-button";
import { GlassCard } from "@/components/ui/glass-card";
import { metricTone } from "@/lib/ui/progress-tone";
import type { UserJobFitSkill } from "@/types/user";

export function ProfileFitComparisonSection({
  isDark,
  isEditing = false,
  isCollapsed = false,
  overallFitScore,
  fitSignals,
  onToggleCollapse,
}: {
  isDark: boolean;
  isEditing?: boolean;
  isCollapsed?: boolean;
  overallFitScore: number;
  fitSignals: UserJobFitSkill[];
  onToggleCollapse?: () => void;
}) {
  const topFitSignals = fitSignals.slice(0, 3);

  return (
    <GlassCard isDark={isDark} className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? "text-cyan-200" : "text-sky-700"}`}>
            Aptitud general
          </p>
          <h3 className={isDark ? "mt-1 text-lg font-semibold text-white" : "mt-1 text-lg font-semibold text-slate-950"}>
            Comparación del perfil
          </h3>
        </div>
        {isEditing && onToggleCollapse ? (
          <EditCardToggleButton isCollapsed={isCollapsed} isDark={isDark} onClick={onToggleCollapse} />
        ) : null}
      </div>
      {isEditing && isCollapsed ? null : (
      <>
      <div className={`mt-4 ${isDark ? "rounded-[1.35rem] border border-cyan-300/24 bg-cyan-300/10 px-4 py-3 shadow-[0_14px_30px_rgba(14,165,233,0.08)]" : "rounded-[1.35rem] border border-cyan-300/35 bg-[linear-gradient(180deg,rgba(224,242,254,0.92),rgba(240,249,255,0.96))] px-4 py-3 shadow-[0_14px_30px_rgba(14,165,233,0.10)]"}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={`mt-1 break-words text-sm ${isDark ? "text-slate-100" : "text-sky-900"}`}>
              Lectura consolidada entre stack, nivel profesional y capacidad de liderazgo.
            </p>
          </div>
          <span className={isDark ? "rounded-full border border-cyan-300/20 bg-white/8 px-3 py-1 text-sm font-semibold text-cyan-100 shadow-[0_10px_22px_rgba(14,165,233,0.06)]" : "rounded-full border border-sky-300 bg-white px-3 py-1 text-sm font-semibold text-sky-800 shadow-[0_10px_22px_rgba(14,165,233,0.08)]"}>
            {overallFitScore}% apto
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {topFitSignals.map((skill) => (
          <div key={skill.label} className={isDark ? "rounded-[1.35rem] border border-cyan-300/14 bg-white/4 p-4 shadow-[0_16px_34px_rgba(0,0,0,0.16)]" : "rounded-[1.35rem] border border-sky-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,250,252,0.94))] p-4 shadow-[0_16px_34px_rgba(148,163,184,0.08)]"}>
            <div className="flex items-center justify-between gap-3">
              <span className={`min-w-0 break-words pr-2 text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{skill.label}</span>
              <span className={`shrink-0 text-sm font-semibold ${isDark ? "text-white" : "text-slate-950"}`}>
                {skill.score}% / {skill.target}%
              </span>
            </div>
            <div className="mt-3">
              <div className={`flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <span>Perfil</span>
                <span>{skill.score}%</span>
              </div>
              <div className={isDark ? "mt-2 h-2 rounded-full bg-white/10" : "mt-2 h-2 rounded-full bg-slate-200"}>
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${metricTone(skill.score)}`}
                  style={{ width: `${skill.score}%` }}
                />
              </div>
            </div>
            <div className="mt-3">
              <div className={`flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                <span>Oferta ideal</span>
                <span>{skill.target}%</span>
              </div>
              <div className={isDark ? "mt-2 h-2 rounded-full bg-white/10" : "mt-2 h-2 rounded-full bg-slate-200"}>
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                  style={{ width: `${skill.target}%` }}
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <span className={isDark ? "max-w-full break-words rounded-full border border-cyan-300/18 bg-white/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300" : "max-w-full break-words rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600"}>
                Brecha {Math.max(skill.target - skill.score, 0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
      </>
      )}
    </GlassCard>
  );
}
