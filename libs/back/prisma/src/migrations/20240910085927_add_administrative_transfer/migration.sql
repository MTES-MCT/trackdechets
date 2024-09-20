-- CreateEnum
CREATE TYPE "AdministrativeTransferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED');

-- CreateTable
CREATE TABLE "AdministrativeTransfer" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "approvedAt" TIMESTAMPTZ(6),
    "status" "AdministrativeTransferStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "AdministrativeTransfer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AdministrativeTransfer" ADD CONSTRAINT "AdministrativeTransfer_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdministrativeTransfer" ADD CONSTRAINT "AdministrativeTransfer_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
