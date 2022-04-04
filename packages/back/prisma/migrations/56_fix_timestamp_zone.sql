-- Fix hours & date globaly
-- => Convert timestamp to timestampz
--     Before converting, we must fix the timezone padding caused by our front ent sending X-1/X/X 23:00 instead of X/X/X 00:00 (when at +1)
--     So we add 2h to every timestamp where the time is 22:00, and 1h to those where it's 23:00.
--     This way, when striping the time and keeping only the date we will have the right value.
--     Note that there IS a risk for dates that would have meaningfully been set to 22:00 or 23:00.

-- Add hours for future dates
-- +1 => 10/01/01 at 23:00 becomes 11/01/01 at 00:00. Truncated to date type it will be 11/01/01
UPDATE "default$default"."Form" SET "transporterValidityLimit" = "transporterValidityLimit" + interval '1h' where to_char("transporterValidityLimit", 'HH24:MI') = '23:00';
UPDATE "default$default"."Form" SET "sentAt" = "sentAt" + interval '1h' where to_char("sentAt", 'HH24:MI') = '23:00';
UPDATE "default$default"."Form" SET "receivedAt" = "receivedAt" + interval '1h' where to_char("receivedAt", 'HH24:MI') = '23:00';
UPDATE "default$default"."Form" SET "processedAt" = "processedAt" + interval '1h' where to_char("processedAt", 'HH24:MI') = '23:00';
UPDATE "default$default"."Form" SET "traderValidityLimit" = "traderValidityLimit" + interval '1h' where to_char("traderValidityLimit", 'HH24:MI') = '23:00';
UPDATE "default$default"."Form" SET "brokerValidityLimit" = "brokerValidityLimit" + interval '1h' where to_char("brokerValidityLimit", 'HH24:MI') = '23:00';

UPDATE "default$default"."BsddRevisionRequest" SET "traderValidityLimit" = "traderValidityLimit" + interval '1h' where to_char("traderValidityLimit", 'HH24:MI') = '23:00';
UPDATE "default$default"."BsddRevisionRequest" SET "brokerValidityLimit" = "brokerValidityLimit" + interval '1h' where to_char("brokerValidityLimit", 'HH24:MI') = '23:00';

UPDATE "default$default"."TemporaryStorageDetail" SET "tempStorerReceivedAt" = "tempStorerReceivedAt" + interval '1h' where to_char("tempStorerReceivedAt", 'HH24:MI') = '23:00';
UPDATE "default$default"."TemporaryStorageDetail" SET "transporterValidityLimit" = "transporterValidityLimit" + interval '1h' where to_char("transporterValidityLimit", 'HH24:MI') = '23:00';

UPDATE "default$default"."TraderReceipt" SET "validityLimit" = "validityLimit" + interval '1h' where to_char("validityLimit", 'HH24:MI') = '23:00';

UPDATE "default$default"."BrokerReceipt" SET "validityLimit" = "validityLimit" + interval '1h' where to_char("validityLimit", 'HH24:MI') = '23:00';

UPDATE "default$default"."TransporterReceipt" SET "validityLimit" = "validityLimit" + interval '1h' where to_char("validityLimit", 'HH24:MI') = '23:00';

UPDATE "default$default"."TransportSegment" SET "transporterValidityLimit" = "transporterValidityLimit" + interval '1h' where to_char("transporterValidityLimit", 'HH24:MI') = '23:00';
UPDATE "default$default"."TransportSegment" SET "takenOverAt" = "takenOverAt" + interval '1h' where to_char("takenOverAt", 'HH24:MI') = '23:00';

UPDATE "default$default"."Bsvhu" SET "transporterRecepisseValidityLimit" = "transporterRecepisseValidityLimit" + interval '1h' where to_char("transporterRecepisseValidityLimit", 'HH24:MI') = '23:00';
UPDATE "default$default"."Bsvhu" SET "transporterTransportTakenOverAt" = "transporterTransportTakenOverAt" + interval '1h' where to_char("transporterTransportTakenOverAt", 'HH24:MI') = '23:00';
UPDATE "default$default"."Bsvhu" SET "destinationReceptionDate" = "destinationReceptionDate" + interval '1h' where to_char("destinationReceptionDate", 'HH24:MI') = '23:00';
UPDATE "default$default"."Bsvhu" SET "destinationOperationDate" = "destinationOperationDate" + interval '1h' where to_char("destinationOperationDate", 'HH24:MI') = '23:00';

