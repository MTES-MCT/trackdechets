-- Wrong table name & no need for readableId anymore
ALTER TABLE "default$default"."VhuForm" RENAME TO "Bsvhu";
ALTER TABLE "default$default"."Bsvhu" DROP COLUMN "readableId";

-- Rename enum
ALTER TYPE "default$default"."BsvhuRecipientType" RENAME TO "BsvhuDestinationType";

-- Recipient -> destination
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientType" TO "destinationType";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientOperationPlanned" TO "destinationPlannedOperationCode";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientAgrementNumber" TO "destinationAgrementNumber";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientCompanyName" TO "destinationCompanyName";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientCompanySiret" TO "destinationCompanySiret";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientCompanyAddress" TO "destinationCompanyAddress";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientCompanyContact" TO "destinationCompanyContact";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientCompanyPhone" TO "destinationCompanyPhone";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientCompanyMail" TO "destinationCompanyMail";

-- Emitter.emission
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "emitterSignatureAuthor" TO "emitterEmissionSignatureAuthor";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "emitterSignatureDate" TO "emitterEmissionSignatureDate";

-- Transporter
ALTER TABLE "default$default"."Bsvhu" ADD COLUMN "transporterTransportTakenOverAt" TIMESTAMP(3);
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "transporterTvaIntracommunautaire" TO "transporterCompanyVatNumber";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "transporterSignatureAuthor" TO "transporterTransportSignatureAuthor";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "transporterSignatureDate" TO "transporterTransportSignatureDate";

-- More destination changes
ALTER TABLE "default$default"."Bsvhu" ADD COLUMN "destinationOperationDate" TIMESTAMP(3);
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientOperationDone" TO "destinationOperationCode";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientPlannedBroyeurCompanyName" TO "destinationOperationNextDestinationCompanyName";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientPlannedBroyeurCompanySiret" TO "destinationOperationNextDestinationCompanySiret";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientPlannedBroyeurCompanyAddress" TO "destinationOperationNextDestinationCompanyAddress";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientPlannedBroyeurCompanyContact" TO "destinationOperationNextDestinationCompanyContact";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientPlannedBroyeurCompanyPhone" TO "destinationOperationNextDestinationCompanyPhone";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientPlannedBroyeurCompanyMail" TO "destinationOperationNextDestinationCompanyMail";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientSignatureAuthor" TO "destinationOperationSignatureAuthor";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientSignatureDate" TO "destinationOperationSignatureDate";
ALTER TABLE "default$default"."Bsvhu" ADD COLUMN "destinationReceptionQuantityNumber" INTEGER;
ALTER TABLE "default$default"."Bsvhu" ADD COLUMN "destinationReceptionQuantityTons" FLOAT;
ALTER TABLE "default$default"."Bsvhu" DROP COLUMN "recipientAcceptanceQuantity";
ALTER TABLE "default$default"."Bsvhu" ADD COLUMN "destinationReceptionDate" TIMESTAMP(3);
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientAcceptanceStatus" TO "destinationReceptionAcceptationStatus";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientAcceptanceRefusalReason" TO "destinationReceptionRefusalReason";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientAcceptanceIdentificationNumbers" TO "destinationReceptionIdentificationNumbers";
ALTER TABLE "default$default"."Bsvhu" RENAME COLUMN "recipientAcceptanceIdentificationType" TO "destinationReceptionIdentificationType";
