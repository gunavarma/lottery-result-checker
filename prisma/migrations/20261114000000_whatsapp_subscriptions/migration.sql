CREATE TABLE "WhatsappSubscription" (
    "id" TEXT NOT NULL,
    "phoneHash" TEXT NOT NULL,
    "phoneEncrypted" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "consentSource" TEXT,
    "consentedAt" TIMESTAMP(3),
    "optedOutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WhatsappSubscription_phoneHash_key" ON "WhatsappSubscription"("phoneHash");
CREATE INDEX "WhatsappSubscription_status_idx" ON "WhatsappSubscription"("status");