UPDATE "default$default"."Bsdasri" SET "transporterRecepisseValidityLimit" = "transporterRecepisseValidityLimit" + interval '1h' where to_char("transporterRecepisseValidityLimit", 'HH24:MI') = '23:00';
UPDATE "default$default"."Bsdasri" SET "transporterTakenOverAt" = "transporterTakenOverAt" + interval '1h' where to_char("transporterTakenOverAt", 'HH24:MI') = '23:00';
UPDATE "default$default"."Bsdasri" SET "handedOverToRecipientAt" = "handedOverToRecipientAt" + interval '1h' where to_char("handedOverToRecipientAt", 'HH24:MI') = '23:00';
UPDATE "default$default"."Bsdasri" SET "destinationReceptionDate" = "destinationReceptionDate" + interval '1h' where to_char("destinationReceptionDate", 'HH24:MI') = '23:00';
UPDATE "default$default"."Bsdasri" SET "destinationOperationDate" = "destinationOperationDate" + interval '1h' where to_char("destinationOperationDate", 'HH24:MI') = '23:00';

UPDATE "default$default"."Bsff" SET "transporterRecepisseValidityLimit" = "transporterRecepisseValidityLimit" + interval '1h' where to_char("transporterRecepisseValidityLimit", 'HH24:MI') = '23:00';
UPDATE "default$default"."Bsff" SET "transporterTransportTakenOverAt" = "transporterTransportTakenOverAt" + interval '1h' where to_char("transporterTransportTakenOverAt", 'HH24:MI') = '23:00';
UPDATE "default$default"."Bsff" SET "destinationReceptionDate" = "destinationReceptionDate" + interval '1h' where to_char("destinationReceptionDate", 'HH24:MI') = '23:00';

UPDATE "default$default"."Bsda" SET "brokerRecepisseValidityLimit" = "brokerRecepisseValidityLimit" + interval '1h' where to_char("brokerRecepisseValidityLimit", 'HH24:MI') = '23:00';
UPDATE "default$default"."Bsda" SET "destinationReceptionDate" = "destinationReceptionDate" + interval '1h' where to_char("destinationReceptionDate", 'HH24:MI') = '23:00';
UPDATE "default$default"."Bsda" SET "destinationOperationDate" = "destinationOperationDate" + interval '1h' where to_char("destinationOperationDate", 'HH24:MI') = '23:00';
UPDATE "default$default"."Bsda" SET "transporterRecepisseValidityLimit" = "transporterRecepisseValidityLimit" + interval '1h' where to_char("transporterRecepisseValidityLimit", 'HH24:MI') = '23:00';
UPDATE "default$default"."Bsda" SET "transporterTransportTakenOverAt" = "transporterTransportTakenOverAt" + interval '1h' where to_char("transporterTransportTakenOverAt", 'HH24:MI') = '23:00';

-- +2 => 10/01/01 at 22:00 becomes 11/01/01 at 00:00. Truncated to date type it will be 11/01/01
UPDATE "default$default"."Form" SET "transporterValidityLimit" = "transporterValidityLimit" + interval '1h' * 2 where to_char("transporterValidityLimit", 'HH24:MI') = '22:00';
UPDATE "default$default"."Form" SET "sentAt" = "sentAt" + interval '1h' * 2 where to_char("sentAt", 'HH24:MI') = '22:00';
UPDATE "default$default"."Form" SET "receivedAt" = "receivedAt" + interval '1h' * 2 where to_char("receivedAt", 'HH24:MI') = '22:00';
UPDATE "default$default"."Form" SET "processedAt" = "processedAt" + interval '1h' * 2 where to_char("processedAt", 'HH24:MI') = '22:00';
UPDATE "default$default"."Form" SET "traderValidityLimit" = "traderValidityLimit" + interval '1h' * 2 where to_char("traderValidityLimit", 'HH24:MI') = '22:00';
UPDATE "default$default"."Form" SET "brokerValidityLimit" = "brokerValidityLimit" + interval '1h' * 2 where to_char("brokerValidityLimit", 'HH24:MI') = '22:00';

