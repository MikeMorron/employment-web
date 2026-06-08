import assert from "node:assert/strict";
import {
  DASHBOARD_PRESETS,
  DEFAULT_LAYOUTS,
  DEFAULT_WIDGETS,
  WIDGET_ORDER,
  getDaysSince,
} from "@/app/analytics/_lib/dashboard-config";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("analytics dashboard keeps the canonical widget order and layouts", () => {
  assert.deepEqual(WIDGET_ORDER, [
    "funnel",
    "trend",
    "performance",
    "pipeline",
    "stage_time",
    "matching",
  ]);
  assert.equal(DEFAULT_LAYOUTS.lg.length, WIDGET_ORDER.length);
  assert.equal(DEFAULT_LAYOUTS.md.length, WIDGET_ORDER.length);
  assert.equal(DEFAULT_LAYOUTS.sm.length, WIDGET_ORDER.length);
  assert.equal(Object.keys(DEFAULT_WIDGETS).length, WIDGET_ORDER.length);
});

runTest("analytics presets keep their current visibility and chart defaults", () => {
  const base = {
    rangePreset: "7d" as const,
    customFrom: "",
    customTo: "",
    vacancyId: "",
    editMode: false,
    widgets: DEFAULT_WIDGETS,
    layouts: DEFAULT_LAYOUTS,
  };
  const conversion = DASHBOARD_PRESETS.find((preset) => preset.id === "company_conversion");
  const executive = DASHBOARD_PRESETS.find((preset) => preset.id === "company_executive");

  assert.ok(conversion);
  assert.ok(executive);

  const conversionConfig = conversion!.apply(base);
  assert.equal(conversionConfig.widgets.funnel.chartType, "step");
  assert.equal(conversionConfig.widgets.trend.chartType, "area");
  assert.equal(conversionConfig.widgets.performance.chartType, "scatter");
  assert.equal(conversionConfig.widgets.pipeline.hidden, true);
  assert.equal(conversionConfig.widgets.stage_time.hidden, true);

  const executiveConfig = executive!.apply(base);
  assert.equal(executiveConfig.widgets.pipeline.chartType, "list");
  assert.equal(executiveConfig.widgets.performance.hidden, true);
  assert.equal(executiveConfig.widgets.matching.chartType, "circular");
});

runTest("analytics date helper never goes below zero and counts elapsed days", () => {
  const originalNow = Date.now;
  Date.now = () => new Date("2026-04-15T12:00:00.000Z").getTime();

  try {
    assert.equal(getDaysSince("2026-04-20T12:00:00.000Z"), 0);
    assert.equal(getDaysSince("2026-04-13T12:00:00.000Z"), 2);
  } finally {
    Date.now = originalNow;
  }
});
