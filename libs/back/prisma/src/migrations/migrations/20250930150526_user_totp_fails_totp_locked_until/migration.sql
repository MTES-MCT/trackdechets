-- AlterTable
ALTER TABLE "default$default"."User" ADD COLUMN     "totpFails" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totpLockedUntil" TIMESTAMP(3);
