-- CreateEnum: MfaResetRequestStatus
CREATE TYPE "MfaResetRequestStatus" AS ENUM ('PENDING', 'DONE', 'CANCELLED', 'FAILED');

-- AlterTable: add mfaResetSuspended flag on User
ALTER TABLE "User"
  ADD COLUMN "mfaResetSuspended" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: MfaResetRequest
CREATE TABLE "MfaResetRequest" (
  "id"        VARCHAR(30)               NOT NULL,
  "userId"    VARCHAR(30)               NOT NULL,
  "status"    "MfaResetRequestStatus"   NOT NULL DEFAULT 'PENDING',
  "note"      TEXT,
  "createdAt" TIMESTAMPTZ(6)            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueAt"     TIMESTAMPTZ(6)            NOT NULL,
  "updatedAt" TIMESTAMPTZ(6)            NOT NULL,
  CONSTRAINT "MfaResetRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MfaResetRequest"
  ADD CONSTRAINT "MfaResetRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "_MfaResetRequestUserIdIdx" ON "MfaResetRequest"("userId");
CREATE INDEX "_MfaResetRequestStatusIdx" ON "MfaResetRequest"("status");
CREATE INDEX "_MfaResetRequestDueAtIdx"  ON "MfaResetRequest"("dueAt");
