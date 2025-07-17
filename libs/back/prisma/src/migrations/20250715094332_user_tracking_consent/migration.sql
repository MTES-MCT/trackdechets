-- AlterTable
ALTER TABLE "User" ADD COLUMN     "trackingConsent" BOOLEAN DEFAULT false,
ADD COLUMN     "trackingConsentUntil" TIMESTAMP(3);
