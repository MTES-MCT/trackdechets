-- CreateEnum
CREATE TYPE "RegistrySource" AS ENUM ('FILE', 'API');

-- CreateTable
CREATE TABLE "RegistryChangeAggregate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "type" "RegistryImportType" NOT NULL,
    "source" "RegistrySource" NOT NULL,
    "createdById" TEXT NOT NULL,
    "reportForId" TEXT NOT NULL,
    "reportAsId" TEXT,
    "numberOfAggregates" INTEGER NOT NULL DEFAULT 1,
    "numberOfErrors" INTEGER NOT NULL DEFAULT 0,
    "numberOfInsertions" INTEGER NOT NULL DEFAULT 0,
    "numberOfEdits" INTEGER NOT NULL DEFAULT 0,
    "numberOfCancellations" INTEGER NOT NULL DEFAULT 0,
    "numberOfSkipped" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RegistryChangeAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_RRegistryChangeAggregateReportForIdIdx" ON "RegistryChangeAggregate"("reportForId");

-- CreateIndex
CREATE INDEX "_RRegistryChangeAggregateUpdatedAtIdx" ON "RegistryChangeAggregate"("updatedAt");

-- AddForeignKey
ALTER TABLE "RegistryChangeAggregate" ADD CONSTRAINT "RegistryChangeAggregate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryChangeAggregate" ADD CONSTRAINT "RegistryChangeAggregate_reportForId_fkey" FOREIGN KEY ("reportForId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryChangeAggregate" ADD CONSTRAINT "RegistryChangeAggregate_reportAsId_fkey" FOREIGN KEY ("reportAsId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
