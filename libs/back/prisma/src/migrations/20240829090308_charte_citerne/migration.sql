-- CreateEnum
CREATE TYPE "CiterneNotWashedOutReason" AS ENUM ('EXEMPTED', 'INCOMPATIBLE', 'UNAVAILABLE', 'NOT_BY_DRIVER');

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "citerneNotWashedOutReason" "CiterneNotWashedOutReason",
ADD COLUMN     "hasCiterneBeenWashedOut" BOOLEAN;
