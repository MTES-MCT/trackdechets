ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "bsdasriType" TO "type";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "emissionSignatureAuthor" TO "emitterEmissionSignatureAuthor";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "emissionSignatureDate" TO "emitterEmissionSignatureDate";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "wasteDetailsCode" TO "wasteCode";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "wasteDetailsOnuCode" TO "wasteAdr";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "transporterReceipt" TO "transporterRecepisseNumber";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "transporterReceiptDepartment" TO "transporterRecepisseDepartment";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "transporterReceiptValidityLimit" TO "transporterRecepisseValidityLimit";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "transportMode" TO "transporterTransportMode";
ALTER TABLE "default$default"."Bsdasri"
RENAME COLUMN "transportSignatureDate" TO "transporterTransportSignatureDate";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "transportSignatureAuthor" TO "transporterTransportSignatureAuthor";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "recipientCompanyName" TO "destinationCompanyName";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "recipientCompanySiret" TO "destinationCompanySiret";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "recipientCompanyAddress" TO "destinationCompanyAddress";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "recipientCompanyContact" TO "destinationCompanyContact";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "recipientCompanyPhone" TO "destinationCompanyPhone";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "recipientCompanyMail" TO "destinationCompanyMail";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "recipientCustomInfo" TO "destinationCustomInfo";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "recipientWastePackagingsInfo" TO "destinationWastePackagings";
ALTER TABLE "default$default"."Bsdasri"
   RENAME COLUMN "emitterWastePackagingsInfo" TO "emitterWastePackagings";
ALTER TABLE "default$default"."Bsdasri"
   RENAME COLUMN "transporterWastePackagingsInfo" TO "transporterWastePackagings";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "recipientWasteAcceptationStatus" TO "destinationReceptionWasteAcceptationStatus";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "recipientWasteRefusalReason" TO "destinationReceptionWasteRefusalReason";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "recipientWasteRefusedQuantity" TO "destinationReceptionWasteRefusedQuantity";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "recipientWasteVolume" TO "destinationReceptionWasteVolume";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "receivedAt" TO "destinationReceptionDate";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "processingOperation" TO "destinationOperationCode";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "processedAt" TO "destinationOperationDate";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "operationSignatureDate" TO "destinationOperationSignatureDate";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "operationSignatureAuthor" TO "destinationOperationSignatureAuthor";
 ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "receptionSignatureDate" TO "destinationReceptionSignatureDate";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "receptionSignatureAuthor" TO "destinationReceptionSignatureAuthor";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "recipientWasteQuantity" TO "destinationReceptionWasteQuantity";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "transporterWasteAcceptationStatus" TO "transporterAcceptationStatus";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "destinationReceptionWasteAcceptationStatus" TO "destinationReceptionAcceptationStatus";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "emitterWorkSiteName" TO "emitterPickupSiteName";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "emitterWorkSiteAddress" TO "emitterPickupSiteAddress";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "emitterWorkSiteCity" TO "emitterPickupSiteCity";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "emitterWorkSitePostalCode" TO "emitterPickupSitePostalCode";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "emitterWorkSiteInfos" TO "emitterPickupSiteInfos";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "emitterWasteQuantity" TO "emitterWasteWeightValue";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "transporterWasteRefusedQuantity" TO "transporterWasteRefusedWeightValue";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "transporterWasteQuantity" TO "transporterWasteWeightValue";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "destinationReceptionWasteRefusedQuantity" TO "destinationReceptionWasteRefusedWeightValue";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "destinationReceptionWasteQuantity" TO "destinationReceptionWasteWeightValue";
ALTER TABLE "default$default"."Bsdasri"
  RENAME COLUMN "regroupedOnBsdasriId" TO "groupedInId";
ALTER TABLE "default$default"."Bsdasri"  
  ADD "emitterWasteWeightIsEstimate" BOOLEAN,
  ADD "transporterWasteWeightIsEstimate" BOOLEAN,
  ADD "ecoOrganismeName" TEXT,
  ADD "ecoOrganismeSiret" TEXT;                   
UPDATE  "default$default"."Bsdasri" SET "emitterWasteWeightIsEstimate" = (CASE 
  WHEN "emitterWasteQuantityType" = E'ESTIMATED' 
then true
  WHEN "emitterWasteQuantityType" = E'REAL' 
then false
END
);
UPDATE  "default$default"."Bsdasri" SET "transporterWasteWeightIsEstimate" = (CASE 
  WHEN "transporterWasteQuantityType" = E'ESTIMATED' 
then true
  WHEN "transporterWasteQuantityType" = E'REAL' 
then false
END
); 
ALTER TABLE "default$default"."Bsdasri"
  DROP COLUMN "emitterWasteQuantityType",
  DROP COLUMN "transporterWasteQuantityType",
  DROP COLUMN "ownerId",
  DROP COLUMN "emitterType",
  DROP COLUMN "emitterOnBehalfOfEcoorganisme",
  DROP COLUMN "handedOverToTransporterAt";
