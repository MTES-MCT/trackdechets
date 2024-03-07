-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('PRODUCER', 'COLLECTOR', 'WASTEPROCESSOR', 'TRANSPORTER', 'WASTE_VEHICLES', 'WASTE_CENTER', 'TRADER', 'ECO_ORGANISME', 'BROKER', 'WORKER', 'CREMATORIUM');

-- CreateEnum
CREATE TYPE "CompanyVerificationMode" AS ENUM ('MANUAL', 'LETTER', 'AUTO');

-- CreateEnum
CREATE TYPE "CompanyVerificationStatus" AS ENUM ('TO_BE_VERIFIED', 'LETTER_SENT', 'VERIFIED', 'STANDBY');

-- CreateEnum
CREATE TYPE "Seveso" AS ENUM ('NS', 'SB', 'SH');

-- CreateEnum
CREATE TYPE "WasteType" AS ENUM ('INERTE', 'NOT_DANGEROUS', 'DANGEROUS');

-- CreateEnum
CREATE TYPE "GerepType" AS ENUM ('Producteur', 'Traiteur');

-- CreateEnum
CREATE TYPE "WasteAcceptationStatus" AS ENUM ('ACCEPTED', 'REFUSED', 'PARTIALLY_REFUSED');

-- CreateEnum
CREATE TYPE "EmitterType" AS ENUM ('PRODUCER', 'OTHER', 'APPENDIX1', 'APPENDIX2', 'APPENDIX1_PRODUCER');

-- CreateEnum
CREATE TYPE "QuantityType" AS ENUM ('REAL', 'ESTIMATED');

-- CreateEnum
CREATE TYPE "Consistence" AS ENUM ('SOLID', 'LIQUID', 'GASEOUS', 'DOUGHY');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('DRAFT', 'SEALED', 'SENT', 'RECEIVED', 'ACCEPTED', 'PROCESSED', 'AWAITING_GROUP', 'GROUPED', 'NO_TRACEABILITY', 'REFUSED', 'TEMP_STORED', 'TEMP_STORER_ACCEPTED', 'RESEALED', 'RESENT', 'SIGNED_BY_PRODUCER', 'SIGNED_BY_TEMP_STORER', 'FOLLOWED_WITH_PNTTD', 'CANCELED');

