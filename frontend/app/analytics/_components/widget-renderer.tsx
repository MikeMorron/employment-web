"use client";

import { BarChart3, Clock3, TrendingUp } from "lucide-react";
import {
  BlockShell,
  FunnelBars,
  FunnelStep,
  InsightCard,
  PerformanceChart,
  PipelineChart,
  SimpleBars,
  SimpleCircular,
  SimpleLine,
  SimpleScatter,
  SimpleVertical,
  StageDurationChart,
  TrendChart,
  AnalyticsEmptyBlock,
} from "@/app/analytics/_components/dashboard-visuals";
import type { ChartType, WidgetConfig, WidgetId } from "@/app/analytics/_lib/dashboard-config";
import type { DashboardData } from "@/app/analytics/_lib/use-dashboard-data";

interface WidgetRendererProps {
  widgetId: WidgetId;
  isDark: boolean;
  widget: WidgetConfig;
  editMode: boolean;
  onToggleHidden: () => void;
  onChartTypeChange: (type: ChartType) => void;
  data: DashboardData;
  matchQuality: { averageMatch: number; high: number; medium: number; low: number };
}

export function WidgetRenderer({
  widgetId,
  isDark,
  widget,
  editMode,
  onToggleHidden,
  onChartTypeChange,
  data,
  matchQuality,
}: WidgetRendererProps) {
  const commonProps = {
    isDark,
    widget,
    editMode,
    onToggleHidden,
    onChartTypeChange,
  };

  if (widgetId === "funnel") {
    const content =
      widget.chartType === "vertical" ? (
        <SimpleVertical isDark={isDark} rows={data.funnelStages} />
      ) : widget.chartType === "step" ? (
        <FunnelStep isDark={isDark} stages={data.funnelStages} />
      ) : data.funnelStages.length === 0 ||
        data.funnelStages.every((stage) => stage.value === 0) ? (
        <AnalyticsEmptyBlock
          isDark={isDark}
          title="El embudo todavía está vacío"
          copy="Cuando una vacante acumule vistas, clics y postulaciones, aquí verás dónde se corta el proceso."
          ctaHref="/publicadas"
          ctaLabel="Mejorar vacante"
        />
      ) : (
        <FunnelBars isDark={isDark} stages={data.funnelStages} />
      );

    return (
      <BlockShell {...commonProps} icon={BarChart3}>
        {content}
      </BlockShell>
    );
  }

  if (widgetId === "trend") {
    return (
      <BlockShell {...commonProps} icon={TrendingUp}>
        <TrendChart isDark={isDark} points={data.applicationsByDay} type={widget.chartType} />
      </BlockShell>
    );
  }

  if (widgetId === "performance") {
    return (
      <BlockShell {...commonProps} icon={BarChart3}>
        {widget.chartType === "scatter" ? (
          data.performanceRows.length === 0 ||
          data.performanceRows.every((row) => row.value === 0) ? (
            <AnalyticsEmptyBlock
              isDark={isDark}
              title="No hay actividad en tus vacantes"
              copy="Aún no tienes señales suficientes para comparar rendimiento entre publicaciones."
            />
          ) : (
            <SimpleScatter isDark={isDark} rows={data.performanceRows} />
          )
        ) : widget.chartType === "histogram" ? (
          data.performanceRows.length === 0 ||
          data.performanceRows.every((row) => row.value === 0) ? (
            <AnalyticsEmptyBlock
              isDark={isDark}
              title="No hay actividad en tus vacantes"
              copy="Aún no tienes señales suficientes para comparar rendimiento entre publicaciones."
            />
          ) : (
            <SimpleVertical isDark={isDark} rows={data.performanceRows} />
          )
        ) : (
          <PerformanceChart
            isDark={isDark}
            rows={data.performanceRows}
            insightsByLabel={data.perVacancyInsights}
          />
        )}
      </BlockShell>
    );
  }

  if (widgetId === "pipeline") {
    return (
      <BlockShell {...commonProps} icon={TrendingUp}>
        <PipelineChart isDark={isDark} rows={data.pipelineByStage} type={widget.chartType} />
      </BlockShell>
    );
  }

  if (widgetId === "stage_time") {
    return (
      <BlockShell {...commonProps} icon={Clock3}>
        {widget.chartType === "line" ? (
          <SimpleLine isDark={isDark} rows={data.averageStageDays} />
        ) : widget.chartType === "histogram" ? (
          <SimpleVertical isDark={isDark} rows={data.averageStageDays} />
        ) : (
          <StageDurationChart isDark={isDark} rows={data.averageStageDays} />
        )}
      </BlockShell>
    );
  }

  const matchRows = [
    { label: "Alta", value: matchQuality.high },
    { label: "Media", value: matchQuality.medium },
    { label: "Baja", value: matchQuality.low },
  ];

  return (
    <BlockShell {...commonProps} icon={TrendingUp}>
      {matchQuality.averageMatch > 0 ? (
        widget.chartType === "bars" ? (
          <SimpleBars isDark={isDark} rows={matchRows} />
        ) : widget.chartType === "histogram" ? (
          <SimpleVertical isDark={isDark} rows={matchRows} />
        ) : (
          <SimpleCircular isDark={isDark} rows={matchRows} />
        )
      ) : (
        <AnalyticsEmptyBlock
          isDark={isDark}
          title="Aún no hay suficiente información para calcular la compatibilidad"
          copy="Recibe más postulaciones para activar la información del panel"
        />
      )}
    </BlockShell>
  );
}

export { InsightCard };
