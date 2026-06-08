-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('candidate', 'company');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "plan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadataJson" TEXT,
    "sessionId" TEXT,
    "source" TEXT,
    "surface" TEXT,
    "pathname" TEXT,
    "referrer" TEXT,
    "deviceType" TEXT,
    "actorRole" TEXT,
    "dedupeKey" TEXT,
    "contextJson" TEXT,
    "timeOnPageMs" INTEGER,
    "happenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "passwordSalt" TEXT NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Session" (
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "WebhookDelivery" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "tipoRegistro" TEXT,
    "ubicacion" TEXT,
    "telefono" TEXT,
    "website" TEXT,
    "avatar" TEXT,
    "avatarStoredFileName" TEXT,
    "avatarAssetPublicId" TEXT,
    "modalidadTrabajo" TEXT,
    "expectativaSalarial" TEXT,
    "expectativaSalarialMin" TEXT,
    "expectativaSalarialMax" TEXT,
    "jornada" TEXT,
    "resumenPerfil" TEXT,
    "categoriasEnfoqueJson" TEXT,
    "cv" TEXT,
    "cvStoredFileName" TEXT,
    "cvAssetPublicId" TEXT,
    "bio" TEXT,
    "idiomasJson" TEXT,
    "disponibilidadViaje" TEXT,
    "movilidad" TEXT,
    "skillsJson" TEXT,
    "candidateSkillsJson" TEXT,
    "experienciaJson" TEXT,
    "professionalProfileJson" TEXT,
    "educationProfileJson" TEXT,
    "certificationProfileJson" TEXT,
    "workPreferencesJson" TEXT,
    "locationProfileJson" TEXT,
    "profileQualityJson" TEXT,
    "profileVisibility" TEXT,
    "companyName" TEXT,
    "industry" TEXT,
    "companySize" TEXT,
    "companyDescription" TEXT,
    "companyCulture" TEXT,
    "companyMission" TEXT,
    "companyVision" TEXT,
    "companyContactEmail" TEXT,
    "companyWebsite" TEXT,
    "companyLocation" TEXT,
    "companyBenefitsJson" TEXT,
    "companySocialLinksJson" TEXT,
    "companyBanner" TEXT,
    "activeJobs" INTEGER,
    "verificationStatus" TEXT,
    "analyticsSummaryJson" TEXT,
    "planStatus" TEXT,
    "billingProvider" TEXT,
    "billingCustomerId" TEXT,
    "billingSubscriptionId" TEXT,
    "billingCheckoutSessionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "hiringFocusJson" TEXT,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "PrivateMediaAsset" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "permissionsJson" TEXT,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateMediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificationAsset" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "mediaKind" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "permissionsJson" TEXT,
    "storageKey" TEXT NOT NULL,
    "thumbnailStorageKey" TEXT,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificationAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "ownerCompanyId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "salary" TEXT,
    "description" TEXT NOT NULL,
    "tagsJson" TEXT,
    "status" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceVacancy" (
    "id" TEXT NOT NULL,
    "vacancyJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceVacancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "modality" TEXT NOT NULL,
    "salary" TEXT,
    "status" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "fitLabel" TEXT NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "applicationId" TEXT,
    "jobId" TEXT,
    "status" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedVacancy" (
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,

    CONSTRAINT "SavedVacancy_pkey" PRIMARY KEY ("userId","jobId")
);

-- CreateTable
CREATE TABLE "Preference" (
    "userId" TEXT NOT NULL,
    "notificationAnuncio" BOOLEAN NOT NULL DEFAULT true,
    "notificationApplication" BOOLEAN NOT NULL DEFAULT true,
    "notificationEmailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationPushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notificationEmailFrequency" TEXT,
    "notificationEmailTypesJson" TEXT,
    "theme" TEXT,
    "language" TEXT,
    "readNotificationIdsJson" TEXT,
    "hiddenNotificationIdsJson" TEXT,
    "companyFavoriteCandidateIdsJson" TEXT,
    "companyApplicantNotesJson" TEXT,
    "companyDashboardConfigJson" TEXT,
    "billingHistoryJson" TEXT,

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "CandidateSkill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "canonicalSkill" TEXT,
    "skillCategory" TEXT,
    "skillLevel" TEXT,
    "yearsExperience" INTEGER,
    "experienceMonths" INTEGER,
    "lastUsedAt" TIMESTAMP(3),
    "isCoreSkill" BOOLEAN NOT NULL DEFAULT false,
    "evidenceSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateExperience" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "empresaNit" TEXT,
    "tiempo" TEXT NOT NULL,
    "startDate" TEXT,
    "endDate" TEXT,
    "current" BOOLEAN,
    "durationMonths" INTEGER,
    "opinion" TEXT,
    "description" TEXT,
    "canonicalRole" TEXT,
    "roleFamily" TEXT,
    "companyIndustry" TEXT,
    "employmentType" TEXT,
    "location" TEXT,
    "workMode" TEXT,
    "achievements" TEXT,
    "skillsUsed" TEXT[],
    "domainTags" TEXT[],
    "functionalTags" TEXT[],
    "teamScope" TEXT,
    "peopleLedCount" INTEGER,
    "productsWorkedOn" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationEmailType" (
    "userId" TEXT NOT NULL,
    "emailType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationEmailType_pkey" PRIMARY KEY ("userId","emailType")
);

