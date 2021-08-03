-- AlterTable - Broker
ALTER TABLE "default$default"."Bsda" ADD COLUMN "brokerCompanyName" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN "brokerCompanySiret" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN "brokerCompanyAddress" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN "brokerCompanyContact" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN "brokerCompanyPhone" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN "brokerCompanyMail" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN "brokerRecepisseNumber" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN "brokerRecepisseDepartment" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN "brokerRecepisseValidityLimit" TIMESTAMP(3);

-- AlterTable - Next destination, if required
ALTER TABLE "default$default"."Bsda" ADD COLUMN "destinationOperationNextDestinationCompanyName" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN "destinationOperationNextDestinationCompanySiret" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN "destinationOperationNextDestinationCompanyVatNumber" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN "destinationOperationNextDestinationCompanyAddress" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN "destinationOperationNextDestinationCompanyContact" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN "destinationOperationNextDestinationCompanyPhone" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN "destinationOperationNextDestinationCompanyMail" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN "destinationOperationNextDestinationCap" TEXT;
ALTER TABLE "default$default"."Bsda" ADD COLUMN "destinationOperationNextDestinationPlannedOperationCode" TEXT;

-- AlterTable - Transporter: exempted of recepisse, mode, plates & taken over date
ALTER TABLE "default$default"."Bsda" ADD COLUMN "transporterRecepisseIsExempted" BOOLEAN;
ALTER TABLE "default$default"."Bsda" ADD COLUMN "transporterTransportMode" "default$default"."TransportMode";
ALTER TABLE "default$default"."Bsda" ADD COLUMN "transporterTransportPlates" TEXT[];
ALTER TABLE "default$default"."Bsda" ADD COLUMN "transporterTransportTakenOverAt" TIMESTAMP(3);