-- CreateEnum
CREATE TYPE "TransportMode" AS ENUM ('ROAD', 'RAIL', 'AIR', 'RIVER', 'SEA', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('MEMBER', 'ADMIN', 'DRIVER', 'READER');

-- CreateEnum
CREATE TYPE "MembershipRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED');

-- CreateEnum
CREATE TYPE "AuthType" AS ENUM ('SESSION', 'BEARER', 'JWT');

-- CreateEnum
CREATE TYPE "ApplicationGoal" AS ENUM ('PERSONNAL', 'CLIENTS');

-- CreateEnum
CREATE TYPE "BsdType" AS ENUM ('BSDD', 'BSDA', 'BSDASRI', 'BSFF', 'BSVHU');

-- CreateEnum
CREATE TYPE "OperationMode" AS ENUM ('REUTILISATION', 'RECYCLAGE', 'VALORISATION_ENERGETIQUE', 'ELIMINATION');

-- CreateEnum
CREATE TYPE "GovernmentPermission" AS ENUM ('REGISTRY_CAN_READ_ALL');

-- CreateEnum
CREATE TYPE "RevisionRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED');

-- CreateEnum
CREATE TYPE "RevisionRequestApprovalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REFUSED', 'CANCELED');

-- CreateEnum
CREATE TYPE "BsvhuStatus" AS ENUM ('INITIAL', 'SIGNED_BY_PRODUCER', 'SENT', 'PROCESSED', 'REFUSED');

-- CreateEnum
CREATE TYPE "BsvhuPackaging" AS ENUM ('UNITE', 'LOT');

-- CreateEnum
CREATE TYPE "BsvhuIdentificationType" AS ENUM ('NUMERO_ORDRE_REGISTRE_POLICE', 'NUMERO_ORDRE_LOTS_SORTANTS');

-- CreateEnum
CREATE TYPE "BsvhuDestinationType" AS ENUM ('BROYEUR', 'DEMOLISSEUR');

-- CreateEnum
CREATE TYPE "BsdasriStatus" AS ENUM ('INITIAL', 'SIGNED_BY_PRODUCER', 'SENT', 'RECEIVED', 'REFUSED_BY_RECIPIENT', 'PROCESSED', 'REFUSED', 'AWAITING_GROUP');

-- CreateEnum
CREATE TYPE "BsdasriEmitterType" AS ENUM ('PRODUCER', 'COLLECTOR');

-- CreateEnum
CREATE TYPE "BsdasriType" AS ENUM ('SIMPLE', 'GROUPING', 'SYNTHESIS');

-- CreateEnum
CREATE TYPE "BsffType" AS ENUM ('TRACER_FLUIDE', 'COLLECTE_PETITES_QUANTITES', 'GROUPEMENT', 'RECONDITIONNEMENT', 'REEXPEDITION');

-- CreateEnum
CREATE TYPE "BsffStatus" AS ENUM ('INITIAL', 'SIGNED_BY_EMITTER', 'SENT', 'RECEIVED', 'INTERMEDIATELY_PROCESSED', 'PROCESSED', 'REFUSED', 'ACCEPTED', 'PARTIALLY_REFUSED');

-- CreateEnum
CREATE TYPE "BsffPackagingType" AS ENUM ('BOUTEILLE', 'CONTENEUR', 'CITERNE', 'AUTRE');

-- CreateEnum
CREATE TYPE "BsdaStatus" AS ENUM ('INITIAL', 'SIGNED_BY_PRODUCER', 'SIGNED_BY_WORKER', 'SENT', 'PROCESSED', 'REFUSED', 'AWAITING_CHILD', 'CANCELED');

-- CreateEnum
CREATE TYPE "BsdaType" AS ENUM ('COLLECTION_2710', 'OTHER_COLLECTIONS', 'GATHERING', 'RESHIPMENT');

-- CreateEnum
CREATE TYPE "BsdaConsistence" AS ENUM ('SOLIDE', 'PULVERULENT', 'OTHER');

-- CreateEnum
CREATE TYPE "BspaohStatus" AS ENUM ('DRAFT', 'INITIAL', 'SIGNED_BY_PRODUCER', 'SENT', 'RECEIVED', 'PROCESSED', 'REFUSED', 'CANCELED', 'PARTIALLY_REFUSED');

-- CreateEnum
CREATE TYPE "BspaohType" AS ENUM ('PAOH', 'FOETUS');

-- CreateEnum
CREATE TYPE "BsvhuRecipientType" AS ENUM ('BROYEUR', 'DEMOLISSEUR');

-- CreateTable
CREATE TABLE "AccessToken" (
    "id" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "token" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "lastUsed" TIMESTAMPTZ(6),
    "applicationId" VARCHAR(30),
    "description" TEXT,
    "userId" VARCHAR(30) NOT NULL,

    CONSTRAINT "AccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "redirectUris" TEXT[],
    "adminId" TEXT,
    "goal" "ApplicationGoal",
    "openIdEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" VARCHAR(30) NOT NULL,
    "orgId" TEXT NOT NULL,
    "siret" TEXT,
    "vatNumber" TEXT,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "gerepId" TEXT,
    "codeNaf" TEXT,
    "securityCode" INTEGER NOT NULL,
    "givenName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "ecoOrganismeAgreements" TEXT[],
    "companyTypes" "CompanyType"[],
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "verificationCode" TEXT NOT NULL,
    "verificationStatus" "CompanyVerificationStatus" NOT NULL DEFAULT 'TO_BE_VERIFIED',
    "verificationMode" "CompanyVerificationMode",
    "verificationComment" TEXT,
    "verifiedAt" TIMESTAMPTZ(6),
    "contact" TEXT,
    "codeDepartement" TEXT,
    "workerCertificationId" VARCHAR(40),
    "traderReceiptId" VARCHAR(30),
    "brokerReceiptId" VARCHAR(30),
    "transporterReceiptId" VARCHAR(30),
    "vhuAgrementDemolisseurId" VARCHAR(40),
    "vhuAgrementBroyeurId" VARCHAR(40),
    "allowBsdasriTakeOverWithoutSignature" BOOLEAN DEFAULT false,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousCompany" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "siret" TEXT,
    "vatNumber" TEXT,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "codeNaf" TEXT NOT NULL,
    "libelleNaf" TEXT NOT NULL,
    "codeCommune" TEXT NOT NULL,

    CONSTRAINT "AnonymousCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousCompanyRequest" (
    "id" TEXT NOT NULL,
    "siret" TEXT NOT NULL,
    "pdf" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "codeNaf" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "codeCommune" TEXT,

    CONSTRAINT "AnonymousCompanyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyAssociation" (
    "id" VARCHAR(30) NOT NULL,
    "role" "UserRole" NOT NULL,
    "companyId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "automaticallyAccepted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CompanyAssociation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignatureAutomation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,

    CONSTRAINT "SignatureAutomation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Declaration" (
    "id" VARCHAR(30) NOT NULL,
    "codeS3ic" TEXT,
    "nomEts" TEXT,
    "annee" TEXT,
    "codeDechet" TEXT,
    "libDechet" TEXT,
    "gerepType" "GerepType",

    CONSTRAINT "Declaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EcoOrganisme" (
    "id" VARCHAR(30) NOT NULL,
    "siret" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "handleBsdasri" BOOLEAN NOT NULL DEFAULT false,
    "handleBsda" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EcoOrganisme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalOperation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "finalBsdReadableId" TEXT NOT NULL,
    "operationCode" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "destinationCompanySiret" TEXT NOT NULL,
    "destinationCompanyName" TEXT NOT NULL,
    "formId" TEXT,

    CONSTRAINT "FinalOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Form" (
    "id" VARCHAR(30) NOT NULL,
    "rowNumber" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "readableId" TEXT NOT NULL,
    "customId" TEXT,
    "isDeleted" BOOLEAN DEFAULT false,
    "status" "Status" NOT NULL DEFAULT 'DRAFT',
    "emitterType" "EmitterType",
    "emitterPickupSite" TEXT,
    "emitterCompanyName" TEXT,
    "emitterCompanySiret" TEXT,
    "emitterCompanyAddress" TEXT,
    "emitterCompanyContact" TEXT,
    "emitterCompanyPhone" TEXT,
    "emitterCompanyMail" TEXT,
    "emitterWorkSiteName" TEXT,
    "emitterWorkSiteAddress" TEXT,
    "emitterWorkSiteCity" TEXT,
    "emitterWorkSitePostalCode" TEXT,
    "emitterWorkSiteInfos" TEXT,
    "emitterIsPrivateIndividual" BOOLEAN NOT NULL DEFAULT false,
    "emitterIsForeignShip" BOOLEAN NOT NULL DEFAULT false,
    "emitterCompanyOmiNumber" TEXT,
    "recipientCap" TEXT,
    "recipientProcessingOperation" TEXT,
    "recipientCompanyName" TEXT,
    "recipientCompanySiret" TEXT,
    "recipientCompanyAddress" TEXT,
    "recipientCompanyContact" TEXT,
    "recipientCompanyPhone" TEXT,
    "recipientCompanyMail" TEXT,
    "recipientIsTempStorage" BOOLEAN DEFAULT false,
    "wasteDetailsCode" TEXT,
    "wasteDetailsName" TEXT,
    "wasteDetailsOnuCode" TEXT,
    "wasteDetailsQuantity" DECIMAL(65,30),
    "wasteDetailsQuantityType" "QuantityType",
    "wasteDetailsConsistence" "Consistence",
    "wasteDetailsPackagingInfos" JSONB NOT NULL,
    "wasteDetailsPop" BOOLEAN NOT NULL DEFAULT false,
    "wasteDetailsSampleNumber" TEXT,
    "wasteDetailsIsDangerous" BOOLEAN NOT NULL DEFAULT false,
    "wasteDetailsParcelNumbers" JSONB DEFAULT '[]',
    "wasteDetailsAnalysisReferences" TEXT[],
    "wasteDetailsLandIdentifiers" TEXT[],
    "traderCompanyName" TEXT,
    "traderCompanySiret" TEXT,
    "traderCompanyAddress" TEXT,
    "traderCompanyContact" TEXT,
    "traderCompanyPhone" TEXT,
    "traderCompanyMail" TEXT,
    "traderReceipt" TEXT,
    "traderDepartment" TEXT,
    "traderValidityLimit" TIMESTAMPTZ(6),
    "ecoOrganismeName" TEXT,
    "ecoOrganismeSiret" TEXT,
    "brokerCompanyName" TEXT,
    "brokerCompanySiret" TEXT,
    "brokerCompanyAddress" TEXT,
    "brokerCompanyContact" TEXT,
    "brokerCompanyPhone" TEXT,
    "brokerCompanyMail" TEXT,
    "brokerReceipt" TEXT,
    "brokerDepartment" TEXT,
    "brokerValidityLimit" TIMESTAMPTZ(6),
    "nextDestinationProcessingOperation" TEXT,
    "nextDestinationCompanyName" TEXT,
    "nextDestinationCompanySiret" TEXT,
    "nextDestinationCompanyAddress" TEXT,
    "nextDestinationCompanyContact" TEXT,
    "nextDestinationCompanyPhone" TEXT,
    "nextDestinationCompanyMail" TEXT,
    "nextDestinationCompanyCountry" TEXT,
    "nextDestinationCompanyVatNumber" VARCHAR(30),
    "nextDestinationNotificationNumber" VARCHAR(6),
    "nextDestinationCompanyExtraEuropeanId" TEXT,
    "nextTransporterOrgId" VARCHAR(30),
    "emittedAt" TIMESTAMPTZ(6),
    "emittedBy" TEXT,
    "emittedByEcoOrganisme" BOOLEAN,
    "takenOverAt" TIMESTAMPTZ(6),
    "takenOverBy" TEXT,
    "signedAt" TIMESTAMPTZ(6),
    "signedBy" TEXT,
    "isImportedFromPaper" BOOLEAN NOT NULL DEFAULT false,
    "quantityReceivedType" "QuantityType",
    "signedByTransporter" BOOLEAN,
    "sentAt" TIMESTAMPTZ(6),
    "sentBy" TEXT,
    "isAccepted" BOOLEAN DEFAULT false,
    "wasteAcceptationStatus" "WasteAcceptationStatus",
    "wasteRefusalReason" TEXT,
    "receivedBy" TEXT,
    "receivedAt" TIMESTAMPTZ(6),
    "quantityReceived" DECIMAL(65,30),
    "processedBy" TEXT,
    "processedAt" TIMESTAMPTZ(6),
    "processingOperationDone" TEXT,
    "processingOperationDescription" TEXT,
    "noTraceability" BOOLEAN,
    "destinationOperationMode" "OperationMode",
    "currentTransporterOrgId" VARCHAR(30),
    "transporterCompanyPhone" TEXT,
    "ownerId" VARCHAR(30) NOT NULL,
    "forwardedInId" TEXT,
    "recipientsSirets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "transportersSirets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "intermediariesSirets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "canAccessDraftSirets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quantityGrouped" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormGroupement" (
    "id" TEXT NOT NULL,
    "nextFormId" TEXT NOT NULL,
    "initialFormId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "FormGroupement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntermediaryFormAssociation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siret" TEXT NOT NULL,
    "contact" TEXT,
    "vatNumber" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "mail" TEXT,
    "formId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntermediaryFormAssociation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BsddRevisionRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isCanceled" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT NOT NULL,
    "bsddId" TEXT NOT NULL,
    "authoringCompanyId" TEXT NOT NULL,
    "status" "RevisionRequestStatus" DEFAULT 'PENDING',
    "recipientCap" TEXT,
    "wasteDetailsCode" TEXT,
    "wasteDetailsName" TEXT,
    "wasteDetailsPop" BOOLEAN,
    "wasteDetailsPackagingInfos" JSONB,
    "quantityReceived" DOUBLE PRECISION,
    "processingOperationDone" TEXT,
    "destinationOperationMode" "OperationMode",
    "processingOperationDescription" TEXT,
    "brokerCompanyName" TEXT,
    "brokerCompanySiret" TEXT,
    "brokerCompanyAddress" TEXT,
    "brokerCompanyContact" TEXT,
    "brokerCompanyPhone" TEXT,
    "brokerCompanyMail" TEXT,
    "brokerReceipt" TEXT,
    "brokerDepartment" TEXT,
    "brokerValidityLimit" TIMESTAMPTZ(6),
    "traderCompanyName" TEXT,
    "traderCompanySiret" TEXT,
    "traderCompanyAddress" TEXT,
    "traderCompanyContact" TEXT,
    "traderCompanyPhone" TEXT,
    "traderCompanyMail" TEXT,
    "traderReceipt" TEXT,
    "traderDepartment" TEXT,
    "traderValidityLimit" TIMESTAMPTZ(6),
    "temporaryStorageDestinationCap" TEXT,
    "temporaryStorageDestinationProcessingOperation" TEXT,
    "temporaryStorageTemporaryStorerQuantityReceived" DOUBLE PRECISION,

    CONSTRAINT "BsddRevisionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BsddRevisionRequestApproval" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "revisionRequestId" TEXT NOT NULL,
    "approverSiret" TEXT NOT NULL,
    "status" "RevisionRequestApprovalStatus" DEFAULT 'PENDING',
    "comment" TEXT,

    CONSTRAINT "BsddRevisionRequestApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grant" (
    "id" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "code" TEXT NOT NULL,
    "expires" INTEGER NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "openIdEnabled" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nonce" TEXT,
    "applicationId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,

    CONSTRAINT "Grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installation" (
    "id" VARCHAR(30) NOT NULL,
    "codeS3ic" TEXT,
    "nomEts" TEXT,
    "regime" TEXT,
    "libRegime" TEXT,
    "seveso" "Seveso",
    "libSeveso" TEXT,
    "familleIc" TEXT,
    "urlFiche" TEXT,
    "s3icNumeroSiret" TEXT,
    "irepNumeroSiret" TEXT,
    "gerepNumeroSiret" TEXT,
    "sireneNumeroSiret" TEXT,

    CONSTRAINT "Installation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipRequest" (
    "id" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "status" "MembershipRequestStatus" NOT NULL DEFAULT 'PENDING',
    "statusUpdatedBy" TEXT,
    "sentTo" TEXT[],
    "companyId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,

    CONSTRAINT "MembershipRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rubrique" (
    "id" VARCHAR(30) NOT NULL,
    "codeS3ic" TEXT,
    "rubrique" TEXT,
    "alinea" TEXT,
    "dateAutorisation" TEXT,
    "etatActivite" TEXT,
    "regimeAutorise" TEXT,
    "activite" TEXT,
    "volume" TEXT,
    "unite" TEXT,
    "category" TEXT,
    "wasteType" "WasteType",

    CONSTRAINT "Rubrique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusLog" (
    "id" VARCHAR(30) NOT NULL,
    "status" "Status" NOT NULL,
    "loggedAt" TIMESTAMPTZ(6),
    "updatedFields" JSONB NOT NULL,
    "authType" "AuthType" NOT NULL,
    "formId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,

    CONSTRAINT "StatusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraderReceipt" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "validityLimit" TIMESTAMPTZ(6) NOT NULL,
    "department" TEXT NOT NULL,

    CONSTRAINT "TraderReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerReceipt" (
    "id" VARCHAR(30) NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "validityLimit" TIMESTAMPTZ(6) NOT NULL,
    "department" TEXT NOT NULL,

    CONSTRAINT "BrokerReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransporterReceipt" (
    "id" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "validityLimit" TIMESTAMPTZ(6) NOT NULL,
    "department" TEXT NOT NULL,

    CONSTRAINT "TransporterReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VhuAgrement" (
    "id" VARCHAR(40) NOT NULL,
    "agrementNumber" VARCHAR(50) NOT NULL,
    "department" VARCHAR(50) NOT NULL,

    CONSTRAINT "VhuAgrement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerCertification" (
    "id" VARCHAR(30) NOT NULL,
    "hasSubSectionFour" BOOLEAN NOT NULL DEFAULT false,
    "hasSubSectionThree" BOOLEAN NOT NULL DEFAULT false,
    "certificationNumber" VARCHAR(50),
    "validityLimit" TIMESTAMPTZ(6),
    "organisation" VARCHAR(30),

    CONSTRAINT "WorkerCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BsddTransporter" (
    "id" VARCHAR(30) NOT NULL,
    "number" INTEGER NOT NULL,
    "transporterCompanySiret" TEXT,
    "transporterCompanyVatNumber" VARCHAR(30),
    "transporterCompanyName" TEXT,
    "transporterCompanyAddress" TEXT,
    "transporterCompanyContact" TEXT,
    "transporterCompanyPhone" TEXT,
    "transporterCompanyMail" TEXT,
    "transporterIsExemptedOfReceipt" BOOLEAN,
    "transporterReceipt" TEXT,
    "transporterDepartment" TEXT,
    "transporterValidityLimit" TIMESTAMPTZ(6),
    "transporterNumberPlate" TEXT,
    "transporterTransportMode" "TransportMode",
    "transporterCustomInfo" TEXT,
    "readyToTakeOver" BOOLEAN DEFAULT false,
    "previousTransporterCompanyOrgId" VARCHAR(30),
    "takenOverAt" TIMESTAMPTZ(6),
    "takenOverBy" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "formId" VARCHAR(30),

    CONSTRAINT "BsddTransporter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "passwordVersion" INTEGER,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "activatedAt" TIMESTAMPTZ(6),
    "firstAssociationDate" TIMESTAMPTZ(6),
    "isActive" BOOLEAN DEFAULT false,
    "isAdmin" BOOLEAN DEFAULT false,
    "isRegistreNational" BOOLEAN NOT NULL DEFAULT false,
    "governmentAccountId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GovernmentAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" "GovernmentPermission"[],
    "authorizedIPs" TEXT[],
    "authorizedOrgIds" TEXT[],

    CONSTRAINT "GovernmentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAccountHash" (
    "id" VARCHAR(30) NOT NULL,
    "email" TEXT NOT NULL,
    "companySiret" VARCHAR(25) NOT NULL,
    "role" "UserRole" NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "acceptedAt" TIMESTAMPTZ(6),

    CONSTRAINT "UserAccountHash_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivationHash" (
    "id" VARCHAR(30) NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "userId" VARCHAR(30) NOT NULL,

    CONSTRAINT "UserActivationHash_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserResetPasswordHash" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "hashExpires" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserResetPasswordHash_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "userId" VARCHAR(30) NOT NULL,

    CONSTRAINT "FeatureFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bsvhu" (
    "id" VARCHAR(40) NOT NULL,
    "rowNumber" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "status" "BsvhuStatus" NOT NULL DEFAULT 'INITIAL',
    "emitterAgrementNumber" VARCHAR(100),
    "emitterCompanyName" TEXT,
    "emitterCompanySiret" VARCHAR(17),
    "emitterCompanyAddress" TEXT,
    "emitterCompanyContact" TEXT,
    "emitterCompanyPhone" TEXT,
    "emitterCompanyMail" TEXT,
    "emitterCustomInfo" TEXT,
    "emitterEmissionSignatureAuthor" TEXT,
    "emitterEmissionSignatureDate" TIMESTAMPTZ(6),
    "destinationType" "BsvhuDestinationType",
    "destinationPlannedOperationCode" VARCHAR(50) DEFAULT 'R 4',
    "destinationAgrementNumber" VARCHAR(100),
    "destinationCompanyName" TEXT,
    "destinationCompanySiret" VARCHAR(17),
    "destinationCompanyAddress" TEXT,
    "destinationCompanyContact" TEXT,
    "destinationCompanyPhone" TEXT,
    "destinationCompanyMail" TEXT,
    "destinationReceptionAcceptationStatus" "WasteAcceptationStatus",
    "destinationReceptionRefusalReason" TEXT,
    "destinationReceptionIdentificationNumbers" TEXT[],
    "destinationReceptionIdentificationType" "BsvhuIdentificationType",
    "destinationOperationCode" VARCHAR(50),
    "destinationOperationNextDestinationCompanyName" TEXT,
    "destinationOperationNextDestinationCompanySiret" VARCHAR(17),
    "destinationOperationNextDestinationCompanyAddress" TEXT,
    "destinationOperationNextDestinationCompanyContact" TEXT,
    "destinationOperationNextDestinationCompanyPhone" TEXT,
    "destinationOperationNextDestinationCompanyMail" TEXT,
    "destinationOperationSignatureAuthor" TEXT,
    "destinationOperationSignatureDate" TIMESTAMPTZ(6),
    "destinationOperationDate" TIMESTAMPTZ(6),
    "destinationReceptionQuantity" INTEGER,
    "destinationReceptionWeight" DOUBLE PRECISION,
    "destinationReceptionDate" TIMESTAMPTZ(6),
    "destinationOperationNextDestinationCompanyVatNumber" TEXT,
    "destinationCustomInfo" TEXT,
    "destinationOperationMode" "OperationMode",
    "wasteCode" VARCHAR(10) DEFAULT '16 01 06',
    "packaging" "BsvhuPackaging",
    "identificationNumbers" TEXT[],
    "identificationType" "BsvhuIdentificationType",
    "quantity" INTEGER,
    "weightValue" DOUBLE PRECISION,
    "weightIsEstimate" BOOLEAN,
    "transporterCompanyName" TEXT,
    "transporterCompanySiret" VARCHAR(17),
    "transporterCompanyAddress" TEXT,
    "transporterCompanyContact" TEXT,
    "transporterCompanyPhone" TEXT,
    "transporterCompanyMail" TEXT,
    "transporterRecepisseNumber" TEXT,
    "transporterRecepisseDepartment" TEXT,
    "transporterRecepisseValidityLimit" TIMESTAMPTZ(6),
    "transporterCompanyVatNumber" VARCHAR(50),
    "transporterTransportSignatureAuthor" TEXT,
    "transporterTransportSignatureDate" TIMESTAMPTZ(6),
    "transporterTransportTakenOverAt" TIMESTAMPTZ(6),
    "transporterCustomInfo" TEXT,
    "transporterTransportPlates" TEXT[],
    "transporterRecepisseIsExempted" BOOLEAN,

    CONSTRAINT "VhuForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bsdasri" (
    "id" TEXT NOT NULL,
    "type" "BsdasriType" NOT NULL DEFAULT 'SIMPLE',
    "status" "BsdasriStatus" NOT NULL DEFAULT 'INITIAL',
    "rowNumber" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN DEFAULT false,
    "isDraft" BOOLEAN DEFAULT false,
    "emitterCompanyName" TEXT,
    "emitterCompanySiret" TEXT,
    "emitterCompanyAddress" TEXT,
    "emitterCompanyContact" TEXT,
    "emitterCompanyPhone" TEXT,
    "emitterCompanyMail" TEXT,
    "emitterPickupSiteName" TEXT,
    "emitterPickupSiteAddress" TEXT,
    "emitterPickupSiteCity" TEXT,
    "emitterPickupSitePostalCode" TEXT,
    "emitterPickupSiteInfos" TEXT,
    "emitterWasteVolume" DOUBLE PRECISION,
    "emitterWastePackagings" JSONB NOT NULL,
    "emitterCustomInfo" TEXT,
    "emitterEmissionSignatureAuthor" TEXT,
    "emitterWasteWeightValue" DECIMAL(65,30),
    "emitterEmissionSignatureDate" TIMESTAMPTZ(6),
    "isEmissionDirectTakenOver" BOOLEAN DEFAULT false,
    "isEmissionTakenOverWithSecretCode" BOOLEAN DEFAULT false,
    "wasteCode" TEXT,
    "wasteAdr" TEXT,
    "transporterCompanyName" TEXT,
    "transporterCompanySiret" TEXT,
    "transporterCompanyAddress" TEXT,
    "transporterCompanyPhone" TEXT,
    "transporterCompanyContact" TEXT,
    "transporterCompanyMail" TEXT,
    "transporterRecepisseNumber" TEXT,
    "transporterRecepisseDepartment" TEXT,
    "transporterRecepisseValidityLimit" TIMESTAMPTZ(6),
    "transporterRecepisseIsExempted" BOOLEAN,
    "transporterAcceptationStatus" "WasteAcceptationStatus",
    "transporterWasteRefusalReason" TEXT,
    "transporterWasteRefusedWeightValue" DECIMAL(65,30),
    "transporterTakenOverAt" TIMESTAMPTZ(6),
    "transporterWastePackagings" JSONB NOT NULL,
    "transporterWasteWeightValue" DECIMAL(65,30),
    "transporterWasteVolume" DOUBLE PRECISION,
    "transporterCustomInfo" TEXT,
    "transporterTransportSignatureAuthor" TEXT,
    "transporterTransportSignatureDate" TIMESTAMPTZ(6),
    "handedOverToRecipientAt" TIMESTAMPTZ(6),
    "destinationCompanyName" TEXT,
    "destinationCompanySiret" TEXT,
    "destinationCompanyAddress" TEXT,
    "destinationCompanyContact" TEXT,
    "destinationCompanyPhone" TEXT,
    "destinationCompanyMail" TEXT,
    "destinationCustomInfo" TEXT,
    "destinationWastePackagings" JSONB NOT NULL,
    "destinationReceptionAcceptationStatus" "WasteAcceptationStatus",
    "destinationReceptionWasteRefusalReason" TEXT,
    "destinationReceptionWasteRefusedWeightValue" DECIMAL(65,30),
    "destinationReceptionWasteWeightValue" DECIMAL(65,30),
    "destinationReceptionWasteVolume" DOUBLE PRECISION,
    "destinationReceptionDate" TIMESTAMPTZ(6),
    "destinationOperationCode" TEXT,
    "destinationOperationDate" TIMESTAMPTZ(6),
    "destinationReceptionSignatureAuthor" TEXT,
    "destinationReceptionSignatureDate" TIMESTAMPTZ(6),
    "destinationOperationSignatureDate" TIMESTAMPTZ(6),
    "destinationOperationSignatureAuthor" TEXT,
    "transporterTransportMode" "TransportMode" DEFAULT 'ROAD',
    "emitterWasteWeightIsEstimate" BOOLEAN,
    "transporterWasteWeightIsEstimate" BOOLEAN,
    "ecoOrganismeName" TEXT,
    "ecoOrganismeSiret" TEXT,
    "transporterTransportPlates" TEXT[],
    "identificationNumbers" TEXT[],
    "transporterCompanyVatNumber" TEXT,
    "emittedByEcoOrganisme" BOOLEAN NOT NULL DEFAULT false,
    "destinationOperationMode" "OperationMode",
    "emissionSignatoryId" TEXT,
    "transportSignatoryId" TEXT,
    "receptionSignatoryId" TEXT,
    "operationSignatoryId" TEXT,
    "groupedInId" TEXT,
    "synthesizedInId" TEXT,
    "groupingEmitterSirets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "synthesisEmitterSirets" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Bsdasri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bsff" (
    "id" TEXT NOT NULL,
    "rowNumber" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "status" "BsffStatus" NOT NULL DEFAULT 'INITIAL',
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "type" "BsffType" NOT NULL DEFAULT 'TRACER_FLUIDE',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "emitterCompanyName" TEXT,
    "emitterCompanySiret" TEXT,
    "emitterCompanyAddress" TEXT,
    "emitterCompanyContact" TEXT,
    "emitterCompanyPhone" TEXT,
    "emitterCompanyMail" TEXT,
    "emitterCustomInfo" TEXT,
    "emitterEmissionSignatureAuthor" TEXT,
    "emitterEmissionSignatureDate" TIMESTAMPTZ(6),
    "wasteCode" TEXT,
    "wasteAdr" TEXT,
    "weightValue" DECIMAL(65,30),
    "weightIsEstimate" BOOLEAN,
    "wasteDescription" TEXT,
    "transporterCompanyName" TEXT,
    "transporterCompanySiret" TEXT,
    "transporterCompanyAddress" TEXT,
    "transporterCompanyContact" TEXT,
    "transporterCompanyPhone" TEXT,
    "transporterCompanyMail" TEXT,
    "transporterCompanyVatNumber" TEXT,
    "transporterCustomInfo" TEXT,
    "transporterTransportTakenOverAt" TIMESTAMPTZ(6),
    "transporterTransportPlates" TEXT[],
    "transporterRecepisseIsExempted" BOOLEAN DEFAULT false,
    "transporterRecepisseNumber" TEXT,
    "transporterRecepisseDepartment" TEXT,
    "transporterRecepisseValidityLimit" TIMESTAMPTZ(6),
    "transporterTransportMode" "TransportMode" DEFAULT 'ROAD',
    "transporterTransportSignatureAuthor" TEXT,
    "transporterTransportSignatureDate" TIMESTAMPTZ(6),
    "destinationCompanyName" TEXT,
    "destinationCompanySiret" TEXT,
    "destinationCompanyAddress" TEXT,
    "destinationCompanyContact" TEXT,
    "destinationCompanyPhone" TEXT,
    "destinationCompanyMail" TEXT,
    "destinationCustomInfo" TEXT,
    "destinationCap" TEXT,
    "destinationReceptionDate" TIMESTAMPTZ(6),
    "destinationReceptionSignatureAuthor" TEXT,
    "destinationReceptionSignatureDate" TIMESTAMPTZ(6),
    "destinationPlannedOperationCode" TEXT,
    "detenteurCompanySirets" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Bsff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BsffFicheIntervention" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "numero" TEXT NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL,
    "postalCode" TEXT NOT NULL,
    "detenteurCompanyName" TEXT NOT NULL,
    "detenteurCompanySiret" TEXT,
    "detenteurCompanyAddress" TEXT NOT NULL,
    "detenteurCompanyContact" TEXT,
    "detenteurCompanyPhone" TEXT,
    "detenteurCompanyMail" TEXT,
    "detenteurIsPrivateIndividual" BOOLEAN NOT NULL DEFAULT false,
    "operateurCompanyName" TEXT NOT NULL,
    "operateurCompanySiret" TEXT NOT NULL,
    "operateurCompanyAddress" TEXT NOT NULL,
    "operateurCompanyContact" TEXT NOT NULL,
    "operateurCompanyPhone" TEXT NOT NULL,
    "operateurCompanyMail" TEXT NOT NULL,

    CONSTRAINT "BsffFicheIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BsffPackaging" (
    "id" TEXT NOT NULL,
    "type" "BsffPackagingType" NOT NULL,
    "other" TEXT,
    "volume" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION NOT NULL,
    "emissionNumero" VARCHAR(100) NOT NULL,
    "numero" VARCHAR(100) NOT NULL,
    "acceptationDate" TIMESTAMPTZ(6),
    "acceptationRefusalReason" TEXT,
    "acceptationStatus" "WasteAcceptationStatus",
    "acceptationWeight" DOUBLE PRECISION,
    "acceptationWasteCode" TEXT,
    "acceptationWasteDescription" TEXT,
    "acceptationSignatureAuthor" TEXT,
    "acceptationSignatureDate" TIMESTAMPTZ(6),
    "operationDate" TIMESTAMPTZ(6),
    "operationNoTraceability" BOOLEAN NOT NULL DEFAULT false,
    "operationCode" TEXT,
    "operationMode" "OperationMode",
    "operationDescription" TEXT,
    "operationSignatureAuthor" TEXT,
    "operationSignatureDate" TIMESTAMPTZ(6),
    "operationNextDestinationPlannedOperationCode" TEXT,
    "operationNextDestinationCap" TEXT,
    "operationNextDestinationCompanyName" TEXT,
    "operationNextDestinationCompanySiret" TEXT,
    "operationNextDestinationCompanyVatNumber" TEXT,
    "operationNextDestinationCompanyAddress" TEXT,
    "operationNextDestinationCompanyContact" TEXT,
    "operationNextDestinationCompanyPhone" TEXT,
    "operationNextDestinationCompanyMail" TEXT,
    "bsffId" TEXT NOT NULL,
    "nextPackagingId" TEXT,

    CONSTRAINT "BsffPackaging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bsda" (
    "id" TEXT NOT NULL,
    "rowNumber" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "status" "BsdaStatus" NOT NULL DEFAULT 'INITIAL',
    "type" "BsdaType" NOT NULL DEFAULT 'OTHER_COLLECTIONS',
    "emitterIsPrivateIndividual" BOOLEAN,
    "emitterCompanyName" TEXT,
    "emitterCompanySiret" TEXT,
    "emitterCompanyAddress" TEXT,
    "emitterCompanyContact" TEXT,
    "emitterCompanyPhone" TEXT,
    "emitterCompanyMail" TEXT,
    "emitterCustomInfo" TEXT,
    "emitterPickupSiteName" TEXT,
    "emitterPickupSiteAddress" TEXT,
    "emitterPickupSiteCity" TEXT,
    "emitterPickupSitePostalCode" TEXT,
    "emitterPickupSiteInfos" TEXT,
    "emitterEmissionSignatureAuthor" TEXT,
    "emitterEmissionSignatureDate" TIMESTAMPTZ(6),
    "ecoOrganismeName" TEXT,
    "ecoOrganismeSiret" TEXT,
    "wasteCode" TEXT,
    "wasteFamilyCode" TEXT,
    "wasteMaterialName" TEXT,
    "wasteConsistence" "BsdaConsistence",
    "wasteSealNumbers" TEXT[],
    "wasteAdr" TEXT,
    "wastePop" BOOLEAN DEFAULT false,
    "packagings" JSONB NOT NULL,
    "weightValue" DECIMAL(65,30),
    "weightIsEstimate" BOOLEAN,
    "destinationCompanyName" TEXT,
    "destinationCompanySiret" TEXT,
    "destinationCompanyAddress" TEXT,
    "destinationCompanyContact" TEXT,
    "destinationCompanyPhone" TEXT,
    "destinationCompanyMail" TEXT,
    "destinationCustomInfo" TEXT,
    "destinationCap" TEXT,
    "destinationPlannedOperationCode" TEXT,
    "destinationReceptionDate" TIMESTAMPTZ(6),
    "destinationReceptionWeight" DECIMAL(65,30),
    "destinationReceptionAcceptationStatus" "WasteAcceptationStatus",
    "destinationReceptionRefusalReason" TEXT,
    "destinationOperationCode" TEXT,
    "destinationOperationDate" TIMESTAMPTZ(6),
    "destinationOperationSignatureAuthor" TEXT,
    "destinationOperationSignatureDate" TIMESTAMPTZ(6),
    "destinationOperationMode" "OperationMode",
    "destinationOperationDescription" TEXT,
    "destinationOperationNextDestinationCompanyName" TEXT,
    "destinationOperationNextDestinationCompanySiret" TEXT,
    "destinationOperationNextDestinationCompanyVatNumber" TEXT,
    "destinationOperationNextDestinationCompanyAddress" TEXT,
    "destinationOperationNextDestinationCompanyContact" TEXT,
    "destinationOperationNextDestinationCompanyPhone" TEXT,
    "destinationOperationNextDestinationCompanyMail" TEXT,
    "destinationOperationNextDestinationCap" TEXT,
    "destinationOperationNextDestinationPlannedOperationCode" TEXT,
    "transporterTransportSignatureDate" TIMESTAMPTZ(6),
    "workerCompanyName" TEXT,
    "workerCompanySiret" TEXT,
    "workerCompanyAddress" TEXT,
    "workerCompanyContact" TEXT,
    "workerCompanyPhone" TEXT,
    "workerCompanyMail" TEXT,
    "workerIsDisabled" BOOLEAN,
    "workerWorkHasEmitterPaperSignature" BOOLEAN,
    "workerWorkSignatureAuthor" TEXT,
    "workerWorkSignatureDate" TIMESTAMPTZ(6),
    "workerCertificationHasSubSectionFour" BOOLEAN,
    "workerCertificationHasSubSectionThree" BOOLEAN,
    "workerCertificationCertificationNumber" VARCHAR(50),
    "workerCertificationValidityLimit" TIMESTAMPTZ(6),
    "workerCertificationOrganisation" VARCHAR(30),
    "brokerCompanyName" TEXT,
    "brokerCompanySiret" TEXT,
    "brokerCompanyAddress" TEXT,
    "brokerCompanyContact" TEXT,
    "brokerCompanyPhone" TEXT,
    "brokerCompanyMail" TEXT,
    "brokerRecepisseNumber" TEXT,
    "brokerRecepisseDepartment" TEXT,
    "brokerRecepisseValidityLimit" TIMESTAMPTZ(6),
    "repackagedInId" TEXT,
    "forwardingId" TEXT,
    "groupedInId" TEXT,
    "intermediariesOrgIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "transportersOrgIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Bsda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BsdaTransporter" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "number" INTEGER NOT NULL,
    "bsdaId" TEXT,
    "transporterCompanySiret" TEXT,
    "transporterCompanyName" TEXT,
    "transporterCompanyVatNumber" TEXT,
    "transporterCompanyAddress" TEXT,
    "transporterCompanyContact" TEXT,
    "transporterCompanyPhone" TEXT,
    "transporterCompanyMail" TEXT,
    "transporterCustomInfo" TEXT,
    "transporterRecepisseIsExempted" BOOLEAN,
    "transporterRecepisseNumber" TEXT,
    "transporterRecepisseDepartment" TEXT,
    "transporterRecepisseValidityLimit" TIMESTAMPTZ(6),
    "transporterTransportMode" "TransportMode" DEFAULT 'ROAD',
    "transporterTransportPlates" TEXT[],
    "transporterTransportTakenOverAt" TIMESTAMPTZ(6),
    "transporterTransportSignatureAuthor" TEXT,
    "transporterTransportSignatureDate" TIMESTAMPTZ(6),

    CONSTRAINT "BsdaTransporter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BsdaRevisionRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "RevisionRequestStatus" DEFAULT 'PENDING',
    "comment" TEXT NOT NULL,
    "isCanceled" BOOLEAN NOT NULL DEFAULT false,
    "bsdaId" TEXT NOT NULL,
    "authoringCompanyId" TEXT NOT NULL,
    "wasteCode" TEXT,
    "wastePop" BOOLEAN,
    "packagings" JSONB,
    "wasteSealNumbers" TEXT[],
    "wasteMaterialName" TEXT,
    "destinationCap" TEXT,
    "destinationReceptionWeight" DOUBLE PRECISION,
    "destinationOperationCode" TEXT,
    "destinationOperationDescription" TEXT,
    "destinationOperationMode" "OperationMode",
    "brokerCompanyName" TEXT,
    "brokerCompanySiret" TEXT,
    "brokerCompanyAddress" TEXT,
    "brokerCompanyContact" TEXT,
    "brokerCompanyPhone" TEXT,
    "brokerCompanyMail" TEXT,
    "brokerRecepisseNumber" TEXT,
    "brokerRecepisseDepartment" TEXT,
    "brokerRecepisseValidityLimit" TIMESTAMPTZ(6),
    "emitterPickupSiteName" TEXT,
    "emitterPickupSiteAddress" TEXT,
    "emitterPickupSiteCity" TEXT,
    "emitterPickupSitePostalCode" TEXT,
    "emitterPickupSiteInfos" TEXT,

    CONSTRAINT "BsdaRevisionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BsdaRevisionRequestApproval" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "revisionRequestId" TEXT NOT NULL,
    "approverSiret" TEXT NOT NULL,
    "status" "RevisionRequestApprovalStatus" DEFAULT 'PENDING',
    "comment" TEXT,

    CONSTRAINT "BsdaRevisionRequestApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntermediaryBsdaAssociation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "siret" TEXT NOT NULL,
    "contact" TEXT,
    "vatNumber" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "mail" TEXT,
    "bsdaId" TEXT NOT NULL,

    CONSTRAINT "IntermediaryBsdaAssociation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streamId" VARCHAR(50) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "data" JSONB,
    "metadata" JSONB,
    "actor" VARCHAR(50) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bspaoh" (
    "id" TEXT NOT NULL,
    "rowNumber" SERIAL NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "status" "BspaohStatus" NOT NULL DEFAULT 'INITIAL',
    "wasteCode" TEXT,
    "wasteAdr" TEXT,
    "wasteType" "BspaohType" NOT NULL DEFAULT 'PAOH',
    "wastePackagings" JSONB DEFAULT '[]',
    "emitterCompanyName" TEXT,
    "emitterCompanySiret" TEXT,
    "emitterCompanyAddress" TEXT,
    "emitterCompanyContact" TEXT,
    "emitterCompanyPhone" TEXT,
    "emitterCompanyMail" TEXT,
    "emitterCustomInfo" TEXT,
    "emitterPickupSiteName" TEXT,
    "emitterPickupSiteAddress" TEXT,
    "emitterPickupSiteCity" TEXT,
    "emitterPickupSitePostalCode" TEXT,
    "emitterPickupSiteInfos" TEXT,
    "emitterWasteQuantityValue" INTEGER,
    "emitterWasteWeightValue" DOUBLE PRECISION,
    "emitterWasteWeightIsEstimate" BOOLEAN,
    "emitterEmissionSignatureAuthor" TEXT,
    "emitterEmissionSignatureDate" TIMESTAMPTZ(6),
    "transporterTransportTakenOverAt" TIMESTAMPTZ(6),
    "destinationCompanyName" TEXT,
    "destinationCompanySiret" TEXT,
    "destinationCompanyAddress" TEXT,
    "destinationCompanyContact" TEXT,
    "destinationCompanyPhone" TEXT,
    "destinationCompanyMail" TEXT,
    "destinationCustomInfo" TEXT,
    "destinationCap" TEXT,
    "handedOverToDestinationDate" TIMESTAMPTZ(6),
    "handedOverToDestinationSignatureDate" TIMESTAMPTZ(6),
    "handedOverToDestinationSignatureAuthor" TEXT,
    "destinationReceptionWasteWeightValue" DOUBLE PRECISION,
    "destinationReceptionWasteQuantityValue" INTEGER,
    "destinationReceptionWasteWeightIsEstimate" BOOLEAN,
    "destinationReceptionAcceptationStatus" "WasteAcceptationStatus",
    "destinationReceptionWasteRefusalReason" TEXT,
    "destinationReceptionWastePackagingsAcceptation" JSONB DEFAULT '[]',
    "destinationReceptionDate" TIMESTAMPTZ(6),
    "destinationReceptionSignatureDate" TIMESTAMPTZ(6),
    "destinationReceptionSignatureAuthor" TEXT,
    "destinationOperationCode" TEXT,
    "destinationOperationDate" TIMESTAMPTZ(6),
    "destinationOperationSignatureDate" TIMESTAMPTZ(6),
    "destinationOperationSignatureAuthor" TEXT,
    "currentTransporterOrgId" TEXT,
    "nextTransporterOrgId" TEXT,
    "transportersSirets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "canAccessDraftSirets" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Bspaoh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BspaohTransporter" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "transporterCompanyName" TEXT,
    "transporterCompanySiret" TEXT,
    "transporterCompanyVatNumber" TEXT,
    "transporterCompanyAddress" TEXT,
    "transporterCompanyContact" TEXT,
    "transporterCompanyPhone" TEXT,
    "transporterCompanyMail" TEXT,
    "transporterTransportMode" "TransportMode",
    "transporterCustomInfo" TEXT,
    "transporterRecepisseDepartment" TEXT,
    "transporterRecepisseIsExempted" BOOLEAN,
    "transporterRecepisseNumber" TEXT,
    "transporterRecepisseValidityLimit" TIMESTAMPTZ(6),
    "transporterTakenOverAt" TIMESTAMPTZ(6),
    "transporterTransportPlates" TEXT[],
    "transporterTransportSignatureAuthor" TEXT,
    "transporterTransportSignatureDate" TIMESTAMPTZ(6),
    "bspaohId" TEXT,

    CONSTRAINT "BspaohTransporter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PdfAccessToken" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT,
    "bsdType" "BsdType",
    "bsdId" TEXT,
    "lastUsed" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3),

    CONSTRAINT "PdfAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookSetting" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endpointUri" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "orgId" TEXT,
    "activated" BOOLEAN DEFAULT false,

    CONSTRAINT "WebhookSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BsffToBsffFicheIntervention" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "default$default.AccessToken.token._UNIQUE" ON "AccessToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Company_orgId_key" ON "Company"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "default$default.Company.siret._UNIQUE" ON "Company"("siret");

-- CreateIndex
CREATE INDEX "_CompanyNameIdx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "_CompanyGivenNameIdx" ON "Company"("givenName");

-- CreateIndex
CREATE INDEX "_CompanyCreatedAtIdx" ON "Company"("createdAt");

-- CreateIndex
CREATE INDEX "_CompanyVerificationStatusIdx" ON "Company"("verificationStatus");

-- CreateIndex
CREATE INDEX "_CompanyTypesIdx" ON "Company" USING GIN ("companyTypes");

-- CreateIndex
CREATE INDEX "_CompanyVatNumberIdx" ON "Company"("vatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousCompany_orgId_key" ON "AnonymousCompany"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousCompany.siret_unique" ON "AnonymousCompany"("siret");

-- CreateIndex
CREATE INDEX "_AnonymousCompanyVatNumberIdx" ON "AnonymousCompany"("vatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousCompanyRequest.siret_unique" ON "AnonymousCompanyRequest"("siret");

-- CreateIndex
CREATE INDEX "_CompanyAssociationUserIdIdx" ON "CompanyAssociation"("userId");

-- CreateIndex
CREATE INDEX "_CompanyAssociationCompanyIdIdx" ON "CompanyAssociation"("companyId");

-- CreateIndex
CREATE INDEX "_CompanyAssociationRoleIdx" ON "CompanyAssociation"("role");

-- CreateIndex
CREATE INDEX "_SignatureAutomationFromIdIdx" ON "SignatureAutomation"("fromId");

-- CreateIndex
CREATE UNIQUE INDEX "SignatureAutomation_fkey_unique_together" ON "SignatureAutomation"("fromId", "toId");

-- CreateIndex
CREATE INDEX "declaration_codes3ic" ON "Declaration"("codeS3ic");

-- CreateIndex
CREATE UNIQUE INDEX "default$default.EcoOrganisme.siret._UNIQUE" ON "EcoOrganisme"("siret");

-- CreateIndex
CREATE UNIQUE INDEX "_FinalOperation_pkey" ON "FinalOperation"("id");

-- CreateIndex
CREATE INDEX "_FinalOperationFormIdIdx" ON "FinalOperation"("formId");

-- CreateIndex
CREATE INDEX "_FinalOperationdestinationCompanySiretIdx" ON "FinalOperation"("destinationCompanySiret");

-- CreateIndex
CREATE UNIQUE INDEX "FinalOperation_pkey_unique_together" ON "FinalOperation"("formId", "finalBsdReadableId");

-- CreateIndex
CREATE UNIQUE INDEX "_FinalOperation_finalBsdReadableId" ON "FinalOperation"("finalBsdReadableId", "formId");

-- CreateIndex
CREATE UNIQUE INDEX "Form_rowNumber_ukey" ON "Form"("rowNumber");

-- CreateIndex
CREATE UNIQUE INDEX "default$default.Form.readableId._UNIQUE" ON "Form"("readableId");

-- CreateIndex
CREATE UNIQUE INDEX "Form_forwardedInId_key" ON "Form"("forwardedInId");

-- CreateIndex
CREATE INDEX "_FormEmitterCompanySiretIdx" ON "Form"("emitterCompanySiret");

-- CreateIndex
CREATE INDEX "_FormRecipientCompanySiretIdx" ON "Form"("recipientCompanySiret");

-- CreateIndex
CREATE INDEX "_FormTraderCompanySiretIdx" ON "Form"("traderCompanySiret");

-- CreateIndex
CREATE INDEX "_FormBrokerCompanySiretIdx" ON "Form"("brokerCompanySiret");

-- CreateIndex
CREATE INDEX "_FormEcoOrganismeSiretIdx" ON "Form"("ecoOrganismeSiret");

-- CreateIndex
CREATE INDEX "_FormStatusIdx" ON "Form"("status");

-- CreateIndex
CREATE INDEX "_FormSentAtIdx" ON "Form"("sentAt");

-- CreateIndex
CREATE INDEX "_FormCreatedAtIdx" ON "Form"("createdAt");

-- CreateIndex
CREATE INDEX "_FormWasteDetailsCodeIdx" ON "Form"("wasteDetailsCode");

-- CreateIndex
CREATE INDEX "_FormCustomIdIdx" ON "Form"("customId");

-- CreateIndex
CREATE INDEX "_FormCurrentTransporterOrgIdIdx" ON "Form"("currentTransporterOrgId");

-- CreateIndex
CREATE INDEX "_FormNextTransporterOrgIdIdx" ON "Form"("nextTransporterOrgId");

-- CreateIndex
CREATE INDEX "_FormNextDestinationCompanySiretIdx" ON "Form"("nextDestinationCompanySiret");

-- CreateIndex
CREATE INDEX "_FormCanAccessDraftSiretsIdx" ON "Form" USING GIN ("canAccessDraftSirets");

-- CreateIndex
CREATE INDEX "_FormEmitterCompanyMailIdx" ON "Form"("emitterCompanyMail");

-- CreateIndex
CREATE INDEX "_FormIntermediariesSiretsIdx" ON "Form" USING GIN ("intermediariesSirets");

-- CreateIndex
CREATE INDEX "_FormRecipientsSiretsIdx" ON "Form" USING GIN ("recipientsSirets");

-- CreateIndex
CREATE INDEX "_FormTransportersSiretsIdx" ON "Form" USING GIN ("transportersSirets");

-- CreateIndex
CREATE INDEX "_FormUpdatedAtIdx" ON "Form"("updatedAt");

-- CreateIndex
CREATE INDEX "_FormGroupementNextFormId" ON "FormGroupement"("nextFormId");

-- CreateIndex
CREATE INDEX "_FormGroupementInitialFormId" ON "FormGroupement"("initialFormId");

-- CreateIndex
CREATE UNIQUE INDEX "FormGroupement_pkey_unique_together" ON "FormGroupement"("nextFormId", "initialFormId");

-- CreateIndex
CREATE INDEX "_IntermediaryFormAssociationFormIdIdx" ON "IntermediaryFormAssociation"("formId");

-- CreateIndex
CREATE INDEX "IntermediaryFormAssociationSiretIdx" ON "IntermediaryFormAssociation"("siret");

-- CreateIndex
CREATE INDEX "IntermediaryFormAssociationVatNumberIdx" ON "IntermediaryFormAssociation"("vatNumber");

-- CreateIndex
CREATE INDEX "_BsddRevisionRequestAuthoringCompanyIdIdx" ON "BsddRevisionRequest"("authoringCompanyId");

-- CreateIndex
CREATE INDEX "_BsddRevisionRequestBsddIdIdx" ON "BsddRevisionRequest"("bsddId");

-- CreateIndex
CREATE INDEX "_BsddRevisionRequestStatusIdx" ON "BsddRevisionRequest"("status");

-- CreateIndex
CREATE INDEX "_BsddRevisionRequestApprovalRevisionRequestIdIdx" ON "BsddRevisionRequestApproval"("revisionRequestId");

-- CreateIndex
CREATE INDEX "_BsddRevisionRequestApprovalApproverSiretIdx" ON "BsddRevisionRequestApproval"("approverSiret");

-- CreateIndex
CREATE UNIQUE INDEX "default$default.Grant.code._UNIQUE" ON "Grant"("code");

-- CreateIndex
CREATE INDEX "installation_gerepnumerosiret" ON "Installation"("gerepNumeroSiret");

-- CreateIndex
CREATE INDEX "installation_irepnumerosiret" ON "Installation"("irepNumeroSiret");

-- CreateIndex
CREATE INDEX "installation_s3icnumerosiret" ON "Installation"("s3icNumeroSiret");

-- CreateIndex
CREATE INDEX "installation_sirenenumerosiret" ON "Installation"("sireneNumeroSiret");

-- CreateIndex
CREATE INDEX "_MembershipRequestUserIdIdx" ON "MembershipRequest"("userId");

-- CreateIndex
CREATE INDEX "_MembershipRequestCompanyIdIdx" ON "MembershipRequest"("companyId");

-- CreateIndex
CREATE INDEX "rubrique_codes3ic" ON "Rubrique"("codeS3ic");

-- CreateIndex
CREATE INDEX "_StatusLogUserIdIdx" ON "StatusLog"("userId");

-- CreateIndex
CREATE INDEX "_StatusLogFormIdIdx" ON "StatusLog"("formId");

-- CreateIndex
CREATE INDEX "_StatusLogLoggedAtIdx" ON "StatusLog"("loggedAt");

-- CreateIndex
CREATE INDEX "_BsddTransporterCompanySiretIdx" ON "BsddTransporter"("transporterCompanySiret");

-- CreateIndex
CREATE INDEX "_BsddTransporterTransporterCompanyVatNumberIdx" ON "BsddTransporter"("transporterCompanyVatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_governmentAccountId_key" ON "User"("governmentAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "default$default.UserAccountHash.hash._UNIQUE" ON "UserAccountHash"("hash");

-- CreateIndex
CREATE INDEX "_UserAccountHashEmailIdx" ON "UserAccountHash"("email");

-- CreateIndex
CREATE INDEX "_UserAccountHashCompanySiretIdx" ON "UserAccountHash"("companySiret");

-- CreateIndex
CREATE UNIQUE INDEX "default$default.UserActivationHash.hash._UNIQUE" ON "UserActivationHash"("hash");

-- CreateIndex
CREATE INDEX "_UserActivationHashUserIdIdx" ON "UserActivationHash"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserResetPasswordHash_hash_key" ON "UserResetPasswordHash"("hash");

-- CreateIndex
CREATE INDEX "_UserResetPasswordHashIdIdx" ON "UserResetPasswordHash"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_name_userId_unique_together" ON "FeatureFlag"("name", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Bsvhu_rowNumber_ukey" ON "Bsvhu"("rowNumber");

-- CreateIndex
CREATE INDEX "_BvhuEmitterCompanySirettIdx" ON "Bsvhu"("emitterCompanySiret");

-- CreateIndex
CREATE INDEX "_BsvhuDestinationCompanySiretIdx" ON "Bsvhu"("destinationCompanySiret");

-- CreateIndex
CREATE INDEX "_BsvhuTransporterCompanySiretIdx" ON "Bsvhu"("transporterCompanySiret");

-- CreateIndex
CREATE INDEX "_BsvhuStatusIdx" ON "Bsvhu"("status");

-- CreateIndex
CREATE INDEX "_BsvhuUpdatedAtIdx" ON "Bsvhu"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Bsdasri_rowNumber_ukey" ON "Bsdasri"("rowNumber");

-- CreateIndex
CREATE INDEX "_BsdasriEmitterCompanySiretIdx" ON "Bsdasri"("emitterCompanySiret");

-- CreateIndex
CREATE INDEX "_BsdasriTransporterCompanySiretIdx" ON "Bsdasri"("transporterCompanySiret");

-- CreateIndex
CREATE INDEX "_BsdasriDestinationCompanySiretIdx" ON "Bsdasri"("destinationCompanySiret");

-- CreateIndex
CREATE INDEX "_BsdasriEcoOrganismeSiretIdx" ON "Bsdasri"("ecoOrganismeSiret");

-- CreateIndex
CREATE INDEX "_BsdasriSynthesizedInIdIdx" ON "Bsdasri"("synthesizedInId");

-- CreateIndex
CREATE INDEX "_BsdasriGroupedInIdIdx" ON "Bsdasri"("groupedInId");

-- CreateIndex
CREATE INDEX "_BsdasriStatusIdx" ON "Bsdasri"("status");

-- CreateIndex
CREATE INDEX "_BsdasriTypeIdx" ON "Bsdasri"("type");

-- CreateIndex
CREATE INDEX "_BsdasriUpdatedAtIdx" ON "Bsdasri"("updatedAt");

-- CreateIndex
CREATE INDEX "_BsdasriGroupingEmitterSiretIdx" ON "Bsdasri" USING GIN ("groupingEmitterSirets");

-- CreateIndex
CREATE INDEX "_BsdasriSynthesisEmitterSiretsIdx" ON "Bsdasri" USING GIN ("synthesisEmitterSirets");

-- CreateIndex
CREATE UNIQUE INDEX "Bsff_rowNumber_ukey" ON "Bsff"("rowNumber");

-- CreateIndex
CREATE INDEX "_BsffEmitterCompanySiretIdx" ON "Bsff"("emitterCompanySiret");

-- CreateIndex
CREATE INDEX "_BsffTransporterCompanySiretIdx" ON "Bsff"("transporterCompanySiret");

-- CreateIndex
CREATE INDEX "_BsffDestinationCompanySiretIdx" ON "Bsff"("destinationCompanySiret");

-- CreateIndex
CREATE INDEX "_BsffStatusIdx" ON "Bsff"("status");

-- CreateIndex
CREATE INDEX "_BsffUpdatedAtIdx" ON "Bsff"("updatedAt");

-- CreateIndex
CREATE INDEX "_BsffCreatedAtIdx" ON "Bsff"("createdAt");

-- CreateIndex
CREATE INDEX "_BsffEmitterEmissionSignatureDateIdx" ON "Bsff"("emitterEmissionSignatureDate");

-- CreateIndex
CREATE INDEX "_BsffTransporterTransportSignatureDateIdx" ON "Bsff"("transporterTransportSignatureDate");

-- CreateIndex
CREATE INDEX "_BsffDetenteurSiretsIdx" ON "Bsff" USING GIN ("detenteurCompanySirets");

-- CreateIndex
CREATE INDEX "_BsffFicheInterventionDetenteurCompanySiretIdx" ON "BsffFicheIntervention"("detenteurCompanySiret");

-- CreateIndex
CREATE INDEX "_BsffFicheInterventionOperateurCompanySiretIdx" ON "BsffFicheIntervention"("operateurCompanySiret");

-- CreateIndex
CREATE INDEX "_BsffPackagingBsffId" ON "BsffPackaging"("bsffId");

-- CreateIndex
CREATE INDEX "_BsffPackagingNextPackagingIdx" ON "BsffPackaging"("nextPackagingId");

-- CreateIndex
CREATE INDEX "_BsffPackagingNumeroIdx" ON "BsffPackaging"("numero");

-- CreateIndex
CREATE INDEX "_BsffPackagingAcceptationWasteCodeIdx" ON "BsffPackaging"("acceptationWasteCode");

-- CreateIndex
CREATE INDEX "_BsffPackagingAcceptationSignatureDateIdx" ON "BsffPackaging"("acceptationSignatureDate");

-- CreateIndex
CREATE INDEX "_BsffPackagingOperationCodeIdx" ON "BsffPackaging"("operationCode");

-- CreateIndex
CREATE INDEX "_BsffPackagingOperationSignatureDateIdx" ON "BsffPackaging"("operationSignatureDate");

-- CreateIndex
CREATE UNIQUE INDEX "Bsda_rowNumber_ukey" ON "Bsda"("rowNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Bsda_forwardingId_unique" ON "Bsda"("forwardingId");

-- CreateIndex
CREATE INDEX "_BsdaEmitterCompanySiretIdx" ON "Bsda"("emitterCompanySiret");

-- CreateIndex
CREATE INDEX "_BsdaBrokerCompanySiretIdx" ON "Bsda"("brokerCompanySiret");

-- CreateIndex
CREATE INDEX "_BsdaDestinationCompanySiretIdx" ON "Bsda"("destinationCompanySiret");

-- CreateIndex
CREATE INDEX "_BsdaWorkerCompanySiretIdx" ON "Bsda"("workerCompanySiret");

-- CreateIndex
CREATE INDEX "_BsdaDestinationOperationNextDestinationCompanySiretIdx" ON "Bsda"("destinationOperationNextDestinationCompanySiret");

-- CreateIndex
CREATE INDEX "_BsdaStatusIdx" ON "Bsda"("status");

-- CreateIndex
CREATE INDEX "_BsdaGroupedInIdIdx" ON "Bsda"("groupedInId");

-- CreateIndex
CREATE INDEX "_BsdaUpdatedAtIdx" ON "Bsda"("updatedAt");

-- CreateIndex
CREATE INDEX "_BsdaIntermediariesOrgIdsIdx" ON "Bsda" USING GIN ("intermediariesOrgIds");

-- CreateIndex
CREATE INDEX "_BsdaTransportersOrgIdsIdx" ON "Bsda" USING GIN ("transportersOrgIds");

-- CreateIndex
CREATE INDEX "_BsdaTransporterFormIdIdx" ON "BsdaTransporter"("bsdaId");

-- CreateIndex
CREATE INDEX "_BsdaTransporterCompanySiretIdx" ON "BsdaTransporter"("transporterCompanySiret");

-- CreateIndex
CREATE INDEX "_BsdaTransporterCompanyVatNumberIdx" ON "BsdaTransporter"("transporterCompanyVatNumber");

-- CreateIndex
CREATE INDEX "_BsdaRevisionRequestAuthoringCompanyIdIdx" ON "BsdaRevisionRequest"("authoringCompanyId");

-- CreateIndex
CREATE INDEX "_BsdaRevisionRequestStatusIdx" ON "BsdaRevisionRequest"("status");

-- CreateIndex
CREATE INDEX "_BsdaRevisionRequestBsdaIdIdx" ON "BsdaRevisionRequest"("bsdaId");

-- CreateIndex
CREATE INDEX "_BsdaRevisionRequestApprovalRevisionRequestIdIdx" ON "BsdaRevisionRequestApproval"("revisionRequestId");

-- CreateIndex
CREATE INDEX "_BsdaRevisionRequestApprovalApproverSiretIdx" ON "BsdaRevisionRequestApproval"("approverSiret");

-- CreateIndex
CREATE INDEX "_IntermediaryBsdaAssociationBsdaIdIdx" ON "IntermediaryBsdaAssociation"("bsdaId");

-- CreateIndex
CREATE INDEX "IntermediaryBsdaAssociationSiretIdx" ON "IntermediaryBsdaAssociation"("siret");

-- CreateIndex
CREATE INDEX "IntermediaryBsdaAssociationVatNumberIdx" ON "IntermediaryBsdaAssociation"("vatNumber");

-- CreateIndex
CREATE INDEX "_EventActorIdx" ON "Event"("actor");

-- CreateIndex
CREATE INDEX "_EventStreamIdIdx" ON "Event"("streamId");

-- CreateIndex
CREATE UNIQUE INDEX "Bspaoh_rowNumber_ukey" ON "Bspaoh"("rowNumber");

-- CreateIndex
CREATE INDEX "_BspaohNextTransporterOrgIdIdx" ON "Bspaoh"("nextTransporterOrgId");

-- CreateIndex
CREATE INDEX "BspaohEmitterCompanySiretIdx" ON "Bspaoh"("emitterCompanySiret");

-- CreateIndex
CREATE INDEX "BspaohDestinationCompanySiretIdx" ON "Bspaoh"("destinationCompanySiret");

-- CreateIndex
CREATE INDEX "BspaohStatusIdx" ON "Bspaoh"("status");

-- CreateIndex
CREATE INDEX "BspaohCreatedAtIdx" ON "Bspaoh"("createdAt");

-- CreateIndex
CREATE INDEX "BspaohCurrentTransporterOrgIdIdx" ON "Bspaoh"("currentTransporterOrgId");

-- CreateIndex
CREATE INDEX "_BpaohTransporterBsdIdIdx" ON "BspaohTransporter"("bspaohId");

-- CreateIndex
CREATE INDEX "_BspaohTransporterCompanySiretIdx" ON "BspaohTransporter"("transporterCompanySiret");

-- CreateIndex
CREATE INDEX "_BspaohTransporterCompanyVatNumberIdx" ON "BspaohTransporter"("transporterCompanyVatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "_PdfAccessTokenTokenIdx" ON "PdfAccessToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookSetting_orgId_key" ON "WebhookSetting"("orgId");

-- CreateIndex
CREATE INDEX "_WebhookSettingOrgIdIdx" ON "WebhookSetting"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "_BsffToBsffFicheIntervention_AB_unique" ON "_BsffToBsffFicheIntervention"("A", "B");

-- CreateIndex
CREATE INDEX "_BsffToBsffFicheIntervention_B_index" ON "_BsffToBsffFicheIntervention"("B");

-- CreateIndex
CREATE INDEX "_BsddTransporterFormIdIdx" ON "BsddTransporter"("formId");

-- AddForeignKey
ALTER TABLE "AccessToken" ADD CONSTRAINT "AccessToken_application_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AccessToken" ADD CONSTRAINT "AccessToken_user_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_traderReceipt_fkey" FOREIGN KEY ("traderReceiptId") REFERENCES "TraderReceipt"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "company_brokerreceipt_fkey" FOREIGN KEY ("brokerReceiptId") REFERENCES "BrokerReceipt"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_transporterReceipt_fkey" FOREIGN KEY ("transporterReceiptId") REFERENCES "TransporterReceipt"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_vhuAgrementDemolisseurId_fkey" FOREIGN KEY ("vhuAgrementDemolisseurId") REFERENCES "VhuAgrement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_vhuAgrementBroyeurId_fkey" FOREIGN KEY ("vhuAgrementBroyeurId") REFERENCES "VhuAgrement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_workerCertificationId_fkey" FOREIGN KEY ("workerCertificationId") REFERENCES "WorkerCertification"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousCompanyRequest" ADD CONSTRAINT "AnonymousCompanyRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAssociation" ADD CONSTRAINT "CompanyAssociation_company_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "CompanyAssociation" ADD CONSTRAINT "CompanyAssociation_user_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SignatureAutomation" ADD CONSTRAINT "SignatureAutomation_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureAutomation" ADD CONSTRAINT "SignatureAutomation_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalOperation" ADD CONSTRAINT "FinalOperation_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_forwardedInId_fkey" FOREIGN KEY ("forwardedInId") REFERENCES "Form"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormGroupement" ADD CONSTRAINT "FormGroupement_nextFormId_fkey" FOREIGN KEY ("nextFormId") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormGroupement" ADD CONSTRAINT "FormGroupement_initialFormId_fkey" FOREIGN KEY ("initialFormId") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntermediaryFormAssociation" ADD CONSTRAINT "IntermediaryFormAssociation_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsddRevisionRequest" ADD CONSTRAINT "BsddRevisionRequest_bsddId_fkey" FOREIGN KEY ("bsddId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsddRevisionRequest" ADD CONSTRAINT "BsddRevisionRequest_authoringCompanyId_fkey" FOREIGN KEY ("authoringCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsddRevisionRequestApproval" ADD CONSTRAINT "BsddRevisionRequestApproval_revisionRequestId_fkey" FOREIGN KEY ("revisionRequestId") REFERENCES "BsddRevisionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_application_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_user_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MembershipRequest" ADD CONSTRAINT "MembershipRequest_company_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MembershipRequest" ADD CONSTRAINT "MembershipRequest_user_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "StatusLog" ADD CONSTRAINT "StatusLog_form_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "StatusLog" ADD CONSTRAINT "StatusLog_user_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "BsddTransporter" ADD CONSTRAINT "BsddTransporter_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_governmentAccountId_fkey" FOREIGN KEY ("governmentAccountId") REFERENCES "GovernmentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserResetPasswordHash" ADD CONSTRAINT "UserResetPasswordHash_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureFlag" ADD CONSTRAINT "FeatureFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bsdasri" ADD CONSTRAINT "Bsdasri_emissionSignatoryId_fkey" FOREIGN KEY ("emissionSignatoryId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bsdasri" ADD CONSTRAINT "Bsdasri_transportSignatoryId_fkey" FOREIGN KEY ("transportSignatoryId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bsdasri" ADD CONSTRAINT "Bsdasri_receptionSignatoryId_fkey" FOREIGN KEY ("receptionSignatoryId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bsdasri" ADD CONSTRAINT "Bsdasri_operationSignatoryId_fkey" FOREIGN KEY ("operationSignatoryId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bsdasri" ADD CONSTRAINT "Bsdasri_regroupedOnBsdasriId_fkey" FOREIGN KEY ("groupedInId") REFERENCES "Bsdasri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bsdasri" ADD CONSTRAINT "Bsdasri_synthesizedInId_fkey" FOREIGN KEY ("synthesizedInId") REFERENCES "Bsdasri"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsffPackaging" ADD CONSTRAINT "BsffPackaging_bsffId_fkey" FOREIGN KEY ("bsffId") REFERENCES "Bsff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsffPackaging" ADD CONSTRAINT "BsffPackaging_nextPackagingId_fkey" FOREIGN KEY ("nextPackagingId") REFERENCES "BsffPackaging"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bsda" ADD CONSTRAINT "Bsda_forwardingId_fkey" FOREIGN KEY ("forwardingId") REFERENCES "Bsda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bsda" ADD CONSTRAINT "Bsda_groupedInId_fkey" FOREIGN KEY ("groupedInId") REFERENCES "Bsda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsdaTransporter" ADD CONSTRAINT "BsdaTransporter_bsdaId_fkey" FOREIGN KEY ("bsdaId") REFERENCES "Bsda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsdaRevisionRequest" ADD CONSTRAINT "BsdaRevisionRequest_bsdaId_fkey" FOREIGN KEY ("bsdaId") REFERENCES "Bsda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsdaRevisionRequest" ADD CONSTRAINT "BsdaRevisionRequest_authoringCompanyId_fkey" FOREIGN KEY ("authoringCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BsdaRevisionRequestApproval" ADD CONSTRAINT "BsdaRevisionRequestApproval_revisionRequestId_fkey" FOREIGN KEY ("revisionRequestId") REFERENCES "BsdaRevisionRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntermediaryBsdaAssociation" ADD CONSTRAINT "IntermediaryBsdaAssociation_bsdaId_fkey" FOREIGN KEY ("bsdaId") REFERENCES "Bsda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BspaohTransporter" ADD CONSTRAINT "BspaohTransporter_bspaohId_fkey" FOREIGN KEY ("bspaohId") REFERENCES "Bspaoh"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BsffToBsffFicheIntervention" ADD CONSTRAINT "_BsffToBsffFicheIntervention_A_fkey" FOREIGN KEY ("A") REFERENCES "Bsff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BsffToBsffFicheIntervention" ADD CONSTRAINT "_BsffToBsffFicheIntervention_B_fkey" FOREIGN KEY ("B") REFERENCES "BsffFicheIntervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Manually add partial indexes
CREATE INDEX "_BsdaIsDeletedIdx" ON "Bsda" USING btree ("isDeleted") WHERE ("isDeleted" = true);
CREATE INDEX "_BsdaIsDraftIdx" ON "Bsda" USING btree ("isDraft") WHERE ("isDraft" = true);
CREATE INDEX "_BsdasriIsDeletedIdx" ON "Bsdasri" USING btree ("isDeleted") WHERE ("isDeleted" = true);
CREATE INDEX "_BsdasriIsDraftIdx" ON "Bsdasri" USING btree ("isDraft") WHERE ("isDraft" = true);
CREATE INDEX "_BsffIsDeletedIdx" ON "Bsff" USING btree ("isDeleted") WHERE ("isDeleted" = true);
CREATE INDEX "_BsffIsDraftIdx" ON "Bsff" USING btree ("isDraft") WHERE ("isDraft" = true);
CREATE INDEX "_BsffPackagingOperationNoTraceabilityIdx" ON "BsffPackaging" USING btree ("operationNoTraceability") WHERE ("operationNoTraceability" = true);
CREATE INDEX "_BsvhuIsDeletedIdx" ON "Bsvhu" USING btree ("isDeleted") WHERE ("isDeleted" = true);
CREATE INDEX "_BsvhuIsDraftIdx" ON "Bsvhu" USING btree ("isDraft") WHERE ("isDraft" = true);
CREATE INDEX "_FormIsDeletedIdx" ON "Form" USING btree ("isDeleted") WHERE ("isDeleted" = true);
CREATE INDEX "_FormRecipientIsTempStorageIdx" ON "Form" USING btree ("recipientIsTempStorage") WHERE ("recipientIsTempStorage" = true);