// Standard page height in pixels
export const pageHeight = 842;

// Main form field settings
// coordinates: top/left, mandatory
// fontsize: optional
// maxLength: how many characters do we display, optional
// lineBreakAt: at which position do we insert a linebreak (optional)
// rightAlign: right align the content
export const mainFormFieldSettings = {
  currentPageNumber: { x: 530, y: 70, fontSize: 10 },
  totalPagesNumber: { x: 550, y: 70, fontSize: 10 },

  emitterTypeProducer: { x: 53, y: 126, fontSize: 12 },
  emitterTypeAppendix1: { x: 157.5, y: 125.5, fontSize: 12 },
  emitterTypeAppendix2: { x: 51, y: 167, fontSize: 12 },
  emitterTypeOther: { x: 213.5, y: 167, fontSize: 12 },
  readableId: { x: 115, y: 104, fontSize: 10 },
  customId: { x: 300, y: 104, fontSize: 10 },

  ecoOrganismeName: { x: 180, y: 180 },

  emitterCompanySiret: { x: 88, y: 210 },
  emitterCompanyName: { x: 70, y: 219, maxLength: 50 },
  emitterCompanyAddress: { x: 78, y: 230, lineBreakAt: 55, maxLength: 110 },
  emitterCompanyPhone: { x: 65, y: 250 },
  emitterCompanyMail: { x: 64, y: 261 },
  emitterCompanyContact: { x: 125, y: 271 },

  recipientCompanySiret: { x: 342, y: 178 },
  recipientCompanyName: { x: 325, y: 189, maxLength: 50 },
  recipientCompanyAddress: { x: 331, y: 198, lineBreakAt: 55, maxLength: 110 },
  recipientCompanyPhone: { x: 317, y: 219 },
  recipientCompanyMail: { x: 318, y: 229.5 },
  recipientCompanyContact: { x: 378, y: 240.5 },
  recipientCap: { x: 402, y: 261 },
  recipientProcessingOperation: { x: 507, y: 271 },
  temporaryStorageYes: { x: 305, y: 147, fontSize: 12 },
  temporaryStorageNo: { x: 305, y: 159, fontSize: 12 },

  wasteDetailsCode: { x: 155, y: 292, fontSize: 10 },
  wasteDetailsConsistenceSolid: { x: 368, y: 293, fontSize: 12 },
  wasteDetailsConsistenceLiquid: { x: 422, y: 293, fontSize: 12 },
  wasteDetailsConsistenceGaseous: { x: 481, y: 293, fontSize: 12 },
  wasteDetailsName: { x: 172, y: 313 },

  wasteDetailsOnuCode: { x: 45, y: 335 },

  wasteDetailsPackagingsBenne: { x: 132, y: 358, fontSize: 12 },
  wasteDetailsPackagingsCiterne: { x: 179, y: 358, fontSize: 12 },
  wasteDetailsPackagingsGrv: { x: 230, y: 358, fontSize: 12 },
  wasteDetailsPackagingsFut: { x: 272, y: 358, fontSize: 12 },
  wasteDetailsPackagingsOther: { x: 324, y: 358, fontSize: 12 },
  wasteDetailsNumberOfPackages: { x: 505, y: 355 },

  wasteDetailsQuantityReal: { x: 112, y: 380, fontSize: 12 },
  wasteDetailsQuantityEstimated: { x: 170, y: 380, fontSize: 12 },
  wasteDetailsQuantity: { x: 248, y: 377, rightAlign: true },

  traderCompanySiret: { x: 87, y: 410 },
  traderCompanyName: { x: 70, y: 420, maxLength: 50 },
  traderCompanyAddress: { x: 78, y: 430, lineBreakAt: 55, maxLength: 110 },
  traderCompanyPhone: { x: 318, y: 428 },
  traderCompanyMail: { x: 319, y: 438.5 },
  traderCompanyContact: { x: 377, y: 418 },
  traderReceipt: { x: 350, y: 398 },
  traderValidityLimit: { x: 366, y: 408 },
  traderDepartment: { x: 468, y: 398 },

  transporterCompanySiren: { x: 87, y: 474 },
  transporterCompanyName: { x: 70, y: 484, maxLength: 50 },
  transporterCompanyAddress: { x: 78, y: 494, lineBreakAt: 55, maxLength: 110 },
  transporterCompanyPhone: { x: 64, y: 515 },
  transporterCompanyMail: { x: 65, y: 525 },
  transporterCompanyContact: { x: 122, y: 536 },
  transporterReceipt: { x: 350, y: 462 },
  transporterValidityLimit: { x: 366, y: 472 },
  transporterDepartment: { x: 472, y: 462 },
  transporterSentAt: { x: 394, y: 492 },

  senderSentBy: { x: 70, y: 588 },
  senderSentAt: { x: 216, y: 588 },

  recipientCompanySiret10: { x: 86, y: 620 },
  recipientCompanyName10: { x: 72, y: 632, maxLength: 50 },
  recipientCompanyAddress10: { x: 78, y: 642, lineBreakAt: 55, maxLength: 110 },
  recipientCompanyContact10: { x: 124, y: 662 },
  recipientPhoneContact10: { x: 124, y: 662 },
  quantityReceived: { x: 198, y: 673, rightAlign: true },
  receivedBy10: { x: 85, y: 735 },
  receivedAt: { x: 122, y: 683 },
  wasteRefusalReason: { x: 100, y: 704, lineBreakAt: 50 },

  signedAt: { x: 66, y: 746 },

  wasteAccepted: { x: 116, y: 696, fontSize: 12 },
  wasteNotAccepted: { x: 161, y: 696, fontSize: 12 },

  processingOperationDone: { x: 338, y: 620 },
  processingOperationDescription: { x: 342, y: 640 },
  processedBy: { x: 322, y: 680 },
  processedAt: { x: 318, y: 692 },

  nextDestinationProcessingOperation: { x: 154, y: 776.5 },
  nextDestinationCompanySiret: { x: 88, y: 788 },
  nextDestinationCompanyName: { x: 69, y: 798, maxLength: 50 },
  nextDestinationCompanyAddress: {
    x: 79,
    y: 808,
    lineBreakAt: 55,
    maxLength: 110
  },
  nextDestinationCompanyContact: { x: 380, y: 787 },
  nextDestinationCompanyPhone: { x: 318, y: 798 },
  nextDestinationCompanyMail: { x: 318, y: 808 },
  isMultimodal: { x: 303, y: 536, fontSize: 12 }
};

