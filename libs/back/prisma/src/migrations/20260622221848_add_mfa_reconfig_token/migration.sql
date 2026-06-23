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
CREATE TABLE "MfaReconfigToken" (
    "id" VARCHAR(30) NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "tokenExpires" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "userId" VARCHAR(30) NOT NULL,

    CONSTRAINT "MfaReconfigToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MfaReconfigToken_token_key" ON "MfaReconfigToken"("token");

-- CreateIndex
CREATE INDEX "_MfaReconfigTokenUserIdIdx" ON "MfaReconfigToken"("userId");

-- AddForeignKey
ALTER TABLE "TotpRecoveryCode" ADD CONSTRAINT "TotpRecoveryCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MfaReconfigToken" ADD CONSTRAINT "MfaReconfigToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
