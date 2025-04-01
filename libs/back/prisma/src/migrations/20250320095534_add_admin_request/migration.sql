-- CreateEnum
CREATE TYPE "AdminRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED', 'BLOCKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AdminRequestValidationMethod" AS ENUM ('REQUEST_ADMIN_APPROVAL', 'REQUEST_COLLABORATOR_APPROVAL', 'SEND_MAIL');

-- CreateTable
CREATE TABLE "AdminRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "companyId" VARCHAR(30) NOT NULL,
    "collaboratorId" VARCHAR(30),
    "code" VARCHAR(8),
    "codeAttempts" INTEGER NOT NULL DEFAULT 0,
    "adminOnlyEndDate" TIMESTAMP(3),
    "status" "AdminRequestStatus" NOT NULL DEFAULT 'PENDING',
    "validationMethod" "AdminRequestValidationMethod" NOT NULL,

    CONSTRAINT "AdminRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_AdminRequestUserIdCompanyIdIdx" ON "AdminRequest"("userId", "companyId");

-- CreateIndex
CREATE INDEX "_AdminRequestStatusIdx" ON "AdminRequest"("status");

-- AddForeignKey
ALTER TABLE "AdminRequest" ADD CONSTRAINT "AdminRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminRequest" ADD CONSTRAINT "AdminRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
