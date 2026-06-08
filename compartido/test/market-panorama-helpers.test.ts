import assert from "node:assert/strict";
import {
  getConclusionCopy,
  getFeaturedMarketCards,
  groupCards,
  localizeCard,
  sectionMeta,
} from "@/components/sections/market-panorama/helpers";
import type { MetricCard } from "@/lib/market/types";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function buildCard(overrides: Partial<MetricCard>): MetricCard {
  return {
    id: "card",
    section: "mercado",
    eyebrow: "Mercado",
    title: "Tarjeta",
    value: 10,
    unit: "%",
    meta: "meta",
    description: "descripcion",
    status: "official",
    sourceLabel: "Fuente",
    chartType: "line",
    chartPoints: [{ label: "2026 (ene)", value: 10 }],
    priority: 1,
    ...overrides,
  };
}

runTest("market panorama groups cards by canonical section order", () => {
  const groups = groupCards([
    buildCard({ id: "skills", section: "demanda", priority: 3 }),
    buildCard({ id: "salary", section: "salarios", priority: 2 }),
    buildCard({ id: "market", section: "mercado", priority: 1 }),
  ]);

  assert.deepEqual(
    groups.map((group) => group.section),
    ["mercado", "demanda", "salarios"],
  );
  assert.equal(groups[0]?.title, sectionMeta.mercado.title.es);
  assert.equal(groups[1]?.description, sectionMeta.demanda.description.es);
});

runTest("market panorama localizes known cards and chart labels in english", () => {
  const localized = localizeCard(
    buildCard({
      id: "education-demand",
      section: "demanda",
      eyebrow: "Demanda",
      title: "Nivel educativo más demandado",
      chartPoints: [{ label: "Bachiller", value: 55 }],
    }),
    true,
  );

  assert.equal(localized.title, "Most demanded education level");
  assert.equal(localized.eyebrow, "Demand");
  assert.equal(localized.chartPoints?.[0]?.label, "High school");
});

runTest("market panorama highlights the expected featured market cards", () => {
  const cards = [
    buildCard({ id: "employment-rate" }),
    buildCard({ id: "unemployment-rate" }),
    buildCard({ id: "annual-unemployment-comparison" }),
    buildCard({ id: "annual-unemployment-delta" }),
  ];
  const featured = getFeaturedMarketCards(cards);

  assert.deepEqual(
    featured.primary.map((card) => card.id),
    ["unemployment-rate", "employment-rate"],
  );
  assert.deepEqual(
    featured.secondary.map((card) => card.id),
    ["annual-unemployment-delta", "annual-unemployment-comparison"],
  );
});

runTest("market panorama conclusion copy stays bilingual", () => {
  assert.equal(getConclusionCopy(true).label, "Labor market conclusion (2020-2026)");
  assert.equal(getConclusionCopy(false).label, "Conclusión del mercado laboral (2020–2026)");
});
