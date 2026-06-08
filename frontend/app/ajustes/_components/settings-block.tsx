"use client";

import type { ResolvedBlock } from "@/app/ajustes/_lib/settings-sections";
import { ToggleSwitch } from "@/app/ajustes/_components/toggle-switch";

interface SettingsBlockProps {
  isDark: boolean;
  isEnglish: boolean;
  blocks: ResolvedBlock[];
  toggleState: Record<string, boolean>;
  sliderState: Record<string, number>;
  choiceState: Record<string, string>;
  expandedItems: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSliderChange: (id: string, value: number) => void;
  onChoiceChange: (id: string, value: string) => void;
  onToggleExpanded: (id: string) => void;
}

export function SettingsBlock({
  isDark,
  isEnglish,
  blocks,
  toggleState,
  sliderState,
  choiceState,
  expandedItems,
  onToggle,
  onSliderChange,
  onChoiceChange,
  onToggleExpanded,
}: SettingsBlockProps) {
  return (
    <div className="mt-5 grid gap-4 xl:grid-cols-2">
      {blocks.map((block) => (
        <div
          key={block.title}
          className={
            isDark
              ? "rounded-[1.35rem] border border-white/8 bg-[#081120]/72 p-4"
              : "rounded-[1.35rem] border border-slate-300 bg-slate-50/80 p-4"
          }
        >
          <p className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>
            {block.title}
          </p>
          <div className="mt-4 space-y-3">
            {block.items.map((item) => {
              const isToggle = item.kind === undefined || item.kind === "toggle";
              const checked = toggleState[item.id] ?? false;
              const currentSliderValue = sliderState[item.id];
              const currentChoice = choiceState[item.id];
              const expanded = expandedItems[item.id] ?? false;

              return (
                <div
                  key={item.id}
                  className={
                    isDark
                      ? "rounded-[1.15rem] border border-white/8 bg-white/4 px-4 py-3"
                      : "rounded-[1.15rem] border border-slate-300 bg-white px-4 py-3"
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-900"}>
                        {item.label}
                      </p>
                      {item.description ? (
                        <p className={isDark ? "mt-1 text-sm leading-6 text-slate-300" : "mt-1 text-sm leading-6 text-slate-600"}>
                          {item.description}
                        </p>
                      ) : null}
                      {item.valueLabel ? (
                        <p className={isDark ? "mt-1 text-sm text-slate-300" : "mt-1 text-sm text-slate-600"}>
                          {item.kind === "slider"
                            ? `${currentSliderValue ?? item.valueLabel}`
                            : item.kind === "choice" && item.options
                              ? item.options.find((option) => option.id === currentChoice)?.label ?? item.valueLabel
                              : item.valueLabel}
                        </p>
                      ) : null}
                    </div>

                    {isToggle ? (
                      <ToggleSwitch
                        isDark={isDark}
                        checked={checked}
                        onChange={() => onToggle(item.id)}
                      />
                    ) : null}

                    {item.kind === "action" ? (
                      item.actionLabel ? (
                        <button
                          type="button"
                          onClick={() => onToggleExpanded(item.id)}
                          className={
                            isDark
                              ? "rounded-full border border-cyan-300/18 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/16"
                              : "rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                          }
                        >
                          {expanded ? (isEnglish ? "Hide" : "Ocultar") : item.actionLabel}
                        </button>
                      ) : null
                    ) : null}

                    {item.kind === "slider" ? (
                      <button
                        type="button"
                        onClick={() => onToggleExpanded(item.id)}
                        className={isDark ? "rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/16" : "rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"}
                      >
                        {typeof currentSliderValue === "number"
                          ? `${currentSliderValue}${item.suffix ?? ""}`
                          : item.valueLabel}
                      </button>
                    ) : null}

                    {item.kind === "choice" ? (
                      <div className="flex items-center gap-2">
                        <span className={isDark ? "rounded-full border border-violet-300/18 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-100" : "rounded-full border border-violet-300 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700"}>
                          {item.options?.find((option) => option.id === currentChoice)?.label ?? item.valueLabel}
                        </span>
                        {item.actionLabel ? (
                          <button
                            type="button"
                            onClick={() => onToggleExpanded(item.id)}
                            className={
                              isDark
                                ? "rounded-full border border-violet-300/18 bg-violet-400/10 px-3 py-1 text-xs font-semibold text-violet-100 transition hover:bg-violet-400/16"
                                : "rounded-full border border-violet-300 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                            }
                          >
                            {expanded ? (isEnglish ? "Hide" : "Ocultar") : item.actionLabel}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  {item.kind === "slider" && item.min !== undefined && item.max !== undefined && expanded ? (
                    <div className="mt-4">
                      <p className={isDark ? "mb-3 text-xs uppercase tracking-[0.16em] text-slate-400" : "mb-3 text-xs uppercase tracking-[0.16em] text-slate-500"}>
                        {isEnglish ? "Move the bar to adjust the threshold" : "Mueve la barra para ajustar el porcentaje"}
                      </p>
                      <input
                        type="range"
                        min={item.min}
                        max={item.max}
                        value={currentSliderValue ?? item.min}
                        onChange={(event) => onSliderChange(item.id, Number(event.target.value))}
                        className="vacancy-range vacancy-range-blue"
                      />
                    </div>
                  ) : null}

                  {item.kind === "choice" && item.options ? (
                    <div className="mt-4 grid gap-2">
                      {item.options.map((option) => {
                        const active = currentChoice === option.id;

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => onChoiceChange(item.id, option.id)}
                            className={`rounded-[1rem] border px-3 py-3 text-left transition ${
                              active
                                ? isDark
                                  ? "border-violet-200/40 bg-violet-300/10"
                                  : "border-violet-400 bg-violet-50"
                                : isDark
                                  ? "border-white/8 bg-white/3 hover:border-violet-200/24"
                                  : "border-slate-200 bg-slate-50 hover:border-slate-300"
                            }`}
                            aria-pressed={active}
                          >
                            <p className={isDark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-900"}>
                              {option.label}
                            </p>
                            {option.description ? (
                              <p className={isDark ? "mt-1 text-sm leading-6 text-slate-300" : "mt-1 text-sm leading-6 text-slate-600"}>
                                {option.description}
                              </p>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {expanded && item.details?.length ? (
                    <div className={isDark ? "mt-4 rounded-[1rem] border border-white/8 bg-white/4 px-4 py-4 text-sm leading-7 text-slate-300" : "mt-4 rounded-[1rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-700"}>
                      {item.details.map((detail) => (
                        <p key={detail} className="mt-2 first:mt-0">
                          {detail}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
