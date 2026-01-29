/*
  Warnings:

  - A unique constraint covering the columns `[s3FileKey]` on the table `RegistryTexsAnalysisFile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RegistryTexsAnalysisFile.s3FileKey._UNIQUE" ON "RegistryTexsAnalysisFile"("s3FileKey");
