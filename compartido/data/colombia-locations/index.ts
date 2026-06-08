export { colombiaDepartments } from "./departments";
export { colombiaMunicipalities } from "./municipalities";
export { vacancyCategoriesEs } from "./vacancy-categories-es";
export { vacancyCategoriesEn } from "./vacancy-categories-en";

import { vacancyCategoriesEs } from "./vacancy-categories-es";
import { vacancyCategoriesEn } from "./vacancy-categories-en";

export const vacancyCategoriesByLocale = {
  es: vacancyCategoriesEs,
  en: vacancyCategoriesEn,
} as const;

export const vacancyCategories = vacancyCategoriesEs;