// coordinates of each stamp image
export const imageLocations = {
  transporterSignature: { x: 450, y: 525 },
  emitterSignature: { x: 450, y: 590 },
  processingSignature: { x: 450, y: 732 },
  receivedSignature: { x: 210, y: 742 },
  exemptionStamp: { x: 400, y: 520 },
  noTraceabilityStamp: { x: 300, y: 740 },
  watermark: { x: 0, y: 800 },
  tempStorerReceptionSignature: { x: 195, y: 310 },
  tempStorerSentSignature: { x: 420, y: 590 },
  tempStorageTransporterSignature: { x: 420, y: 480 },
  takenOverSignature: { x: 420, y: 695 }
};

// Temporary Storage detail form field settings
export const temporaryStorageDetailsFieldSettings = {
  currentPageNumber: { x: 530, y: 70, fontSize: 10 },
  totalPagesNumber: { x: 550, y: 70, fontSize: 10 },
  formReadableId: { x: 220, y: 95, fontSize: 10 },

  tempStorerQuantityReal: { x: 125, y: 190, fontSize: 12 },
  tempStorerQuantityEstimated: { x: 190, y: 190, fontSize: 12 },
  tempStorerQuantityReceived: { x: 222, y: 193 },

  wasteAccepted: { x: 116, y: 223, fontSize: 12 },
  wasteNotAccepted: { x: 161, y: 223, fontSize: 12 },

  tempStorerWasteRefusalReason: { x: 100, y: 240, lineBreakAt: 50 },
  tempStorerReceivedAt: { x: 125, y: 213 },
  tempStorerSignedAt: { x: 75, y: 273 },
  tempStorerCompanySiret: { x: 90, y: 151 },
  tempStorerCompanyName: { x: 75, y: 161, maxLength: 50 },
  tempStorerCompanyAddress: { x: 80, y: 170, lineBreakAt: 55, maxLength: 110 },

  destinationIsFilledByEmitter: { x: 293, y: 284, fontSize: 12 },
  destinationCompanySiret: { x: 335, y: 140 },
  destinationCompanyName: { x: 320, y: 150, maxLength: 50 },
  destinationCompanyAddress: {
    x: 325,
    y: 161,
    lineBreakAt: 55,
    maxLength: 110
  },
  destinationCompanyPhone: { x: 313, y: 180 },
  destinationCompanyMail: { x: 313, y: 190 },
  destinationCompanyContact: { x: 372, y: 202 },
  destinationCap: { x: 400, y: 222 },
  destinationProcessingOperation: { x: 505, y: 232 },

  wasteDetailsOnuCode: { x: 50, y: 340 },
  wasteDetailsPackagingsBenne: { x: 132, y: 370, fontSize: 12 },
  wasteDetailsPackagingsCiterne: { x: 179, y: 370, fontSize: 12 },
  wasteDetailsPackagingsGrv: { x: 230, y: 370, fontSize: 12 },
  wasteDetailsPackagingsFut: { x: 279, y: 370, fontSize: 12 },
  wasteDetailsPackagingsOther: { x: 319, y: 370, fontSize: 12 },
  wasteDetailsNumberOfPackages: { x: 520, y: 369 },

  wasteDetailsQuantityReal: { x: 112, y: 390, fontSize: 12 },
  wasteDetailsQuantityEstimated: { x: 170, y: 390, fontSize: 12 },
  wasteDetailsQuantity: { x: 248, y: 387, rightAlign: true },

  transporterCompanySiret: { x: 90, y: 430 },
  transporterCompanyName: { x: 75, y: 440, maxLength: 50 },
  transporterCompanyAddress: { x: 80, y: 450, lineBreakAt: 55, maxLength: 110 },
  transporterCompanyPhone: { x: 65, y: 470 },
  transporterCompanyMail: { x: 65, y: 490 },
  transporterCompanyContact: { x: 125, y: 501 },
  transporterReceipt: { x: 350, y: 417 },
  transporterDepartment: { x: 472, y: 417 },
  transporterValidityLimit: { x: 366, y: 425 },
  transporterSentAt: { x: 388, y: 455 },

  tempStoredFormSignedBy: { x: 75, y: 562 },
  tempStoredFormSignedAt: { x: 215, y: 562 }
};

