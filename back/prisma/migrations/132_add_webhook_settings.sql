-- CreateTable
CREATE TABLE "default$default"."WebhookSetting" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,
    "endpointUri" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "activated" BOOLEAN DEFAULT FALSE,

    CONSTRAINT "WebhookSetting_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WebhookSetting_unique_together" UNIQUE ("orgId", "endpointUri")
);

-- Add Foreign Key
ALTER TABLE "default$default"."WebhookSetting" ADD FOREIGN KEY("companyId") REFERENCES "default$default"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add Index
CREATE INDEX IF NOT EXISTS "_WebhookSettingOrgIdIdx" ON "default$default"."WebhookSetting"("orgId");
