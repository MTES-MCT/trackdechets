-- Wrong table name & no need for readableId anymore
ALTER TABLE "default$default"."VhuForm" RENAME TO "default$default"."BsvhuForm";
ALTER TABLE "default$default"."BsvhuForm" DROP COLUMN "readableId";

-- Rename enum
ALTER TYPE "default$default"."BsvhuRecipientType" RENAME TO "default$default"."BsvhuDestinationType";

-- Recipient -> destination
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientType" TO "destinationType"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientOperationPlanned" TO "destinationPlannedOperationCode"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientAgrementNumber" TO "destinationAgrementNumber"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientCompanyName" TO "destinationCompanyName"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientCompanySiret" TO "destinationCompanySiret"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientCompanyAddress" TO "destinationCompanyAddress"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientCompanyContact" TO "destinationCompanyContact"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientCompanyPhone" TO "destinationCompanyPhone"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientCompanyMail" TO "destinationCompanyMail"

-- Emitter.emission
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "emitterSignatureAuthor" TO "emitterEmissionSignatureAuthor"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "emitterSignatureDate" TO "emitterEmissionSignatureDate"

-- Transporter
ALTER TABLE "default$default"."BsvhuForm" ADD COLUMN "transporterTransportTakenOverAt" TIMESTAMP(3)
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "transporterTvaIntracommunautaire" TO "transporterCompanyVatNumber"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "transporterSignatureAuthor" TO "transporterTransportSignatureAuthor"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "transporterSignatureDate" TO "transporterTransportSignatureDate"

-- More destination changes
ALTER TABLE "default$default"."BsvhuForm" ADD COLUMN "destinationOperationDate" TIMESTAMP(3)
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientOperationDone" TO "destinationOperationCode"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientPlannedBroyeurCompanyName" TO "destinationOperationNextDestinationCompanyName"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientPlannedBroyeurCompanySiret" TO "destinationOperationNextDestinationCompanySiret"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientPlannedBroyeurCompanyAddress" TO "destinationOperationNextDestinationCompanyAddress"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientPlannedBroyeurCompanyContact" TO "destinationOperationNextDestinationCompanyContact"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientPlannedBroyeurCompanyPhone" TO "destinationOperationNextDestinationCompanyPhone"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientPlannedBroyeurCompanyMail" TO "destinationOperationNextDestinationCompanyMail"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientSignatureAuthor" TO "destinationOperationSignatureAuthor"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientSignatureDate" TO "destinationOperationSignatureDate"
ALTER TABLE "default$default"."BsvhuForm" ADD COLUMN "destinationReceptionQuantityNumber" INTEGER
ALTER TABLE "default$default"."BsvhuForm" ADD COLUMN "destinationReceptionQuantityTons" FLOAT
ALTER TABLE "default$default"."BsvhuForm" DROP COLUMN "recipientAcceptanceQuantity";
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientAcceptanceStatus" TO "destinationReceptionAcceptationStatus"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientAcceptanceRefusalReason" TO "destinationReceptionRefusalReason"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientAcceptanceIdentificationNumbers" TO "destinationReceptionIdentificationNumbers"
ALTER TABLE "default$default"."BsvhuForm" RENAME COLUMN "recipientAcceptanceIdentificationType" TO "destinationReceptionIdentificationType"