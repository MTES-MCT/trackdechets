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
    ecoOrganisme {
      name
    }
    recipientCompanySiret
    recipientCompanyName
    recipientCompanyAddress
    recipientCompanyMail
    recipientCompanyPhone
    recipientCompanyContact
    recipientProcessingOperation
    recipientIsTempStorage
    temporaryStorageDetail {
      destinationCompanySiret
      destinationCompanyName
      destinationCompanyAddress
      destinationCompanyMail
      destinationCompanyPhone
      destinationCompanyContact
      destinationProcessingOperation
      transporterCompanySiret
      transporterCompanyName
      transporterCompanyAddress
      transporterIsExemptedOfReceipt
      transporterReceipt
      transporterValidityLimit
      transporterNumberPlate
    }
    quantityReceived
    processingOperationDone
    wasteDetailsCode
    wasteDetailsQuantity
    traderCompanyName
    traderCompanySiret
    traderReceipt
    traderValidityLimit
    traderCompanyContact
    traderCompanyAddress
    transporterCompanySiret
    transporterCompanyName
    transporterCompanyAddress
    transporterIsExemptedOfReceipt
    transporterReceipt
    transporterValidityLimit
    transporterNumberPlate
    sentAt
    nextDestinationProcessingOperation
    nextDestinationCompanyName
    nextDestinationCompanyContact
    nextDestinationCompanyMail
    nextDestinationCompanyPhone
    nextDestinationCompanyAddress
    nextDestinationCompanyCountry
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
    ecoOrganisme {
      name
    }
    recipientProcessingOperation
    recipientIsTempStorage
    quantityReceived
    wasteDetailsCode
    traderCompanyName
    traderCompanySiret
    traderReceipt
    traderValidityLimit
    traderCompanyContact
    traderCompanyAddress
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
    nextDestinationProcessingOperation
    nextDestinationCompanyName
    nextDestinationCompanyContact
    nextDestinationCompanyMail
    nextDestinationCompanyPhone
    nextDestinationCompanyAddress
    nextDestinationCompanyCountry
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
    ecoOrganisme {
      name
    }
    recipientCompanySiret
    recipientCompanyName
    recipientCompanyAddress
    recipientCompanyMail
    recipientCompanyPhone
    recipientCompanyContact
    recipientProcessingOperation
    recipientIsTempStorage
    quantityReceived
    temporaryStorageDetail {
      destinationCompanySiret
      destinationCompanyName
      destinationCompanyAddress
      destinationCompanyMail
      destinationCompanyPhone
      destinationCompanyContact
      destinationProcessingOperation
      transporterCompanySiret
      transporterCompanyName
      transporterCompanyAddress
      transporterIsExemptedOfReceipt
      transporterReceipt
      transporterValidityLimit
      transporterNumberPlate
    }
    traderCompanyName
    traderCompanySiret
    traderReceipt
    traderValidityLimit
    traderCompanyContact
    traderCompanyAddress
    traderCompanyName
    traderCompanySiret
    traderReceipt
    traderValidityLimit
    traderCompanyContact
    traderCompanyAddress
    recipientCompanySiret
    recipientCompanyName
    recipientCompanyAddress
    recipientCompanyMail
    recipientProcessingOperation
    wasteDetailsCode
    transporterNumberPlate
    sentAt
    receivedAt
    isAccepted
    nextDestinationProcessingOperation
    nextDestinationCompanyName
    nextDestinationCompanyContact
    nextDestinationCompanyMail
    nextDestinationCompanyPhone
    nextDestinationCompanyAddress
    nextDestinationCompanyCountry
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
    ecoOrganisme {
      name
    }
    recipientCompanySiret
    recipientCompanyName
    recipientCompanyAddress
    recipientCompanyMail
    recipientCompanyPhone
    recipientCompanyContact
    recipientProcessingOperation
    recipientIsTempStorage
    quantityReceived
    temporaryStorageDetail {
      destinationCompanySiret
      destinationCompanyName
      destinationCompanyAddress
      destinationCompanyMail
      destinationCompanyPhone
      destinationCompanyContact
      destinationProcessingOperation
      transporterCompanySiret
      transporterCompanyName
      transporterCompanyAddress
      transporterIsExemptedOfReceipt
      transporterReceipt
      transporterValidityLimit
      transporterNumberPlate
    }
    wasteDetailsCode
    wasteDetailsQuantity
    traderCompanyName
    traderCompanySiret
    traderReceipt
    traderValidityLimit
    traderCompanyContact
    traderCompanyAddress
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
    nextDestinationProcessingOperation
    nextDestinationCompanyName
    nextDestinationCompanyContact
    nextDestinationCompanyMail
    nextDestinationCompanyPhone
    nextDestinationCompanyAddress
    nextDestinationCompanyCountry
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
    ecoOrganisme {
      name
    }
    recipientCompanySiret
    recipientCompanyName
    recipientCompanyAddress
    recipientCompanyMail
    recipientCompanyPhone
    recipientCompanyContact
    recipientProcessingOperation
    recipientIsTempStorage
    quantityReceived
    temporaryStorageDetail {
      destinationCompanySiret
      destinationCompanyName
      destinationCompanyAddress
      destinationCompanyMail
      destinationCompanyPhone
      destinationCompanyContact
      destinationProcessingOperation
      transporterCompanySiret
      transporterCompanyName
      transporterCompanyAddress
      transporterIsExemptedOfReceipt
      transporterReceipt
      transporterValidityLimit
      transporterNumberPlate
    }
    wasteDetailsCode
    wasteDetailsQuantity
    traderCompanyName
    traderCompanySiret
    traderReceipt
    traderValidityLimit
    traderCompanyContact
    traderCompanyAddress
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
    nextDestinationProcessingOperation
    nextDestinationCompanyName
    nextDestinationCompanyContact
    nextDestinationCompanyMail
    nextDestinationCompanyPhone
    nextDestinationCompanyAddress
    nextDestinationCompanyCountry
  }
`;
