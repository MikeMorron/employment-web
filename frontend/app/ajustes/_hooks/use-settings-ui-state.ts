"use client";

import { startTransition, useEffect, useState } from "react";
import {
  buildInitialChoiceState,
  buildInitialSliderState,
  buildInitialToggleState,
  type Section,
} from "@/compartido/app/ajustes/_lib/settings-sections";

export function useSettingsUiState(activeSections: Section[]) {
  const [activeSection, setActiveSection] = useState(activeSections[0]?.id ?? "security");
  const [toggleState, setToggleState] = useState<Record<string, boolean>>(
    buildInitialToggleState(activeSections),
  );
  const [sliderState, setSliderState] = useState<Record<string, number>>(
    buildInitialSliderState(activeSections),
  );
  const [choiceState, setChoiceState] = useState<Record<string, string>>(
    buildInitialChoiceState(activeSections),
  );
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    startTransition(() => {
      setActiveSection(activeSections[0]?.id ?? "security");
      setToggleState(buildInitialToggleState(activeSections));
      setSliderState(buildInitialSliderState(activeSections));
      setChoiceState(buildInitialChoiceState(activeSections));
      setExpandedItems({});
    });
  }, [activeSections]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    activeSections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (!element) {
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(section.id);
          }
        },
        { rootMargin: "-30% 0px -55% 0px", threshold: 0.1 },
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [activeSections]);

  return {
    activeSection,
    choiceState,
    expandedItems,
    setChoiceState,
    setExpandedItems,
    setSliderState,
    setToggleState,
    sliderState,
    toggleState,
  };
}