-- CreateTable
CREATE TABLE "UserReadNotification" (
    "userId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReadNotification_pkey" PRIMARY KEY ("userId","notificationId")
);

-- CreateTable
CREATE TABLE "UserHiddenNotification" (
    "userId" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserHiddenNotification_pkey" PRIMARY KEY ("userId","notificationId")
);

-- CreateTable
CREATE TABLE "CompanyFavoriteCandidate" (
    "companyUserId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyFavoriteCandidate_pkey" PRIMARY KEY ("companyUserId","candidateId")
);

-- CreateTable
CREATE TABLE "CompanyApplicantNote" (
    "id" TEXT NOT NULL,
    "companyUserId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyApplicantNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyDashboardPreference" (
    "id" TEXT NOT NULL,
    "companyUserId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyDashboardPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingHistoryEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amountCop" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "renewalAt" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "provider" TEXT,
    "providerReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingHistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "stars" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryInterest" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CategoryInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivationMilestone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "detailsJson" TEXT,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivationMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchingFeedback" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "candidateId" TEXT,
    "jobId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "scoreDelta" INTEGER NOT NULL DEFAULT 0,
    "contextJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchingFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchingCalibration" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "minWeight" INTEGER NOT NULL,
    "maxWeight" INTEGER NOT NULL,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "lastDelta" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchingCalibration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchingCalibrationHistory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "key" TEXT NOT NULL,
    "previousWeight" INTEGER NOT NULL,
    "nextWeight" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "sampleCount" INTEGER NOT NULL,
    "acceptedCount" INTEGER NOT NULL,
    "rejectedCount" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchingCalibrationHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingCheckoutSession" (
    "id" TEXT NOT NULL,
    "companyUserId" TEXT,
    "plan" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerSessionId" TEXT NOT NULL,
    "checkoutUrl" TEXT,
    "customerId" TEXT,
    "subscriptionId" TEXT,
    "periodEnd" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "rawPayloadJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingCheckoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "evidenceJson" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "VerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetentionTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dedupeKey" TEXT,
    "payloadJson" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "providerMessageId" TEXT,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetentionTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Event_userId_idx" ON "Event"("userId");

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- CreateIndex
CREATE INDEX "Event_entityId_idx" ON "Event"("entityId");

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");

-- CreateIndex
CREATE INDEX "Event_userId_type_happenedAt_idx" ON "Event"("userId", "type", "happenedAt");

-- CreateIndex
CREATE INDEX "Event_entityId_type_happenedAt_idx" ON "Event"("entityId", "type", "happenedAt");

-- CreateIndex
CREATE INDEX "Event_dedupeKey_idx" ON "Event"("dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_email_key" ON "Credential"("email");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "WebhookDelivery_provider_receivedAt_idx" ON "WebhookDelivery"("provider", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookDelivery_provider_deliveryId_key" ON "WebhookDelivery"("provider", "deliveryId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateMediaAsset_publicId_key" ON "PrivateMediaAsset"("publicId");

-- CreateIndex
CREATE INDEX "PrivateMediaAsset_ownerUserId_idx" ON "PrivateMediaAsset"("ownerUserId");

-- CreateIndex
CREATE INDEX "PrivateMediaAsset_mediaType_idx" ON "PrivateMediaAsset"("mediaType");

-- CreateIndex
CREATE INDEX "PrivateMediaAsset_publicId_ownerUserId_idx" ON "PrivateMediaAsset"("publicId", "ownerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CertificationAsset_publicId_key" ON "CertificationAsset"("publicId");

-- CreateIndex
CREATE INDEX "CertificationAsset_ownerUserId_idx" ON "CertificationAsset"("ownerUserId");

-- CreateIndex
CREATE INDEX "CertificationAsset_publicId_ownerUserId_idx" ON "CertificationAsset"("publicId", "ownerUserId");

-- CreateIndex
CREATE INDEX "Job_ownerCompanyId_idx" ON "Job"("ownerCompanyId");

-- CreateIndex
CREATE INDEX "Application_candidateId_idx" ON "Application"("candidateId");

-- CreateIndex
CREATE INDEX "Application_jobId_idx" ON "Application"("jobId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_applicationId_idx" ON "Notification"("applicationId");

-- CreateIndex
CREATE INDEX "CandidateSkill_userId_updatedAt_idx" ON "CandidateSkill"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "CandidateExperience_userId_sortOrder_idx" ON "CandidateExperience"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "UserReadNotification_userId_createdAt_idx" ON "UserReadNotification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserHiddenNotification_userId_createdAt_idx" ON "UserHiddenNotification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CompanyFavoriteCandidate_candidateId_createdAt_idx" ON "CompanyFavoriteCandidate"("candidateId", "createdAt");

-- CreateIndex
CREATE INDEX "CompanyApplicantNote_companyUserId_updatedAt_idx" ON "CompanyApplicantNote"("companyUserId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyApplicantNote_companyUserId_applicantId_key" ON "CompanyApplicantNote"("companyUserId", "applicantId");

-- CreateIndex
CREATE INDEX "CompanyDashboardPreference_companyUserId_updatedAt_idx" ON "CompanyDashboardPreference"("companyUserId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyDashboardPreference_companyUserId_key_key" ON "CompanyDashboardPreference"("companyUserId", "key");

-- CreateIndex
CREATE INDEX "BillingHistoryEntry_userId_paidAt_idx" ON "BillingHistoryEntry"("userId", "paidAt");

-- CreateIndex
CREATE INDEX "BillingHistoryEntry_userId_status_createdAt_idx" ON "BillingHistoryEntry"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_entityType_entityId_createdAt_idx" ON "Comment"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "CategoryInterest_userId_idx" ON "CategoryInterest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryInterest_userId_category_key" ON "CategoryInterest"("userId", "category");

-- CreateIndex
CREATE INDEX "ActivationMilestone_userId_status_idx" ON "ActivationMilestone"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ActivationMilestone_userId_key_key" ON "ActivationMilestone"("userId", "key");

-- CreateIndex
CREATE INDEX "MatchingFeedback_companyId_createdAt_idx" ON "MatchingFeedback"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "MatchingFeedback_candidateId_createdAt_idx" ON "MatchingFeedback"("candidateId", "createdAt");

-- CreateIndex
CREATE INDEX "MatchingFeedback_jobId_createdAt_idx" ON "MatchingFeedback"("jobId", "createdAt");

-- CreateIndex
CREATE INDEX "MatchingCalibration_companyId_updatedAt_idx" ON "MatchingCalibration"("companyId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MatchingCalibration_companyId_key_key" ON "MatchingCalibration"("companyId", "key");

-- CreateIndex
CREATE INDEX "MatchingCalibrationHistory_companyId_createdAt_idx" ON "MatchingCalibrationHistory"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "MatchingCalibrationHistory_companyId_key_createdAt_idx" ON "MatchingCalibrationHistory"("companyId", "key", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BillingCheckoutSession_providerSessionId_key" ON "BillingCheckoutSession"("providerSessionId");

-- CreateIndex
CREATE INDEX "BillingCheckoutSession_companyUserId_status_createdAt_idx" ON "BillingCheckoutSession"("companyUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "VerificationRequest_userId_status_idx" ON "VerificationRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "RetentionTask_userId_status_scheduledAt_idx" ON "RetentionTask"("userId", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "RetentionTask_kind_status_scheduledAt_idx" ON "RetentionTask"("kind", "status", "scheduledAt");

-- CreateIndex
CREATE INDEX "RetentionTask_channel_status_scheduledAt_idx" ON "RetentionTask"("channel", "status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "RetentionTask_userId_dedupeKey_key" ON "RetentionTask"("userId", "dedupeKey");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateMediaAsset" ADD CONSTRAINT "PrivateMediaAsset_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationAsset" ADD CONSTRAINT "CertificationAsset_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_ownerCompanyId_fkey" FOREIGN KEY ("ownerCompanyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedVacancy" ADD CONSTRAINT "SavedVacancy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preference" ADD CONSTRAINT "Preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateSkill" ADD CONSTRAINT "CandidateSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateExperience" ADD CONSTRAINT "CandidateExperience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationEmailType" ADD CONSTRAINT "NotificationEmailType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReadNotification" ADD CONSTRAINT "UserReadNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHiddenNotification" ADD CONSTRAINT "UserHiddenNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyFavoriteCandidate" ADD CONSTRAINT "CompanyFavoriteCandidate_companyUserId_fkey" FOREIGN KEY ("companyUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyFavoriteCandidate" ADD CONSTRAINT "CompanyFavoriteCandidate_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyApplicantNote" ADD CONSTRAINT "CompanyApplicantNote_companyUserId_fkey" FOREIGN KEY ("companyUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyDashboardPreference" ADD CONSTRAINT "CompanyDashboardPreference_companyUserId_fkey" FOREIGN KEY ("companyUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingHistoryEntry" ADD CONSTRAINT "BillingHistoryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryInterest" ADD CONSTRAINT "CategoryInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivationMilestone" ADD CONSTRAINT "ActivationMilestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchingFeedback" ADD CONSTRAINT "MatchingFeedback_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchingFeedback" ADD CONSTRAINT "MatchingFeedback_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchingCalibration" ADD CONSTRAINT "MatchingCalibration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchingCalibrationHistory" ADD CONSTRAINT "MatchingCalibrationHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingCheckoutSession" ADD CONSTRAINT "BillingCheckoutSession_companyUserId_fkey" FOREIGN KEY ("companyUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRequest" ADD CONSTRAINT "VerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionTask" ADD CONSTRAINT "RetentionTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
