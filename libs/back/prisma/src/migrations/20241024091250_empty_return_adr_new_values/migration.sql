/*
  Warnings:

  - The values [EMPTY_NOT_WASHED] on the enum `EmptyReturnADR` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EmptyReturnADR_new" AS ENUM ('EMPTY_RETURN_NOT_WASHED', 'EMPTY_VEHICLE', 'EMPTY_CITERNE', 'EMPTY_CONTAINER', 'EMPTY_CITERNE_CONTAINER');
ALTER TABLE "Form" ALTER COLUMN "emptyReturnADR" TYPE "EmptyReturnADR_new" USING ("emptyReturnADR"::text::"EmptyReturnADR_new");
ALTER TYPE "EmptyReturnADR" RENAME TO "EmptyReturnADR_old";
ALTER TYPE "EmptyReturnADR_new" RENAME TO "EmptyReturnADR";
DROP TYPE "EmptyReturnADR_old";
COMMIT;
