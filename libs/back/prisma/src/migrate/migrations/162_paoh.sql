-- ALTER TYPE "default$default"."BsdType" ADD VALUE 'BSPAOH';

CREATE TYPE "default$default"."BspaohStatus" AS ENUM (
    'DRAFT',
    'INITIAL',
    'SIGNED_BY_PRODUCER',
    'SENT',
    'RECEIVED',
    'PROCESSED',
    'REFUSED',
    'CANCELED',
    'PARTIALLY_REFUSED'
);

CREATE TYPE "default$default"."BspaohType" AS ENUM (
    'PAOH',
    'FOETUS'
);

-- Table Definition ----------------------------------------------
CREATE TABLE "default$default"."Bspaoh" (
    "id" text NOT NULL,
    "createdAt" timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamptz  NOT NULL,
    "isDeleted" boolean NOT NULL DEFAULT FALSE,
    "status" "default$default"."BspaohStatus" NOT NULL DEFAULT 'INITIAL' ::"default$default"."BspaohStatus",
    "wasteCode" text,
    "wasteAdr" text,
    "wasteType" "default$default"."BspaohType" NOT NULL DEFAULT 'PAOH' ::"default$default"."BspaohType",
    "wastePackagings" jsonb DEFAULT '[]' ::jsonb,
    "emitterCompanyName" text,
    "emitterCompanySiret" text,
    "emitterCompanyAddress" text,
    "emitterCompanyContact" text,
    "emitterCompanyPhone" text,
    "emitterCompanyMail" text,
    "emitterCustomInfo" text,
    "emitterPickupSiteName" text,
    "emitterPickupSiteAddress" text,
    "emitterPickupSiteCity" text,
    "emitterPickupSitePostalCode" text,
    "emitterPickupSiteInfos" text,
    "emitterWasteQuantityValue" integer,
    "emitterWasteWeightValue" double precision,
    "emitterWasteWeightIsEstimate" boolean,
  
    "emitterEmissionSignatureAuthor" text,
    "emitterEmissionSignatureDate" timestamptz,
    "transporterTransportTakenOverAt" timestamptz,
    "destinationCompanyName" text,
    "destinationCompanySiret" text,
    "destinationCompanyAddress" text,
    "destinationCompanyContact" text,
    "destinationCompanyPhone" text,
    "destinationCompanyMail" text,
    "destinationCustomInfo" text,
    "destinationCap" text,
    "handedOverToDestinationDate" timestamptz,
    "handedOverToDestinationSignatureDate" timestamptz,
    "handedOverToDestinationSignatureAuthor" text,
    "destinationReceptionWasteWeightValue" double precision,
    "destinationReceptionWasteQuantityValue" integer,
    "destinationReceptionWasteWeightIsEstimate" boolean,
    "destinationReceptionAcceptationStatus" "default$default"."WasteAcceptationStatus",
    "destinationReceptionWasteRefusalReason" text,
    "destinationReceptionWastePackagingsAcceptation" jsonb DEFAULT '[]' ::jsonb,
    "destinationReceptionDate" timestamptz,
    "destinationReceptionSignatureDate" timestamptz,
    "destinationReceptionSignatureAuthor" text,
    "destinationOperationCode" text,
    "destinationOperationDate" timestamptz,
    "destinationOperationSignatureDate" timestamptz,
    "destinationOperationSignatureAuthor" text,
    "currentTransporterOrgId" text,
    "nextTransporterOrgId" text,
    "transportersSirets" text[] DEFAULT ARRAY[] ::text[],
    "canAccessDraftSirets" text[] DEFAULT ARRAY[] ::text[],
    PRIMARY KEY ("id")
);

-- Indices -------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "Bspaoh_pkey" ON "default$default"."Bspaoh" ("id");

CREATE INDEX IF NOT EXISTS "_BspaohNextTransporterOrgIdIdx" ON "default$default"."Bspaoh" ("nextTransporterOrgId");

CREATE INDEX IF NOT EXISTS "BspaohEmitterCompanySiretIdx" ON "default$default"."Bspaoh" ("emitterCompanySiret");

CREATE INDEX IF NOT EXISTS "BspaohDestinationCompanySiretIdx" ON "default$default"."Bspaoh" ("destinationCompanySiret");

CREATE INDEX IF NOT EXISTS "BspaohStatusIdx" ON "default$default"."Bspaoh" ("status");

CREATE INDEX IF NOT EXISTS "BspaohCreatedAtIdx" ON "default$default"."Bspaoh" ("createdAt");

CREATE INDEX IF NOT EXISTS "BspaohCurrentTransporterOrgIdIdx" ON "default$default"."Bspaoh" ("currentTransporterOrgId");

-- Table Definition ----------------------------------------------
CREATE TABLE "default$default"."BspaohTransporter" (
    "id" text NOT NULL,
    "createdAt" timestamptz  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamptz  NOT NULL,
    "number" integer NOT NULL,
    "transporterCompanyName" text,
    "transporterCompanySiret" text,
    "transporterCompanyVatNumber" text,
    "transporterCompanyAddress" text,
    "transporterCompanyContact" text,
    "transporterCompanyPhone" text,
    "transporterCompanyMail" text,
    "transporterTransportMode" "default$default"."TransportMode",
    "transporterCustomInfo" text,
    "bspaohId" text REFERENCES "default$default"."Bspaoh" (id) ON DELETE CASCADE ON UPDATE CASCADE,
    "transporterRecepisseDepartment" text,
    "transporterRecepisseIsExempted" boolean,
    "transporterRecepisseNumber" text,
    "transporterRecepisseValidityLimit" timestamptz,
    "transporterTakenOverAt" timestamptz,
    "transporterTransportPlates" text[],
    "transporterTransportSignatureAuthor" text,
    "transporterTransportSignatureDate" timestamptz,
    PRIMARY KEY ("id")
);

-- Indices -------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "BspaohTransporter_pkey" ON "default$default"."BspaohTransporter" ("id");

CREATE INDEX IF NOT EXISTS "_BpaohTransporterBsdIdIdx" ON "default$default"."BspaohTransporter" ("bspaohId");

CREATE INDEX IF NOT EXISTS "_BspaohTransporterCompanySiretIdx" ON "default$default"."BspaohTransporter" ("transporterCompanySiret");

CREATE INDEX IF NOT EXISTS "_BspaohTransporterCompanyVatNumberIdx" ON "default$default"."BspaohTransporter" ("transporterCompanyVatNumber");

