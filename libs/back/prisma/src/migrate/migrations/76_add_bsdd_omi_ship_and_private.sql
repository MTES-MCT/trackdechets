-- AlterTable
ALTER TABLE
  "default$default"."Form"
ADD
  COLUMN "emitterIsForeignShip"  BOOLEAN NOT NULL DEFAULT false,
ADD
  COLUMN "emitterIsPrivateIndividual"  BOOLEAN NOT NULL DEFAULT false,
ADD
  COLUMN "emitterCompanyOmiNumber" TEXT;
