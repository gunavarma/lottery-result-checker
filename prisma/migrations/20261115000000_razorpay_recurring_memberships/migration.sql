CREATE TABLE "RazorpayMembership" (
    "id" TEXT NOT NULL,
    "phoneHash" TEXT NOT NULL,
    "phoneEncrypted" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "razorpaySubscriptionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "latestPaymentId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "consentedAt" TIMESTAMP(3) NOT NULL,
    "lastWebhookAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RazorpayMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RazorpayMembership_razorpaySubscriptionId_key" ON "RazorpayMembership"("razorpaySubscriptionId");
CREATE INDEX "RazorpayMembership_phoneHash_status_idx" ON "RazorpayMembership"("phoneHash", "status");
CREATE INDEX "RazorpayMembership_status_currentPeriodEnd_idx" ON "RazorpayMembership"("status", "currentPeriodEnd");

CREATE TABLE "RazorpayWebhookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RazorpayWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RazorpayWebhookEvent_eventId_key" ON "RazorpayWebhookEvent"("eventId");
CREATE INDEX "RazorpayWebhookEvent_eventType_createdAt_idx" ON "RazorpayWebhookEvent"("eventType", "createdAt");
