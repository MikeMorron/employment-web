export type ToggleItem = {
  id: string;
  labelEs: string;
  labelEn: string;
  defaultOn?: boolean;
  descriptionEs?: string;
  descriptionEn?: string;
};

export type ActionItem = {
  id: string;
  labelEs: string;
  labelEn: string;
  kind: "action";
  value?: string;
  descriptionEs?: string;
  descriptionEn?: string;
  actionLabelEs?: string;
  actionLabelEn?: string;
  detailsEs?: string[];
  detailsEn?: string[];
};

export type SliderItem = {
  id: string;
  labelEs: string;
  labelEn: string;
  kind: "slider";
  min: number;
  max: number;
  value: number;
  suffix?: string;
  descriptionEs?: string;
  descriptionEn?: string;
};

export type ChoiceOption = {
  id: string;
  labelEs: string;
  labelEn: string;
  descriptionEs?: string;
  descriptionEn?: string;
};

export type ChoiceItem = {
  id: string;
  labelEs: string;
  labelEn: string;
  kind: "choice";
  valueEs: string;
  valueEn: string;
  descriptionEs?: string;
  descriptionEn?: string;
  actionLabelEs?: string;
  actionLabelEn?: string;
  detailsEs?: string[];
  detailsEn?: string[];
  options?: ChoiceOption[];
};

export type SettingItem = (ToggleItem & { kind?: "toggle" }) | ActionItem | SliderItem | ChoiceItem;

export type Section = {
  id: string;
  sidebarEs: string;
  sidebarEn: string;
  titleEs: string;
  titleEn: string;
  copyEs: string;
  copyEn: string;
  blocks: Array<{
    titleEs: string;
    titleEn: string;
    items: SettingItem[];
  }>;
};

export type ResolvedItem = {
  id: string;
  label: string;
  kind?: "toggle" | "action" | "slider" | "choice";
  valueLabel?: string;
  description?: string;
  actionLabel?: string;
  details?: string[];
  options?: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  min?: number;
  max?: number;
  suffix?: string;
};

export type ResolvedBlock = {
  title: string;
  items: ResolvedItem[];
};

export type ResolvedSection = {
  id: string;
  sidebar: string;
  title: string;
  copy: string;
  blocks: ResolvedBlock[];
};
