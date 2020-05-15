const identity = (v: any) => v || "";
const formatDate = (d: string | null) => (d ? d.slice(0, 10) : "");
const formatBoolean = (b: boolean | null) => {
  if (b === null) {
    return "";
  }
  return b ? "O" : "N";
};

export default {
  readableId: identity,
  customId: identity,
  // cadre 1
  emitterCompanySiret: identity,
  emitterCompanyName: identity,
  emitterCompanyContact: identity,
  emitterCompanyAddress: identity,
  emitterWorkSiteName: identity,
  emitterWorkSiteAddress: identity,
  // cadre 2
  recipientCompanySiret: identity,
  recipientCompanyName: identity,
  recipientCompanyAddress: identity,
  recipientCompanyMail: identity,
  recipientProcessingOperation: identity,
  // cadre 3 à 6
  wasteDetailsCode: identity,
  wasteDetailsQuantity: identity,
  // cadre 7
  traderReceipt: identity,
  traderValidityLimit: formatDate,
  // cadre 8
  transporterCompanySiret: identity,
  transporterCompanyName: identity,
  transporterCompanyAddress: identity,
  transporterIsExemptedOfReceipt: formatBoolean,
  transporterReceipt: identity,
  transporterValidityLimit: formatDate,
  transporterNumberPlate: identity,
  sentAt: formatDate,
  // cadre 10
  receivedAt: formatDate,
  isAccepted: formatBoolean,
  // cadre 11
  processingOperationDone: identity,
  noTraceability: formatBoolean,
  // cadre 14
  temporaryStorageDestinationCompanySiret: identity,
  temporaryStorageDestinationCompanyName: identity,
  temporaryStorageDetailCompanyAddress: identity
};
