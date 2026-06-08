import officialData from "@/data/market/official.json";
import secondaryData from "@/data/market/secondary.json";
import { buildMarketCards } from "@/lib/market/transformers/cards";

export const marketDashboardData = buildMarketCards(
  officialData,
  secondaryData,
);

export function getMarketPanoramaData() {
  return marketDashboardData;
}
