/*
  Warnings:

  - The primary key for the `RegistryImportSiret` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `siret` on the `RegistryImportSiret` table. All the data in the column will be lost.
  - You are about to drop the column `destinationFullDestinationAddress` on the `RegistrySsd` table. All the data in the column will be lost.
  - You are about to drop the column `qualificationCode` on the `RegistrySsd` table. All the data in the column will be lost.
  - Added the required column `reportedFor` to the `RegistryImportSiret` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `RegistrySsd` table without a default value. This is not possible if the table is not empty.
  - Added the required column `operationMode` to the `RegistrySsd` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RegistryImportSiret" DROP CONSTRAINT "RegistryImportSiret_pkey",
DROP COLUMN "siret",
ADD COLUMN     "reportedAs" TEXT,
ADD COLUMN     "reportedFor" TEXT NOT NULL,
ADD CONSTRAINT "RegistryImportSiret_pkey" PRIMARY KEY ("importId", "reportedFor");

-- AlterTable
ALTER TABLE "RegistrySsd" DROP COLUMN "destinationFullDestinationAddress",
DROP COLUMN "qualificationCode",
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "operationMode" "OperationMode" NOT NULL;

-- AddForeignKey
ALTER TABLE "RegistrySsd" ADD CONSTRAINT "RegistrySsd_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
