-- Note: some manual adjustements had to be made. The auto generated statements had a few incompatibilities.

-- ➤ Adjust your database schema (these changes break Prisma 1)
-- Run the following SQL statements against your database:

-- Fix columns with ENUM data types
-- https://pris.ly/d/schema-incompatibilities#enums-are-represented-as-text-in-database

CREATE TYPE "default$default"."WasteAcceptationStatus" AS ENUM ('ACCEPTED', 'REFUSED', 'PARTIALLY_REFUSED');
ALTER TABLE "default$default"."Form" ALTER COLUMN "wasteAcceptationStatus" SET DATA TYPE "default$default"."WasteAcceptationStatus" using "wasteAcceptationStatus"::"default$default"."WasteAcceptationStatus";
CREATE TYPE "default$default"."EmitterType" AS ENUM ('PRODUCER', 'OTHER', 'APPENDIX1', 'APPENDIX2');
ALTER TABLE "default$default"."Form" ALTER COLUMN "emitterType" SET DATA TYPE "default$default"."EmitterType" using "emitterType"::"default$default"."EmitterType";
CREATE TYPE "default$default"."QuantityType" AS ENUM ('REAL', 'ESTIMATED');
ALTER TABLE "default$default"."Form" ALTER COLUMN "wasteDetailsQuantityType" SET DATA TYPE "default$default"."QuantityType" using "wasteDetailsQuantityType"::"default$default"."QuantityType";
CREATE TYPE "default$default"."Consistence" AS ENUM ('SOLID', 'LIQUID', 'GASEOUS', 'DOUGHY');
ALTER TABLE "default$default"."Form" ALTER COLUMN "wasteDetailsConsistence" SET DATA TYPE "default$default"."Consistence" using "wasteDetailsConsistence"::"default$default"."Consistence";
ALTER TABLE "default$default"."TemporaryStorageDetail" ALTER COLUMN "tempStorerQuantityType" SET DATA TYPE "default$default"."QuantityType" using "tempStorerQuantityType"::"default$default"."QuantityType";
ALTER TABLE "default$default"."TemporaryStorageDetail" ALTER COLUMN "tempStorerWasteAcceptationStatus" SET DATA TYPE "default$default"."WasteAcceptationStatus" using "tempStorerWasteAcceptationStatus"::"default$default"."WasteAcceptationStatus";
ALTER TABLE "default$default"."TemporaryStorageDetail" ALTER COLUMN "wasteDetailsQuantityType" SET DATA TYPE "default$default"."QuantityType" using "wasteDetailsQuantityType"::"default$default"."QuantityType";
CREATE TYPE "default$default"."Status" AS ENUM ('DRAFT', 'SEALED', 'SENT', 'RECEIVED', 'ACCEPTED', 'PROCESSED', 'AWAITING_GROUP', 'GROUPED', 'NO_TRACEABILITY', 'REFUSED', 'TEMP_STORED', 'TEMP_STORER_ACCEPTED', 'RESEALED', 'RESENT');
ALTER TABLE "default$default"."StatusLog" ALTER COLUMN "status" SET DATA TYPE "default$default"."Status" using "status"::"default$default"."Status";
CREATE TYPE "default$default"."TransportMode" AS ENUM ('ROAD', 'RAIL', 'AIR', 'RIVER', 'SEA');
ALTER TABLE "default$default"."TransportSegment" ALTER COLUMN "mode" SET DATA TYPE "default$default"."TransportMode" using "mode"::"default$default"."TransportMode";
CREATE TYPE "default$default"."UserRole" AS ENUM ('MEMBER', 'ADMIN');
ALTER TABLE "default$default"."UserAccountHash" ALTER COLUMN "role" SET DATA TYPE "default$default"."UserRole" using "role"::"default$default"."UserRole";
CREATE TYPE "default$default"."MembershipRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED');
ALTER TABLE "default$default"."MembershipRequest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "default$default"."MembershipRequest" ALTER COLUMN "status" SET DATA TYPE "default$default"."MembershipRequestStatus" using "status"::"default$default"."MembershipRequestStatus";
ALTER TABLE "default$default"."MembershipRequest" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"default$default"."MembershipRequestStatus";
ALTER TABLE "default$default"."CompanyAssociation" ALTER COLUMN "role" SET DATA TYPE "default$default"."UserRole" using "role"::"default$default"."UserRole";
CREATE TYPE "default$default"."Seveso" AS ENUM ('NS', 'SB', 'SH');
ALTER TABLE "default$default"."Installation" ALTER COLUMN "seveso" SET DATA TYPE "default$default"."Seveso" using "seveso"::"default$default"."Seveso";
CREATE TYPE "default$default"."WasteType" AS ENUM ('INERTE', 'NOT_DANGEROUS', 'DANGEROUS');
ALTER TABLE "default$default"."Rubrique" ALTER COLUMN "wasteType" SET DATA TYPE "default$default"."WasteType" using "wasteType"::"default$default"."WasteType";
CREATE TYPE "default$default"."GerepType" AS ENUM ('Producteur', 'Traiteur');
ALTER TABLE "default$default"."Declaration" ALTER COLUMN "gerepType" SET DATA TYPE "default$default"."GerepType" using "gerepType"::"default$default"."GerepType";


