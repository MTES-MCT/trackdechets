-- Create Enum
CREATE TYPE "default$default"."OrgRegistry" AS ENUM (
  'SIRENE',
  'TVAINTRACOMM',
  'RNA',
  'FULLNAME',
  'FOREIGNID',
  'OMI',
  'RNC',
  'PNTTD');

-- Create new column
ALTER TABLE "default$default"."Company" ADD "orgId" TEXT NOT NULL UNIQUE;
ALTER TABLE "default$default"."Company" ADD "orgIdRegistry" "default$default"."OrgRegistry";


--- Create index
CREATE INDEX IF NOT EXISTS "_CompanyOrgIdIdx" ON "default$default"."Company"("orgId");

-- Create Table
CREATE TABLE "default$default"."OrganisationRegistry" (
    "id" TEXT NOT NULL,
    "orgRegistry" "default$default"."OrgRegistry" NOT NULL;
    "label"       TEXT
    "description" TEXT

    PRIMARY KEY ("id")
);

--- Create index
CREATE INDEX IF NOT EXISTS "_OrganisationRegistryOrgRegistryIdx" ON "default$default"."OrganisationRegistry"("orgRegistry");