UPDATE "default$default"."BsddRevisionRequest" SET "traderValidityLimit" = "traderValidityLimit" + interval '1h' * 2 where to_char("traderValidityLimit", 'HH24:MI') = '22:00';
UPDATE "default$default"."BsddRevisionRequest" SET "brokerValidityLimit" = "brokerValidityLimit" + interval '1h' * 2 where to_char("brokerValidityLimit", 'HH24:MI') = '22:00';

UPDATE "default$default"."TemporaryStorageDetail" SET "tempStorerReceivedAt" = "tempStorerReceivedAt" + interval '1h' * 2 where to_char("tempStorerReceivedAt", 'HH24:MI') = '22:00';
UPDATE "default$default"."TemporaryStorageDetail" SET "transporterValidityLimit" = "transporterValidityLimit" + interval '1h' * 2 where to_char("transporterValidityLimit", 'HH24:MI') = '22:00';

UPDATE "default$default"."TraderReceipt" SET "validityLimit" = "validityLimit" + interval '1h' * 2 where to_char("validityLimit", 'HH24:MI') = '22:00';

UPDATE "default$default"."BrokerReceipt" SET "validityLimit" = "validityLimit" + interval '1h' * 2 where to_char("validityLimit", 'HH24:MI') = '22:00';

UPDATE "default$default"."TransporterReceipt" SET "validityLimit" = "validityLimit" + interval '1h' * 2 where to_char("validityLimit", 'HH24:MI') = '22:00';

UPDATE "default$default"."TransportSegment" SET "transporterValidityLimit" = "transporterValidityLimit" + interval '1h' * 2 where to_char("transporterValidityLimit", 'HH24:MI') = '22:00';
UPDATE "default$default"."TransportSegment" SET "takenOverAt" = "takenOverAt" + interval '1h' * 2 where to_char("takenOverAt", 'HH24:MI') = '22:00';

UPDATE "default$default"."Bsvhu" SET "transporterRecepisseValidityLimit" = "transporterRecepisseValidityLimit" + interval '1h' * 2 where to_char("transporterRecepisseValidityLimit", 'HH24:MI') = '22:00';
UPDATE "default$default"."Bsvhu" SET "transporterTransportTakenOverAt" = "transporterTransportTakenOverAt" + interval '1h' * 2 where to_char("transporterTransportTakenOverAt", 'HH24:MI') = '22:00';
UPDATE "default$default"."Bsvhu" SET "destinationReceptionDate" = "destinationReceptionDate" + interval '1h' * 2 where to_char("destinationReceptionDate", 'HH24:MI') = '22:00';
UPDATE "default$default"."Bsvhu" SET "destinationOperationDate" = "destinationOperationDate" + interval '1h' * 2 where to_char("destinationOperationDate", 'HH24:MI') = '22:00';

UPDATE "default$default"."Bsdasri" SET "transporterRecepisseValidityLimit" = "transporterRecepisseValidityLimit" + interval '1h' * 2 where to_char("transporterRecepisseValidityLimit", 'HH24:MI') = '22:00';
UPDATE "default$default"."Bsdasri" SET "transporterTakenOverAt" = "transporterTakenOverAt" + interval '1h' * 2 where to_char("transporterTakenOverAt", 'HH24:MI') = '22:00';
UPDATE "default$default"."Bsdasri" SET "handedOverToRecipientAt" = "handedOverToRecipientAt" + interval '1h' * 2 where to_char("handedOverToRecipientAt", 'HH24:MI') = '22:00';
UPDATE "default$default"."Bsdasri" SET "destinationReceptionDate" = "destinationReceptionDate" + interval '1h' * 2 where to_char("destinationReceptionDate", 'HH24:MI') = '22:00';
UPDATE "default$default"."Bsdasri" SET "destinationOperationDate" = "destinationOperationDate" + interval '1h' * 2 where to_char("destinationOperationDate", 'HH24:MI') = '22:00';

UPDATE "default$default"."Bsff" SET "transporterRecepisseValidityLimit" = "transporterRecepisseValidityLimit" + interval '1h' * 2 where to_char("transporterRecepisseValidityLimit", 'HH24:MI') = '22:00';
UPDATE "default$default"."Bsff" SET "transporterTransportTakenOverAt" = "transporterTransportTakenOverAt" + interval '1h' * 2 where to_char("transporterTransportTakenOverAt", 'HH24:MI') = '22:00';
UPDATE "default$default"."Bsff" SET "destinationReceptionDate" = "destinationReceptionDate" + interval '1h' * 2 where to_char("destinationReceptionDate", 'HH24:MI') = '22:00';