-- Fix columns with JSON data types
-- https://pris.ly/d/schema-incompatibilities#json-type-is-represented-as-text-in-database

ALTER TABLE "default$default"."Form" ALTER COLUMN "wasteDetailsPackagings" SET DATA TYPE JSONB USING "wasteDetailsPackagings"::TEXT::JSONB;
ALTER TABLE "default$default"."TemporaryStorageDetail" ALTER COLUMN "wasteDetailsPackagings" SET DATA TYPE JSONB USING "wasteDetailsPackagings"::TEXT::JSONB;
ALTER TABLE "default$default"."StatusLog" ALTER COLUMN "updatedFields" SET DATA TYPE JSONB USING "updatedFields"::TEXT::JSONB;


-- Fix simple scalar lists

ALTER TABLE "default$default"."MembershipRequest" ADD COLUMN "sentTo" text[];
UPDATE "default$default"."MembershipRequest" u
    SET "sentTo" = t."value"::text[]
FROM (
    SELECT "nodeId", array_agg(value ORDER BY position) as value
    FROM "default$default"."MembershipRequest_sentTo"
    GROUP BY "nodeId"
) t
WHERE t."nodeId" = u."id";
DROP TABLE "default$default"."MembershipRequest_sentTo";

ALTER TABLE "default$default"."Application" ADD COLUMN "redirectUris" text[];
UPDATE "default$default"."Application" u
    SET "redirectUris" = t."value"::text[]
FROM (
    SELECT "nodeId", array_agg(value ORDER BY position) as value
    FROM "default$default"."Application_redirectUris"
    GROUP BY "nodeId"
) t
WHERE t."nodeId" = u."id";
DROP TABLE "default$default"."Application_redirectUris";

ALTER TABLE "default$default"."Company" ADD COLUMN "documentKeys" text[];
UPDATE "default$default"."Company" u
    SET "documentKeys" = t."value"::text[]
FROM (
    SELECT "nodeId", array_agg(value ORDER BY position) as value
    FROM "default$default"."Company_documentKeys"
    GROUP BY "nodeId"
) t
WHERE t."nodeId" = u."id";
DROP TABLE "default$default"."Company_documentKeys";

ALTER TABLE "default$default"."Company" ADD COLUMN "ecoOrganismeAgreements" text[];
UPDATE "default$default"."Company" u
    SET "ecoOrganismeAgreements" = t."value"::text[]
FROM (
    SELECT "nodeId", array_agg(value ORDER BY position) as value
    FROM "default$default"."Company_ecoOrganismeAgreements"
    GROUP BY "nodeId"
) t
WHERE t."nodeId" = u."id";
DROP TABLE "default$default"."Company_ecoOrganismeAgreements";


-- Fix enum lists

CREATE TYPE "default$default"."CompanyType" AS ENUM ('PRODUCER', 'COLLECTOR', 'WASTEPROCESSOR', 'TRANSPORTER', 'WASTE_VEHICLES', 'WASTE_CENTER', 'TRADER', 'ECO_ORGANISME');
ALTER TABLE "default$default"."Company" ADD COLUMN "companyTypes" "default$default"."CompanyType"[];
UPDATE "default$default"."Company" u
    SET "companyTypes" = t."value"::"default$default"."CompanyType"[]
FROM (
    SELECT "nodeId", array_agg(value ORDER BY position) as value
    FROM "default$default"."Company_companyTypes"
    GROUP BY "nodeId"
) t
WHERE t."nodeId" = u."id";
DROP TABLE "default$default"."Company_companyTypes";