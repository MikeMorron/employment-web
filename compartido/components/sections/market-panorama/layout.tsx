"use client";

import type { DashboardSection, MetricCard } from "@/lib/market/types";
import { MetricCardView } from "@/components/sections/market-panorama/cards";

export function PanoramaPreviewBoard({
  isDark,
  cards,
}: {
  isDark: boolean;
  cards: MetricCard[];
}) {
  const previewCards = ["unemployment-rate", "employment-rate", "education-demand"]
    .map((id) => cards.find((card) => card.id === id))
    .filter(Boolean) as MetricCard[];

  if (!previewCards.length) {
    return null;
  }

  return (
    <div className="mt-8 grid gap-4 lg:grid-cols-3">
      {previewCards.map((card, index) => (
        <div key={`preview-card-${card.id}`} className="h-full">
          <MetricCardView
            isDark={isDark}
            card={card}
            iconIndex={index}
            variant="medium"
          />
        </div>
      ))}
    </div>
  );
}

export function SectionLayout({
  isDark,
  section,
  cards,
  featuredMarketCards,
}: {
  isDark: boolean;
  section: DashboardSection;
  cards: MetricCard[];
  featuredMarketCards: {
    primary: MetricCard[];
    secondary: MetricCard[];
  };
}) {
  if (section === "mercado") {
    return (
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          {featuredMarketCards.primary.map((card, index) => (
            <MetricCardView
              key={card.id}
              isDark={isDark}
              card={card}
              iconIndex={index}
              variant="hero"
            />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {featuredMarketCards.secondary.map((card, index) => (
            <MetricCardView
              key={card.id}
              isDark={isDark}
              card={card}
              iconIndex={index + 2}
              variant="medium"
            />
          ))}
        </div>
      </div>
    );
  }

  if (section === "demanda") {
    const wideCard = cards.find((card) => card.id === "top-skills");
    const conditionsCard = cards.find((card) => card.id === "labor-conditions");
    const regularCards = [
      ...cards.filter((card) => !["top-skills", "labor-conditions"].includes(card.id)),
    ].sort((a, b) => {
      if (a.id === "top-sectors") return 1;
      if (b.id === "top-sectors") return -1;
      return a.priority - b.priority;
    });

    return (
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          {regularCards.map((card, index) => (
            <div key={card.id} className={card.id === "top-occupations" ? "lg:col-span-2" : ""}>
              <MetricCardView
                isDark={isDark}
                card={card}
                iconIndex={index}
                variant="medium"
                showEyebrow={false}
              />
            </div>
          ))}
        </div>
        {wideCard ? (
          <MetricCardView
            isDark={isDark}
            card={wideCard}
            iconIndex={regularCards.length}
            variant="wide"
            showEyebrow={false}
          />
        ) : null}
        {conditionsCard ? (
          <MetricCardView
            isDark={isDark}
            card={conditionsCard}
            iconIndex={regularCards.length + 1}
            variant="wide"
            showEyebrow={false}
          />
        ) : null}
      </div>
    );
  }

  if (section === "salarios") {
    const primaryCards = cards.filter((card) =>
      ["average-salary", "real-salary-vs-inflation"].includes(card.id),
    );
    const secondaryCards = cards.filter(
      (card) => !["average-salary", "real-salary-vs-inflation"].includes(card.id),
    );

    return (
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          {primaryCards.map((card, index) => (
            <MetricCardView
              key={card.id}
              isDark={isDark}
              card={card}
              iconIndex={index}
              variant="hero"
            />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {secondaryCards.map((card, index) => (
            <MetricCardView
              key={card.id}
              isDark={isDark}
              card={card}
              iconIndex={index + 3}
              variant="medium"
            />
          ))}
        </div>
      </div>
    );
  }

  if (section === "oportunidades") {
    return (
      <div className="space-y-5">
        {cards.map((card, index) => (
          <MetricCardView
            key={card.id}
            isDark={isDark}
            card={card}
            iconIndex={index}
            variant="wide"
          />
        ))}
      </div>
    );
  }

  if (section === "perfil") {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        {cards.map((card, index) => (
          <div key={card.id} className={card.id === "top-tools" ? "lg:col-span-2" : ""}>
            <MetricCardView
              isDark={isDark}
              card={card}
              iconIndex={index}
              variant={card.id === "top-tools" ? "wide" : "medium"}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {cards.map((card, index) => (
        <MetricCardView
          key={card.id}
          isDark={isDark}
          card={card}
          iconIndex={index}
          variant="medium"
        />
      ))}
    </div>
  );
}
