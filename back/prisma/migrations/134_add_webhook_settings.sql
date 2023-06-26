-- CreateTable
CREATE TABLE "default$default"."WebhookSetting" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endpointUri" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "orgId" TEXT UNIQUE,
    "activated" BOOLEAN DEFAULT FALSE,

    CONSTRAINT "WebhookSetting_pkey" PRIMARY KEY ("id")
);

-- Add Index
CREATE INDEX IF NOT EXISTS "_WebhookSettingOrgIdIdx" ON "default$default"."WebhookSetting"("orgId");