UPDATE "default$default"."Bsda" SET "brokerRecepisseValidityLimit" = "brokerRecepisseValidityLimit" + interval '1h' * 2 where to_char("brokerRecepisseValidityLimit", 'HH24:MI') = '22:00';
UPDATE "default$default"."Bsda" SET "destinationReceptionDate" = "destinationReceptionDate" + interval '1h' * 2 where to_char("destinationReceptionDate", 'HH24:MI') = '22:00';
UPDATE "default$default"."Bsda" SET "destinationOperationDate" = "destinationOperationDate" + interval '1h' * 2 where to_char("destinationOperationDate", 'HH24:MI') = '22:00';
UPDATE "default$default"."Bsda" SET "transporterRecepisseValidityLimit" = "transporterRecepisseValidityLimit" + interval '1h' * 2 where to_char("transporterRecepisseValidityLimit", 'HH24:MI') = '22:00';
UPDATE "default$default"."Bsda" SET "transporterTransportTakenOverAt" = "transporterTransportTakenOverAt" + interval '1h' * 2 where to_char("transporterTransportTakenOverAt", 'HH24:MI') = '22:00';

-- Alter types
-- Use timezone UTC as we use toISOString() everywhere (The timezone is always zero UTC offset, as denoted by the suffix "Z")

