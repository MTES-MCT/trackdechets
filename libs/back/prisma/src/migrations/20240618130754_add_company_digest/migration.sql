-- CreateEnum
CREATE TYPE "CompanyDigestStatus" AS ENUM ('INITIAL', 'PENDING', 'PROCESSED', 'ERROR');

-- CreateTable
CREATE TABLE "CompanyDigest" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "distantId" TEXT,
    "state" "CompanyDigestStatus" NOT NULL DEFAULT 'INITIAL',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "userId" VARCHAR(30),

    CONSTRAINT "CompanyDigest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_CompanyDigestOrgIdIdx" ON "CompanyDigest"("orgId");

-- CreateIndex
CREATE INDEX "_CompanyDigestYearIdx" ON "CompanyDigest"("year");

-- CreateIndex
CREATE INDEX "_CompanyDigestStatedIdx" ON "CompanyDigest"("state");

-- AddForeignKey
ALTER TABLE "CompanyDigest" ADD CONSTRAINT "CompanyDigest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
