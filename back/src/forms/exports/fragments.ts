import { FormsRegisterExportType } from "../../generated/graphql/types";

/**
 * Returns Form fragment for each export
 */
export function formFragment(exportType: FormsRegisterExportType) {
  return {
    OUTGOING: outgoingWasteFragment,
    INCOMING: incomingWasteFragment,
    TRANSPORTED: transportedWasteFragment,
    TRADED: tradedWasteFragment,
    ALL: allWasteFragment
  }[exportType];
}

const outgoingWasteFragment = `
  fragment OutgoingWasteFrom on Form {
    readableId
    customId
    emitterWorkSiteName
    emitterWorkSiteAddress
    recipientCompanySiret
    recipientCompanyName
    recipientCompanyAddress
    recipientCompanyMail
    recipientProcessingOperation
    processingOperationDone
    wasteDetailsCode
    wasteDetailsQuantity
    transporterCompanySiret
    transporterCompanyName
    transporterCompanyAddress
    transporterIsExemptedOfReceipt
    transporterReceipt
    transporterValidityLimit
    transporterNumberPlate
    sentAt
  }
`;

const incomingWasteFragment = `
  fragment OutgoingWasteFrom on Form {
    readableId
    customId
    emitterCompanySiret
    emitterCompanyName
    emitterCompanyContact
    emitterCompanyAddress
    emitterWorkSiteName
    emitterWorkSiteAddress
    recipientProcessingOperation
    wasteDetailsCode
    wasteDetailsQuantity
    transporterCompanySiret
    transporterCompanyName
    transporterCompanyAddress
    transporterIsExemptedOfReceipt
    transporterReceipt
    transporterValidityLimit
    transporterNumberPlate
    processingOperationDone
    receivedAt
    isAccepted
  }
`;
const transportedWasteFragment = `
  fragment OutgoingWasteFrom on Form {
    readableId
    customId
    emitterCompanySiret
    emitterCompanyName
    emitterCompanyContact
    emitterCompanyAddress
    emitterWorkSiteName
    emitterWorkSiteAddress
    recipientCompanySiret
    recipientCompanyName
    recipientCompanyAddress
    recipientCompanyMail
    recipientProcessingOperation
    wasteDetailsCode
    wasteDetailsQuantity
    transporterNumberPlate
    sentAt
    receivedAt
    isAccepted
  }
`;
const tradedWasteFragment = `
  fragment OutgoingWasteFrom on Form {
    readableId
    customId
    emitterCompanySiret
    emitterCompanyName
    emitterCompanyContact
    emitterCompanyAddress
    emitterWorkSiteName
    emitterWorkSiteAddress
    recipientCompanySiret
    recipientIsTempStorage
    recipientCompanyName
    recipientCompanyAddress
    recipientCompanyMail
    recipientProcessingOperation
    wasteDetailsCode
    wasteDetailsQuantity
    traderReceipt
    traderValidityLimit
    transporterCompanySiret
    transporterCompanyName
    transporterCompanyAddress
    transporterIsExemptedOfReceipt
    transporterReceipt
    transporterValidityLimit
    transporterNumberPlate
    sentAt
    receivedAt
    isAccepted
    processingOperationDone
    noTraceability
    temporaryStorageDetail {
      destinationCompanySiret
      destinationCompanyName
      destinationCompanyAddress
      destinationCompanyMail
    }
  }
`;

const allWasteFragment = `
  fragment OutgoingWasteFrom on Form {
    readableId
    customId
    emitterCompanySiret
    emitterCompanyName
    emitterCompanyContact
    emitterCompanyAddress
    emitterWorkSiteName
    emitterWorkSiteAddress
    recipientCompanySiret
    recipientIsTempStorage
    recipientCompanyName
    recipientCompanyAddress
    recipientCompanyMail
    recipientProcessingOperation
    wasteDetailsCode
    wasteDetailsQuantity
    traderReceipt
    traderValidityLimit
    transporterCompanySiret
    transporterCompanyName
    transporterCompanyAddress
    transporterIsExemptedOfReceipt
    transporterReceipt
    transporterValidityLimit
    transporterNumberPlate
    sentAt
    receivedAt
    isAccepted
    processingOperationDone
    noTraceability
    temporaryStorageDetail {
      destinationCompanySiret
      destinationCompanyName
      destinationCompanyAddress
      destinationCompanyMail
    }
  }
`;
