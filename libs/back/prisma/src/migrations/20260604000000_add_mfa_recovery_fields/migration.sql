-- AlterTable: add recovery lockout fields and mustReconfigureMfa flag on User
ALTER TABLE "User"
  ADD COLUMN "recoveryFails" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "recoveryLockedUntil" TIMESTAMPTZ(6),
  ADD COLUMN "mustReconfigureMfa" BOOLEAN NOT NULL DEFAULT false;