ALTER TABLE "default$default"."AccessToken" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."AccessToken" ALTER "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."AccessToken" ALTER "lastUsed" TYPE timestamptz USING "lastUsed" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."Application" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Application" ALTER "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."Company" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Company" ALTER "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Company" ALTER "verifiedAt" TYPE timestamptz USING "verifiedAt" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."Form" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Form" ALTER "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Form" ALTER "transporterValidityLimit" TYPE timestamptz USING "transporterValidityLimit" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Form" ALTER "sentAt" TYPE timestamptz USING "sentAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Form" ALTER "receivedAt" TYPE timestamptz USING "receivedAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Form" ALTER "processedAt" TYPE timestamptz USING "processedAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Form" ALTER "traderValidityLimit" TYPE timestamptz USING "traderValidityLimit" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Form" ALTER "brokerValidityLimit" TYPE timestamptz USING "brokerValidityLimit" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Form" ALTER "signedAt" TYPE timestamptz USING "signedAt" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."BsddRevisionRequest" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."BsddRevisionRequest" ALTER "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."BsddRevisionRequest" ALTER "traderValidityLimit" TYPE timestamptz USING "traderValidityLimit" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."BsddRevisionRequest" ALTER "brokerValidityLimit" TYPE timestamptz USING "brokerValidityLimit" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."BsddRevisionRequestApproval" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."BsddRevisionRequestApproval" ALTER "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."Grant" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Grant" ALTER "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."MembershipRequest" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."MembershipRequest" ALTER "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."StatusLog" ALTER "loggedAt" TYPE timestamptz USING "loggedAt" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."TemporaryStorageDetail" ALTER "tempStorerReceivedAt" TYPE timestamptz USING "tempStorerReceivedAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."TemporaryStorageDetail" ALTER "tempStorerSignedAt" TYPE timestamptz USING "tempStorerSignedAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."TemporaryStorageDetail" ALTER "transporterValidityLimit" TYPE timestamptz USING "transporterValidityLimit" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."TemporaryStorageDetail" ALTER "signedAt" TYPE timestamptz USING "signedAt" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."TraderReceipt" ALTER "validityLimit" TYPE timestamptz USING "validityLimit" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."BrokerReceipt" ALTER "validityLimit" TYPE timestamptz USING "validityLimit" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."TransporterReceipt" ALTER "validityLimit" TYPE timestamptz USING "validityLimit" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."TransportSegment" ALTER "transporterValidityLimit" TYPE timestamptz USING "transporterValidityLimit" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."TransportSegment" ALTER "takenOverAt" TYPE timestamptz USING "takenOverAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."TransportSegment" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."TransportSegment" ALTER "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."User" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."User" ALTER "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."User" ALTER "activatedAt" TYPE timestamptz USING "activatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."User" ALTER "firstAssociationDate" TYPE timestamptz USING "firstAssociationDate" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."UserAccountHash" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."UserAccountHash" ALTER "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."UserAccountHash" ALTER "acceptedAt" TYPE timestamptz USING "acceptedAt" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."UserActivationHash" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."UserActivationHash" ALTER "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."UserResetPasswordHash" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."UserResetPasswordHash" ALTER "hashExpires" TYPE timestamptz USING "hashExpires" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."Bsvhu" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsvhu" ALTER "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsvhu" ALTER "emitterEmissionSignatureDate" TYPE timestamptz USING "emitterEmissionSignatureDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsvhu" ALTER "transporterRecepisseValidityLimit" TYPE timestamptz USING "transporterRecepisseValidityLimit" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsvhu" ALTER "transporterTransportTakenOverAt" TYPE timestamptz USING "transporterTransportTakenOverAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsvhu" ALTER "transporterTransportSignatureDate" TYPE timestamptz USING "transporterTransportSignatureDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsvhu" ALTER "destinationReceptionDate" TYPE timestamptz USING "destinationReceptionDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsvhu" ALTER "destinationOperationDate" TYPE timestamptz USING "destinationOperationDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsvhu" ALTER "destinationOperationSignatureDate" TYPE timestamptz USING "destinationOperationSignatureDate" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."Bsdasri" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsdasri" ALTER "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsdasri" ALTER "emitterEmissionSignatureDate" TYPE timestamptz USING "emitterEmissionSignatureDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsdasri" ALTER "transporterRecepisseValidityLimit" TYPE timestamptz USING "transporterRecepisseValidityLimit" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsdasri" ALTER "transporterTakenOverAt" TYPE timestamptz USING "transporterTakenOverAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsdasri" ALTER "handedOverToRecipientAt" TYPE timestamptz USING "handedOverToRecipientAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsdasri" ALTER "transporterTransportSignatureDate" TYPE timestamptz USING "transporterTransportSignatureDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsdasri" ALTER "destinationReceptionDate" TYPE timestamptz USING "destinationReceptionDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsdasri" ALTER "destinationOperationDate" TYPE timestamptz USING "destinationOperationDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsdasri" ALTER "destinationReceptionSignatureDate" TYPE timestamptz USING "destinationReceptionSignatureDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsdasri" ALTER "destinationOperationSignatureDate" TYPE timestamptz USING "destinationOperationSignatureDate" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."Bsff" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsff" ALTER "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsff" ALTER "emitterEmissionSignatureDate" TYPE timestamptz USING "emitterEmissionSignatureDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsff" ALTER "transporterRecepisseValidityLimit" TYPE timestamptz USING "transporterRecepisseValidityLimit" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsff" ALTER "transporterTransportTakenOverAt" TYPE timestamptz USING "transporterTransportTakenOverAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsff" ALTER "transporterTransportSignatureDate" TYPE timestamptz USING "transporterTransportSignatureDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsff" ALTER "destinationReceptionDate" TYPE timestamptz USING "destinationReceptionDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsff" ALTER "destinationReceptionSignatureDate" TYPE timestamptz USING "destinationReceptionSignatureDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsff" ALTER "destinationOperationSignatureDate" TYPE timestamptz USING "destinationOperationSignatureDate" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."BsffFicheIntervention" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."BsffFicheIntervention" ALTER "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE "default$default"."Bsda" ALTER "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsda" ALTER "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsda" ALTER "emitterEmissionSignatureDate" TYPE timestamptz USING "emitterEmissionSignatureDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsda" ALTER "brokerRecepisseValidityLimit" TYPE timestamptz USING "brokerRecepisseValidityLimit" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsda" ALTER "destinationReceptionDate" TYPE timestamptz USING "destinationReceptionDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsda" ALTER "destinationOperationDate" TYPE timestamptz USING "destinationOperationDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsda" ALTER "destinationOperationSignatureDate" TYPE timestamptz USING "destinationOperationSignatureDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsda" ALTER "transporterRecepisseValidityLimit" TYPE timestamptz USING "transporterRecepisseValidityLimit" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsda" ALTER "transporterTransportTakenOverAt" TYPE timestamptz USING "transporterTransportTakenOverAt" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsda" ALTER "transporterTransportSignatureDate" TYPE timestamptz USING "transporterTransportSignatureDate" AT TIME ZONE 'UTC';
ALTER TABLE "default$default"."Bsda" ALTER "workerWorkSignatureDate" TYPE timestamptz USING "workerWorkSignatureDate" AT TIME ZONE 'UTC';