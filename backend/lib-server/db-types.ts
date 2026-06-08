/* eslint-disable @typescript-eslint/no-explicit-any */
export type AnyDbRow = Record<string, any>;

export type DbUser = {
  id: string;
  email: string;
  displayName: string;
  role: "candidate" | "company" | "admin";
  plan: string;
  createdAt: Date;
  updatedAt: Date;
  profile?: DbProfile | null;
  jobs?: DbJob[];
} & AnyDbRow;

export type DbProfile = {
  userId: string;
  nombre: string;
  rol: string;
  currentPeriodEnd: Date | null;
  user?: DbUser | null;
} & AnyDbRow;

export type DbCredential = {
  userId: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  user?: DbUser | null;
} & AnyDbRow;
export type DbSession = {
  token: string;
  sessionId: string | null;
  userId: string;
  expiresAt: Date;
  csrfSalt: string | null;
  signingSalt: string | null;
  signingKeyExpiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: DbUser | null;
} & AnyDbRow;
export type DbSessionNonce = {
  id: string;
  sessionId: string;
  nonceHash: string;
  expiresAt: Date;
  createdAt: Date;
} & AnyDbRow;
export type DbWebhookDelivery = { id: string; provider: string; deliveryId: string; payloadHash: string; receivedAt: Date; processedAt: Date | null } & AnyDbRow;
export type DbPrivateMediaAsset = { id: string; publicId: string; ownerUserId: string; mediaType: string; visibility: string; permissionsJson: string | null; storageKey: string; mimeType: string; createdAt: Date; updatedAt: Date; owner: AnyDbRow | null } & AnyDbRow;
export type DbCertificationAsset = { id: string; publicId: string; ownerUserId: string; mediaKind: string; visibility: string; permissionsJson: string | null; storageKey: string; thumbnailStorageKey: string | null; mimeType: string; createdAt: Date; updatedAt: Date; owner: AnyDbRow | null } & AnyDbRow;
export type DbJob = { id: string; ownerCompanyId: string; companyName: string; title: string; location: string; modality: string; salary: string | null; description: string; tagsJson: string | null; status: string; featured: boolean; createdAt: Date; updatedAt: Date } & AnyDbRow;
export type DbMarketplaceVacancy = { id: string; vacancyJson: string; createdAt: Date; updatedAt: Date } & AnyDbRow;
export type DbApplication = { id: string; candidateId: string; candidateName: string; jobId: string; title: string; companyName: string; location: string; modality: string; salary: string | null; status: string; appliedAt: Date; lastUpdatedAt: Date; fitLabel: string } & AnyDbRow;
export type DbNotification = { id: string; userId: string; type: string; title: string; message: string; createdAt: Date; read: boolean; applicationId: string | null; jobId: string | null; status: string } & AnyDbRow;
export type DbSavedVacancy = { userId: string; jobId: string } & AnyDbRow;
export type DbPreference = { userId: string; notificationAnuncio: boolean; notificationApplication: boolean; notificationEmailEnabled: boolean; notificationPushEnabled: boolean; notificationEmailFrequency: string | null; notificationEmailTypesJson: string | null; theme: string | null; language: string | null; readNotificationIdsJson: string | null; hiddenNotificationIdsJson: string | null; companyFavoriteCandidateIdsJson: string | null; companyApplicantNotesJson: string | null; companyDashboardConfigJson: string | null; billingHistoryJson: string | null } & AnyDbRow;
export type DbCandidateSkill = AnyDbRow;
export type DbCandidateExperience = AnyDbRow;
export type DbNotificationEmailType = { userId: string; emailType: string; createdAt: Date } & AnyDbRow;
export type DbUserReadNotification = { userId: string; notificationId: string; createdAt: Date } & AnyDbRow;
export type DbUserHiddenNotification = { userId: string; notificationId: string; createdAt: Date } & AnyDbRow;
export type DbCompanyFavoriteCandidate = { companyUserId: string; candidateId: string; createdAt: Date } & AnyDbRow;
export type DbCompanyApplicantNote = { id: string; companyUserId: string; applicantId: string; note: string; createdAt: Date; updatedAt: Date } & AnyDbRow;
export type DbCompanyDashboardPreference = { id: string; companyUserId: string; key: string; valueJson: string; createdAt: Date; updatedAt: Date } & AnyDbRow;
export type DbBillingHistoryEntry = { id: string; userId: string; plan: string; amountCop: number; status: string; paidAt: Date; renewalAt: Date | null; description: string; provider: string | null; providerReference: string | null; createdAt: Date } & AnyDbRow;
export type DbPurchaseHistory = { id: string; userId: string; role: string; kind: string; planId: string; amountCop: number; applicationCredits: number | null; boostUnitsJson: string | null; metadataJson: string | null; startedAt: Date; endsAt: Date | null; createdAt: Date } & AnyDbRow;
export type DbComment = { id: string; userId: string; entityType: string; entityId: string; authorName: string; body: string; stars: number | null; createdAt: Date; updatedAt: Date } & AnyDbRow;
export type DbCategoryInterest = { id: number; userId: string; category: string; clicks: number } & AnyDbRow;
export type DbActivationMilestone = { id: string; userId: string; key: string; status: string; score: number; detailsJson: string | null; completedAt: Date | null; updatedAt: Date } & AnyDbRow;
export type DbMatchingFeedback = { id: string; companyId: string | null; candidateId: string | null; jobId: string; stage: string; outcome: string; scoreDelta: number; contextJson: string | null; createdAt: Date } & AnyDbRow;
export type DbMatchingCalibration = { id: string; companyId: string; key: string; weight: number; minWeight: number; maxWeight: number; sampleCount: number; acceptedCount: number; rejectedCount: number; lastDelta: number; updatedAt: Date } & AnyDbRow;
export type DbMatchingCalibrationHistory = { id: string; companyId: string | null; key: string; previousWeight: number; nextWeight: number; delta: number; sampleCount: number; acceptedCount: number; rejectedCount: number; reason: string | null; createdAt: Date } & AnyDbRow;
export type DbBillingCheckoutSession = { id: string; companyUserId: string | null; plan: string; method: string; provider: string; status: string; providerSessionId: string; checkoutUrl: string | null; customerId: string | null; subscriptionId: string | null; periodEnd: Date | null; confirmedAt: Date | null; rawPayloadJson: string | null; createdAt: Date; updatedAt: Date } & AnyDbRow;
export type DbVerificationRequest = { id: string; userId: string | null; role: string; status: string; notes: string | null; evidenceJson: string | null; submittedAt: Date; reviewedAt: Date | null } & AnyDbRow;
export type DbRetentionTask = { id: string; userId: string | null; role: string; kind: string; channel: string; status: string; dedupeKey: string | null; payloadJson: string | null; scheduledAt: Date; sentAt: Date | null; providerMessageId: string | null; retries: number; lastError: string | null; createdAt: Date } & AnyDbRow;
export type DbEvent = { id: string; userId: string | null; type: string; entityId: string; metadataJson: string | null; sessionId: string | null; source: string | null; surface: string | null; pathname: string | null; referrer: string | null; deviceType: string | null; actorRole: string | null; dedupeKey: string | null; contextJson: string | null; timeOnPageMs: number | null; happenedAt: Date; createdAt: Date } & AnyDbRow;

