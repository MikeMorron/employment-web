import type {
  ChoiceItem,
  ResolvedBlock,
  ResolvedItem,
  ResolvedSection,
  Section,
  SliderItem,
  ToggleItem,
} from "@/compartido/app/ajustes/_lib/settings-types";

export type {
  ActionItem,
  ChoiceItem,
  ChoiceOption,
  ResolvedBlock,
  ResolvedItem,
  ResolvedSection,
  Section,
  SettingItem,
  SliderItem,
  ToggleItem,
} from "@/compartido/app/ajustes/_lib/settings-types";

export const UNAVAILABLE_SETTING_ITEM_IDS = new Set([
  "password",
  "2fa",
  "sessions",
  "close-sessions",
  "delete-account",
  "company-password",
  "company-2fa",
  "company-sessions",
]);

export function maskEmail(email: string) {
  const [localPart = "", domainPart = ""] = email.split("@");
  const [domainName = "", domainSuffix = ""] = domainPart.split(".");
  const visibleLocal = localPart.slice(0, 4);
  const visibleDomain = domainName.slice(0, 1);

  return `${visibleLocal}${"*".repeat(Math.max(localPart.length - visibleLocal.length, 2))}@${visibleDomain}${"*".repeat(
    Math.max(domainName.length - visibleDomain.length, 3),
  )}.${domainSuffix || "com"}`;
}

export function buildInitialToggleState(activeSections: Section[]) {
  return Object.fromEntries(
    activeSections.flatMap((section) =>
      section.blocks.flatMap((block) =>
        block.items
          .filter(
            (item): item is ToggleItem & { kind?: "toggle" } =>
              item.kind === undefined || item.kind === "toggle",
          )
          .map((item) => [item.id, item.defaultOn ?? false]),
      ),
    ),
  ) as Record<string, boolean>;
}

export function buildInitialSliderState(activeSections: Section[]) {
  return Object.fromEntries(
    activeSections.flatMap((section) =>
      section.blocks.flatMap((block) =>
        block.items
          .filter((item): item is SliderItem => item.kind === "slider")
          .map((item) => [item.id, item.value]),
      ),
    ),
  ) as Record<string, number>;
}

export function buildInitialChoiceState(activeSections: Section[]) {
  return Object.fromEntries(
    activeSections.flatMap((section) =>
      section.blocks.flatMap((block) =>
        block.items
          .filter((item): item is ChoiceItem => item.kind === "choice")
          .map((item) => [item.id, item.options?.[0]?.id ?? item.valueEn]),
      ),
    ),
  ) as Record<string, string>;
}

export function resolveSections(activeSections: Section[], isEnglish: boolean): ResolvedSection[] {
  return activeSections.map((section) => ({
    id: section.id,
    sidebar: isEnglish ? section.sidebarEn : section.sidebarEs,
    title: isEnglish ? section.titleEn : section.titleEs,
    copy: isEnglish ? section.copyEn : section.copyEs,
    blocks: section.blocks
      .map((block) => ({
        title: isEnglish ? block.titleEn : block.titleEs,
        items: block.items
          .filter((item) => !UNAVAILABLE_SETTING_ITEM_IDS.has(item.id))
          .map((item): ResolvedItem => ({
            id: item.id,
            label: isEnglish ? item.labelEn : item.labelEs,
            kind: item.kind as ResolvedItem["kind"],
            valueLabel:
              item.kind === "choice"
                ? isEnglish ? item.valueEn : item.valueEs
                : item.kind === "slider"
                  ? `${item.value}${item.suffix ?? ""}`
                  : item.kind === "action"
                    ? item.value
                    : undefined,
            description:
              "descriptionEn" in item || "descriptionEs" in item
                ? isEnglish
                  ? item.descriptionEn
                  : item.descriptionEs
                : undefined,
            actionLabel:
              "actionLabelEn" in item || "actionLabelEs" in item
                ? isEnglish
                  ? item.actionLabelEn
                  : item.actionLabelEs
                : undefined,
            details:
              "detailsEn" in item || "detailsEs" in item
                ? isEnglish
                  ? item.detailsEn
                  : item.detailsEs
                : undefined,
            options:
              item.kind === "choice" && item.options
                ? item.options.map((option) => ({
                    id: option.id,
                    label: isEnglish ? option.labelEn : option.labelEs,
                    description: isEnglish ? option.descriptionEn : option.descriptionEs,
                  }))
                : undefined,
            min: item.kind === "slider" ? item.min : undefined,
            max: item.kind === "slider" ? item.max : undefined,
            suffix: item.kind === "slider" ? item.suffix : undefined,
          })),
      }))
      .filter((block) => block.items.length > 0) as ResolvedBlock[],
  }));
}
