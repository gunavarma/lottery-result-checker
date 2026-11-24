ALTER TABLE "RazorpayMembership"
    ADD COLUMN "watchlistUserId" TEXT,
    ADD COLUMN "whatsappOptedOutAt" TIMESTAMP(3);

CREATE TABLE "WhatsappResultDelivery" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "providerMessageId" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappResultDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsappResultDelivery_drawId_membershipId_key"
    ON "WhatsappResultDelivery"("drawId", "membershipId");
CREATE INDEX "WhatsappResultDelivery_status_nextAttemptAt_idx"
    ON "WhatsappResultDelivery"("status", "nextAttemptAt");
CREATE INDEX "WhatsappResultDelivery_membershipId_status_idx"
    ON "WhatsappResultDelivery"("membershipId", "status");

ALTER TABLE "WhatsappResultDelivery"
    ADD CONSTRAINT "WhatsappResultDelivery_drawId_fkey"
    FOREIGN KEY ("drawId") REFERENCES "Draw"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WhatsappResultDelivery"
    ADD CONSTRAINT "WhatsappResultDelivery_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "RazorpayMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
