-- CreateEnum
CREATE TYPE "RegistryImportStatus" AS ENUM ('PENDING', 'STARTED', 'SUCCESSFUL', 'PARTIALLY_SUCCESSFUL', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "RegistryImportType" AS ENUM ('SSD');

-- CreateTable
CREATE TABLE "RegistryImport" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "status" "RegistryImportStatus" NOT NULL DEFAULT 'PENDING',
    "type" "RegistryImportType" NOT NULL,
    "s3FileKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "numberOfErrors" INTEGER NOT NULL DEFAULT 0,
    "numberOfInsertions" INTEGER NOT NULL DEFAULT 0,
    "numberOfEdits" INTEGER NOT NULL DEFAULT 0,
    "numberOfCancellations" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "RegistryImport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistryImportAssociation" (
    "importId" TEXT NOT NULL,
    "reportedFor" TEXT NOT NULL,
    "reportedAs" TEXT NOT NULL,

    CONSTRAINT "RegistryImportAssociation_pkey" PRIMARY KEY ("importId","reportedFor","reportedAs")
);

-- CreateTable
CREATE TABLE "RegistrySsd" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "reportForSiret" TEXT NOT NULL,
    "reportForName" TEXT NOT NULL,
    "reportForAddress" TEXT NOT NULL,
    "reportForCity" TEXT NOT NULL,
    "reportForPostalCode" TEXT NOT NULL,
    "reportAsSiret" TEXT,
    "weightValue" DOUBLE PRECISION NOT NULL,
    "weightIsEstimate" BOOLEAN NOT NULL,
    "volume" DOUBLE PRECISION,
    "wasteCode" TEXT NOT NULL,
    "wasteCodeBale" TEXT,
    "wasteDescription" TEXT NOT NULL,
    "secondaryWasteCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "secondaryWasteDescriptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dispatchDate" TIMESTAMPTZ(6),
    "useDate" TIMESTAMPTZ(6),
    "processingDate" TIMESTAMPTZ(6) NOT NULL,
    "processingEndDate" TIMESTAMPTZ(6),
    "operationCode" TEXT NOT NULL,
    "operationMode" "OperationMode" NOT NULL,
    "product" TEXT NOT NULL,
    "administrativeActReference" TEXT NOT NULL,
    "destinationType" TEXT NOT NULL,
    "destinationOrgId" TEXT,
    "destinationName" TEXT,
    "destinationAddress" TEXT,
    "destinationCity" TEXT,
    "destinationPostalCode" TEXT,
    "destinationCountryCode" TEXT,

    CONSTRAINT "RegistrySsd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_RegistryImportCreatedByIdIdx" ON "RegistryImport"("createdById");

-- CreateIndex
CREATE INDEX "_RegistrySsdImportIdIdx" ON "RegistrySsd"("importId");

-- CreateIndex
CREATE INDEX "_RegistrySsdPublicIdIdx" ON "RegistrySsd"("publicId");

-- AddForeignKey
ALTER TABLE "RegistryImport" ADD CONSTRAINT "RegistryImport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistryImportAssociation" ADD CONSTRAINT "RegistryImportAssociation_importId_fkey" FOREIGN KEY ("importId") REFERENCES "RegistryImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrySsd" ADD CONSTRAINT "RegistrySsd_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
