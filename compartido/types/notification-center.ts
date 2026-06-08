export type NotificationCenterItemType =
  | "anuncio"
  | "trending"
  | "application"
  | "companyOffer";

export type NotificationCenterItem = {
  id: string;
  type: NotificationCenterItemType;
  title: string;
  text: string;
  accent: string;
  meta: string;
  applicationId?: string;
  jobId?: string;
  inviteId?: string;
  linkHref?: string;
  actionLabel?: string;
};

export type NotificationCenterBaseItem = Omit<NotificationCenterItem, "type"> & {
  type: "anuncio" | "trending";
};

export type NotificationCenterPreferences = {
  anuncio: boolean;
  application: boolean;
};

export type NotificationCenterGroups = {
  anuncio: NotificationCenterItem[];
  application: NotificationCenterItem[];
  companyOffer: NotificationCenterItem[];
  trending: NotificationCenterItem[];
};
