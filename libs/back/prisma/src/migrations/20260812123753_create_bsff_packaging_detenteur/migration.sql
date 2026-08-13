-- DropForeignKey
ALTER TABLE "default$default"."TotpRecoveryCode" DROP CONSTRAINT "TotpRecoveryCode_userId_fkey";

-- DropIndex
DROP INDEX "default$default"."TotpRecoveryCode_userId_idx";

-- AlterTable
ALTER TABLE "TotpRecoveryCode" ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "usedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "recoveryLockedUntil" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "BsffPackagingDetenteur" (
    "id" TEXT NOT NULL,
    "bsffPackagingId" TEXT NOT NULL,
    "detenteurCompanySiret" TEXT,
    "detenteurCompanyName" TEXT NOT NULL,
    "detenteurCompanyAddress" TEXT NOT NULL,
    "detenteurCompanyContact" TEXT,
    "detenteurCompanyPhone" TEXT,
    "detenteurCompanyMail" TEXT,
    "detenteurIsPrivateIndividual" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BsffPackagingDetenteur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_BsffPackagingDetenteurCompanySiretIdx" ON "BsffPackagingDetenteur"("detenteurCompanySiret");

-- CreateIndex
CREATE INDEX "_BsffPackagingDetenteurPackagingIdIdx" ON "BsffPackagingDetenteur"("bsffPackagingId");

-- CreateIndex
CREATE UNIQUE INDEX "_BsffPackagingDetenteurUnique" ON "BsffPackagingDetenteur"("bsffPackagingId", "detenteurCompanySiret");

-- AddForeignKey
ALTER TABLE "TotpRecoveryCode" ADD CONSTRAINT "TotpRecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsffPackagingDetenteur" ADD CONSTRAINT "BsffPackagingDetenteur_bsffPackagingId_fkey" FOREIGN KEY ("bsffPackagingId") REFERENCES "BsffPackaging"("id") ON DELETE CASCADE ON UPDATE CASCADE;
