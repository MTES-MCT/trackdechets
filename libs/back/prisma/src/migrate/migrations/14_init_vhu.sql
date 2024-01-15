-- Most of the code has been generated with Prisma
-- Through a dry run: npx prisma migrate dev --create-only --preview-feature
-- A few edits have benn done: added schema, some TEXT to VARCHAR(X)

-- CreateEnum
CREATE TYPE "default$default"."BsvhuStatus" AS ENUM ('INITIAL', 'SIGNED_BY_PRODUCER', 'SENT', 'PROCESSED', 'REFUSED');

-- CreateEnum
CREATE TYPE "default$default"."BsvhuPackaging" AS ENUM ('UNITE', 'LOT');

-- CreateEnum
CREATE TYPE "default$default"."BsvhuIdentificationType" AS ENUM ('NUMERO_ORDRE_REGISTRE_POLICE', 'NUMERO_ORDRE_LOTS_SORTANTS');

-- CreateEnum
CREATE TYPE "default$default"."BsvhuRecipientType" AS ENUM ('BROYEUR', 'DEMOLISSEUR');

-- CreateTable
CREATE TABLE "default$default"."VhuForm" (
    "id" VARCHAR(40) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "status" "default$default"."BsvhuStatus" NOT NULL DEFAULT E'INITIAL',
    "readableId" VARCHAR(40) UNIQUE NOT NULL,
    "emitterAgrementNumber" VARCHAR(100),
    "emitterCompanyName" VARCHAR(100),
    "emitterCompanySiret" VARCHAR(17),
    "emitterCompanyAddress" TEXT,
    "emitterCompanyContact" VARCHAR(50),
    "emitterCompanyPhone" VARCHAR(15),
    "emitterCompanyMail" VARCHAR(50),
    "recipientType" "default$default"."BsvhuRecipientType",
    "recipientOperationPlanned" VARCHAR(50) DEFAULT E'R 4',
    "recipientAgrementNumber" VARCHAR(100),
    "recipientCompanyName" VARCHAR(100),
    "recipientCompanySiret" VARCHAR(17),
    "recipientCompanyAddress" TEXT,
    "recipientCompanyContact" VARCHAR(50),
    "recipientCompanyPhone" VARCHAR(15),
    "recipientCompanyMail" VARCHAR(50),
    "wasteCode" VARCHAR(10) DEFAULT E'16 01 06',
    "packaging" "default$default"."BsvhuPackaging",
    "identificationNumbers" TEXT[],
    "identificationType" "default$default"."BsvhuIdentificationType",
    "quantityNumber" INTEGER,
    "quantityTons" FLOAT,
    "emitterSignatureAuthor" VARCHAR(50),
    "emitterSignatureDate" TIMESTAMP(3),
    "transporterCompanyName" VARCHAR(100),
    "transporterCompanySiret" VARCHAR(17),
    "transporterCompanyAddress" TEXT,
    "transporterCompanyContact" VARCHAR(50),
    "transporterCompanyPhone" VARCHAR(15),
    "transporterCompanyMail" VARCHAR(50),
    "transporterRecepisseNumber" VARCHAR(50),
    "transporterRecepisseDepartment" VARCHAR(50),
    "transporterRecepisseValidityLimit" TIMESTAMP(3),
    "transporterTvaIntracommunautaire" VARCHAR(50),
    "transporterSignatureAuthor" VARCHAR(50),
    "transporterSignatureDate" TIMESTAMP(3),
    "recipientAcceptanceQuantity" DECIMAL(65,30),
    "recipientAcceptanceStatus" "default$default"."WasteAcceptationStatus",
    "recipientAcceptanceRefusalReason" TEXT,
    "recipientAcceptanceIdentificationNumbers" TEXT[],
    "recipientAcceptanceIdentificationType" "default$default"."BsvhuIdentificationType",
    "recipientOperationDone" VARCHAR(50),
    "recipientPlannedBroyeurCompanyName" VARCHAR(100),
    "recipientPlannedBroyeurCompanySiret" VARCHAR(17),
    "recipientPlannedBroyeurCompanyAddress" TEXT,
    "recipientPlannedBroyeurCompanyContact" VARCHAR(50),
    "recipientPlannedBroyeurCompanyPhone" VARCHAR(15),
    "recipientPlannedBroyeurCompanyMail" VARCHAR(50),
    "recipientSignatureAuthor" VARCHAR(50),
    "recipientSignatureDate" TIMESTAMP(3),

    PRIMARY KEY ("id")
);