export type DbUserCreateInput = AnyDbRow;
export type DbProfileCreateInput = AnyDbRow;
export type DbProfileUpdateInput = AnyDbRow;

export interface DbTaskLike<T> extends PromiseLike<T> {
  run(queryable?: any): Promise<T>;
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T | TResult>;
  finally(onfinally?: (() => void) | null): Promise<T>;
}

export type DbDelegate<Row> = {
  findMany(args?: AnyDbRow): DbTaskLike<Row[]>;
  findFirst(args?: AnyDbRow): DbTaskLike<Row | null>;
  findUnique(args: AnyDbRow): DbTaskLike<Row | null>;
  count(args?: AnyDbRow): DbTaskLike<number>;
  create(args: AnyDbRow): DbTaskLike<Row>;
  createMany(args: AnyDbRow): DbTaskLike<{ count: number }>;
  update(args: AnyDbRow): DbTaskLike<Row>;
  updateMany(args: AnyDbRow): DbTaskLike<{ count: number }>;
  delete(args: AnyDbRow): DbTaskLike<Row>;
  deleteMany(args?: AnyDbRow): DbTaskLike<{ count: number }>;
  upsert(args: AnyDbRow): DbTaskLike<Row>;
};

export type DbClient = {
  user: DbDelegate<DbUser>;
  profile: DbDelegate<DbProfile>;
  credential: DbDelegate<DbCredential>;
  session: DbDelegate<DbSession>;
  sessionNonce: DbDelegate<DbSessionNonce>;
  webhookDelivery: DbDelegate<DbWebhookDelivery>;
  privateMediaAsset: DbDelegate<DbPrivateMediaAsset>;
  certificationAsset: DbDelegate<DbCertificationAsset>;
  job: DbDelegate<DbJob>;
  marketplaceVacancy: DbDelegate<DbMarketplaceVacancy>;
  application: DbDelegate<DbApplication>;
  notification: DbDelegate<DbNotification>;
  savedVacancy: DbDelegate<DbSavedVacancy>;
  preference: DbDelegate<DbPreference>;
  candidateSkill: DbDelegate<DbCandidateSkill>;
  candidateExperience: DbDelegate<DbCandidateExperience>;
  notificationEmailType: DbDelegate<DbNotificationEmailType>;
  userReadNotification: DbDelegate<DbUserReadNotification>;
  userHiddenNotification: DbDelegate<DbUserHiddenNotification>;
  companyFavoriteCandidate: DbDelegate<DbCompanyFavoriteCandidate>;
  companyApplicantNote: DbDelegate<DbCompanyApplicantNote>;
  companyDashboardPreference: DbDelegate<DbCompanyDashboardPreference>;
  billingHistoryEntry: DbDelegate<DbBillingHistoryEntry>;
  purchaseHistory: DbDelegate<DbPurchaseHistory>;
  comment: DbDelegate<DbComment>;
  categoryInterest: DbDelegate<DbCategoryInterest>;
  activationMilestone: DbDelegate<DbActivationMilestone>;
  matchingFeedback: DbDelegate<DbMatchingFeedback>;
  matchingCalibration: DbDelegate<DbMatchingCalibration>;
  matchingCalibrationHistory: DbDelegate<DbMatchingCalibrationHistory>;
  billingCheckoutSession: DbDelegate<DbBillingCheckoutSession>;
  verificationRequest: DbDelegate<DbVerificationRequest>;
  retentionTask: DbDelegate<DbRetentionTask> & {
    groupBy(args: AnyDbRow): DbTaskLike<AnyDbRow[]>;
  };
  event: DbDelegate<DbEvent>;
  $transaction<T extends any[]>(arg: { [K in keyof T]: DbTaskLike<T[K]> }): DbTaskLike<T>;
  $transaction<T>(arg: (tx: DbClient) => Promise<T>): DbTaskLike<T>;
  $disconnect(): Promise<void>;
};
