-- AlterTable
ALTER TABLE "User" ADD COLUMN     "trackingConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trackingConsentUntil" TIMESTAMP(3);
