"use client";

import type { ComponentType } from "react";
import type { SpecializedCardProps } from "@/components/sections/market-panorama/cards-specialized-shared";
import { OccupationListCard, SkillsInsightCard } from "@/components/sections/market-panorama/cards-specialized-lists";
import { CompanyTimelineCard, LaborConditionsCard, SectorTimelineCard } from "@/components/sections/market-panorama/cards-specialized-market";
import {
  DemandVsSalaryCard,
  EducationDemandCard,
  MarketTrend2026Card,
  RealSalaryVsInflationCard,
  SalaryByExperienceCard,
  SalaryBySectorCard,
  ToolsByAreaCard,
} from "@/components/sections/market-panorama/cards-specialized-insights";

export const SPECIALIZED_CARD_COMPONENTS = {
  "top-occupations": OccupationListCard,
  "top-skills": SkillsInsightCard,
  "top-sectors": SectorTimelineCard,
  "top-companies": CompanyTimelineCard,
  "labor-conditions": LaborConditionsCard,
  "education-demand": EducationDemandCard,
  "salary-by-sector": SalaryBySectorCard,
  "salary-by-seniority": SalaryByExperienceCard,
  "real-salary-vs-inflation": RealSalaryVsInflationCard,
  "top-tools": ToolsByAreaCard,
  "demand-vs-salary": DemandVsSalaryCard,
  "market-trend-2026": MarketTrend2026Card,
} satisfies Record<string, ComponentType<SpecializedCardProps>>;