// appendix2 header field settings
export const appendixHeaderFieldSettings = {
  readableId: { x: 240, y: 160, fontSize: 10 },
  emitterCompanySiret: { x: 103, y: 186, fontSize: 10 },
  emitterCompanyName: { x: 84, y: 197, fontSize: 10 },
  emitterCompanyAddress: { x: 92, y: 208, fontSize: 10, lineBreakAt: 40 },
  emitterCompanyMailName: { x: 372, y: 186, fontSize: 10 },
  emitterCompanyPhone: { x: 306, y: 197, fontSize: 10 },
  emitterCompanyMail: { x: 305, y: 208, fontSize: 10 },
  emitterCompanyContact: { x: 375, y: 186, fontSize: 10 }
};

// appendix2 attached form field settings
export const appendixFieldSettings = {
  numbering: { x: 142, y: 243, fontSize: 10 },
  initialEmitter: { x: 142, y: 243, fontSize: 10 },
  readableId: { x: 392, y: 244, fontSize: 10 },
  emitterCompanySiret: { x: 104, y: 256, fontSize: 10 },
  emitterCompanyName: { x: 84, y: 267, fontSize: 10, maxLength: 29 },
  emitterCompanyAddress: { x: 94, y: 278, fontSize: 10, lineBreakAt: 38 },
  emitterCompanyPhone: { x: 76, y: 302, fontSize: 10 },

  emitterCompanyMail: { x: 76, y: 313, fontSize: 10 },
  emitterCompanyContact: { x: 143, y: 326, fontSize: 10 },
  wasteDetailsCode: { x: 360, y: 267, fontSize: 10 },
  wasteDetailsName: { x: 430, y: 279, fontSize: 10 },
  wasteDetailsQuantityReal: { x: 327, y: 302, fontSize: 10 },
  quantityReceived: { x: 468, y: 302, fontSize: 10, rightAlign: true },
  receivedAt: { x: 350, y: 326, fontSize: 10 }
};

// vertical offset to be applied to each appending sub form coordinates
export const appendixYOffsets = [0, 104, 208, 313, 418];

export const transportSegmentSettings = {
  segmentNumber: { x: 162, y: 628, fontSize: 10 },
  transporterCompanySiren: { x: 90, y: 640, fontSize: 10 },
  transporterCompanyName: { x: 71, y: 650, fontSize: 10, maxLength: 50 },
  transporterCompanyAddress: {
    x: 77,
    y: 660,
    fontSize: 10,
    lineBreakAt: 55,
    maxLength: 110
  },
  transporterCompanyPhone: { x: 62, y: 680, fontSize: 10 },
  transporterCompanyMail: { x: 63, y: 691, fontSize: 10 },
  transporterCompanyContact: { x: 122, y: 702, fontSize: 10 },
  transporterReceipt: { x: 350, y: 628, fontSize: 10 },
  transporterDepartment: { x: 468, y: 628, fontSize: 10 },
  transporterValidityLimit: { x: 364, y: 638, fontSize: 10 },
  mode: { x: 368, y: 650, fontSize: 10 },
  takenOverAt: { x: 391, y: 659, fontSize: 10 },
  takenOverBy: { x: 332, y: 678, fontSize: 10 }
};
