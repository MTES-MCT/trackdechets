-- CreateTable
CREATE TABLE "MfaAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ip" TEXT,
    "loggedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MfaAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MfaAuditLog_userId_idx" ON "MfaAuditLog"("userId");

-- CreateIndex
CREATE INDEX "MfaAuditLog_loggedAt_idx" ON "MfaAuditLog"("loggedAt");

-- CreateIndex
CREATE INDEX "MfaAuditLog_eventType_idx" ON "MfaAuditLog"("eventType");
