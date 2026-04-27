-- AlterTable
ALTER TABLE "default$default"."User"
  ADD COLUMN "totpSetupRequired"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "recoveryFails"       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "recoveryLockedUntil" TIMESTAMPTZ(6);
