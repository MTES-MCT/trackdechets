import { Bsdasri, BsdasriStatus, BsdasriType } from "@prisma/client";
type BsdasriField = keyof Bsdasri;
export const fieldsAllowedForUpdateOnceReceived: BsdasriField[] = [
  "destinationOperationCode",
  "destinationOperationDate",
  "destinationReceptionWasteWeightValue"
];

export const fieldsAllowedForUpdateOnceSent: BsdasriField[] = fieldsAllowedForUpdateOnceReceived.concat(
  [
    "destinationCompanyName",
    "destinationCompanySiret",
    "destinationCompanyAddress",
    "destinationCompanyContact",
    "destinationCompanyPhone",
    "destinationCompanyMail",
    "destinationCustomInfo",
    "destinationWastePackagings",
    "destinationReceptionAcceptationStatus",
    "destinationReceptionWasteRefusalReason",
    "destinationReceptionWasteRefusedWeightValue",
    "destinationReceptionWasteVolume",
    "destinationReceptionDate",
    "identificationNumbers",
    "handedOverToRecipientAt" // optional field to be filled by transporter once waste is received
  ]
);
export const fieldsAllowedForUpdateOnceSignedByEmitter: BsdasriField[] = fieldsAllowedForUpdateOnceSent.concat(
  [
    "transporterCompanyName",
    "transporterCompanySiret",
    "transporterCompanyVatNumber",
    "transporterCompanyAddress",
    "transporterCompanyPhone",
    "transporterCompanyContact",
    "transporterCompanyMail",
    "transporterCompanyVatNumber",
    "transporterRecepisseNumber",
    "transporterRecepisseDepartment",
    "transporterRecepisseValidityLimit",
    "transporterAcceptationStatus",
    "transporterWasteRefusalReason",
    "transporterWasteRefusedWeightValue",
    "transporterTakenOverAt",
    "transporterWastePackagings",
    "transporterWasteWeightValue",
    "transporterWasteWeightIsEstimate",
    "transporterWasteVolume",
    "handedOverToRecipientAt",
    "transporterCustomInfo",
    "transporterTransportMode",
    "transporterTransportPlates"
  ]
);
export const synthesisInitialFieldsAllowedForUpdate: BsdasriField[] = fieldsAllowedForUpdateOnceSent.concat(
  [
    //  transporterCompanySiret  & transporterCompanyVatNumber are not editable
    "wasteCode",
    "wasteAdr",
    // emitter fields are copied from the transporter input in the resolver
    "emitterWastePackagings",
    "emitterWasteVolume",
    "transporterCompanyName",
    "emitterCompanyAddress",
    "emitterCompanyPhone",
    "emitterCompanyContact",
    "emitterCompanyMail",
    // "transporterCompanyVatNumber",
    "transporterCompanyName",
    "transporterCompanyAddress",
    "transporterCompanyPhone",
    "transporterCompanyContact",
    "transporterCompanyMail",
    "transporterRecepisseNumber",
    "transporterRecepisseDepartment",
    "transporterRecepisseValidityLimit",
    "transporterAcceptationStatus",
    "transporterWasteRefusalReason",
    "transporterWasteRefusedWeightValue",
    "transporterTakenOverAt",
    "transporterWastePackagings",
    "transporterWasteWeightValue",
    "transporterWasteWeightIsEstimate",
    "transporterWasteVolume",
    "handedOverToRecipientAt",
    "transporterCustomInfo",
    "transporterTransportMode",
    "transporterTransportPlates"
  ]
);

export const getFieldsAllorwedForUpdate = (bsdasri: Bsdasri) => {
  const allowedFields = {
    [BsdasriStatus.SIGNED_BY_PRODUCER]: fieldsAllowedForUpdateOnceSignedByEmitter,
    [BsdasriStatus.SENT]: fieldsAllowedForUpdateOnceSent,
    [BsdasriStatus.RECEIVED]: fieldsAllowedForUpdateOnceReceived,
    [BsdasriStatus.PROCESSED]: []
  };

  const allowedSynthesisFields = {
    [BsdasriStatus.INITIAL]: synthesisInitialFieldsAllowedForUpdate,
    [BsdasriStatus.SENT]: fieldsAllowedForUpdateOnceSent,
    [BsdasriStatus.RECEIVED]: fieldsAllowedForUpdateOnceReceived,
    [BsdasriStatus.PROCESSED]: []
  };
  return bsdasri.type === BsdasriType.SYNTHESIS
    ? allowedSynthesisFields[bsdasri.status]
    : allowedFields[bsdasri.status];
};
