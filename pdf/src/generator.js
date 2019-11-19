const path = require("path");
const pdflib = require("pdf-lib");
const fs = require("fs");
const fontkit = require("@pdf-lib/fontkit");

const { PDFDocument } = pdflib;

// coordinates and fontsize of each field
const fieldSettings = {
  emitterTypeProducer: { x: 53, y: 126, fontSize: 12 },
  emitterTypeAppendix1: { x: 157.5, y: 125.5, fontSize: 12 },
  emitterTypeAppendix2: { x: 51, y: 167, fontSize: 12 },
  emitterTypeOther: { x: 213.5, y: 167, fontSize: 12 },
  readableId: { x: 115, y: 104, fontSize: 10 },

  emitterCompanySiret: { x: 88, y: 210 },
  emitterCompanyName: { x: 70, y: 219 },
  emitterCompanyAddress: { x: 78, y: 230 },
  emitterCompanyPhone: { x: 65, y: 250 },
  emitterCompanyMail: { x: 64, y: 261 },
  emitterCompanyContact: { x: 125, y: 271 },

  recipientCompanySiret: { x: 342, y: 178 },
  recipientCompanyName: { x: 325, y: 189 },
  recipientCompanyAddress: { x: 331, y: 198 },
  recipientCompanyPhone: { x: 317, y: 219 },
  recipientCompanyMail: { x: 318, y: 229.5 },
  recipientCompanyContact: { x: 378, y: 240.5 },
  recipientCap: { x: 402, y: 261 },
  recipientProcessingOperation: { x: 507, y: 271 },

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

  wasteDetailsQuantityReal: { x: 112, y: 380 },
  wasteDetailsQuantityEstimated: { x: 170, y: 380 },
  wasteDetailsQuantity: { x: 248, y: 377, rightAlign: true },

  traderCompanySiret: { x: 87, y: 410 },
  traderCompanyName: { x: 70, y: 420 },
  traderCompanyAddress: { x: 78, y: 430 },
  traderCompanyPhone: { x: 318, y: 428 },
  traderCompanyMail: { x: 319, y: 438.5 },
  traderCompanyContact: { x: 377, y: 418 },
  traderReceipt: { x: 350, y: 398 },
  traderValidityLimit: { x: 366, y: 408 },
  traderDepartment: { x: 468, y: 398 },

  transporterCompanySiret: { x: 87, y: 474 },
  transporterCompanyName: { x: 70, y: 484 },
  transporterCompanyAddress: { x: 78, y: 494 },
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
  recipientCompanyName10: { x: 72, y: 632 },
  recipientCompanyAddress10: { x: 78, y: 642 },
  recipientCompanyContact10: { x: 124, y: 662 },
  recipientPhoneContact10: { x: 124, y: 662 },
  quantityReceived: { x: 198, y: 673, rightAlign: true },
  receivedBy10: { x: 85, y: 735 },
  receivedAt1: { x: 65, y: 745 },

  receivedAt2: { x: 66, y: 744 },
  isAccepted: { x: 115, y: 696, fontSize: 12 },
  isNotAccepted: { x: 160, y: 696, fontSize: 12 },
  processingOperationDone: { x: 338, y: 620 },
  processingOperationDescription: { x: 342, y: 640 },
  processedBy: { x: 322, y: 680 },
  processedAt: { x: 318, y: 692 },

  nextDestinationProcessingOperation: { x: 154, y: 776.5 },
  nextDestinationDetails: { x: 88, y: 788 }
};

// Standard page height in pixels
const pageHeight = 842;

/**
 * Write text on the pdf by retrieving field params in fieldSettings object
 * @param fieldName - name of the field
 * @param content - text to write
 * @param font - font object
 * @param page - page on which we want to write
 */
const drawText = (fieldName, content, font, page) => {
  let params = fieldSettings[fieldName];
  if (!!params) {
    let fontSize = params.fontSize ? params.fontSize : 8;
    let x = params.x;

    if (!!params.rightAlign) {
      const contentWidth = font.widthOfTextAtSize(content, fontSize);
      x = x - contentWidth;
    }

    page.drawText(content, {
      x: x,
      y: pageHeight - params.y,
      size: fontSize,
      font: font
    });
  }
};

/**
 * Draw a × in checkbox
 * @param fieldName - name of the field (see
 * @param font - font object
 * @param page - page on which we want to write
 */
const checkBox = (fieldName, font, page) => {
  drawText(fieldName, "×", font, page);
};

// coordinates of each stamp image
const imageLocations = {
  transporterSignature: { x: 450, y: 525 },
  emitterSignature: { x: 450, y: 590 },
  processingSignature: { x: 450, y: 732 },
  receivedSignature: { x: 200, y: 732 },
  exemptionStamp: { x: 450, y: 487 }
};

/**
 * Draw an image on page
 * @param locationName - imageLocations field
 * @param image - which image we want to draw
 * @param page - page on which we want to write
 */
const drawImage = (locationName, image, page) => {
  location = imageLocations[locationName];

  page.drawImage(image, {
    x: location.x,
    y: pageHeight - location.y,
    width: 75,
    height: 37
  });
};
const capitalize = string =>
  string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();

/**
 * Returns either emitterTypeProducer|emitterTypeAppendix1|emitterTypeAppendix2|emitterTypeOther according to
 * emitterType value
 *
 * @param {object} params -  the full request payload
 * @returns {object}
 */
const getEmitterType = params => {
  const { emitterType } = params;
  if (emitterType === "PRODUCER") {
    return { emitterTypeProducer: true };
  }
  if (emitterType === "APPENDIX1") {
    return { emitterTypeAppendix1: true };
  }
  if (emitterType === "APPENDIX2") {
    return { emitterTypeAppendix2: true };
  }
  if (emitterType === "OTHER") {
    return { emitterTypeOther: true };
  }
};

/**
 * Reformat a date
 * @param {string } datestr - a date iso-formatted
 * @returns {string} - date formatted as dd/mm/YYYY
 */
const dateFmt = datestr => {
  if (!datestr) {
    return "";
  }
  const date = new Date(datestr);
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  if (day < 10) {
    day = "0" + day;
  }
  if (month < 10) {
    month = "0" + month;
  }

  return `${day}/${month}/${year}`;
};

/**
 * Return either wasteDetailsConsistenceLiquid: true | wasteDetailsConsistenceSolid: true etc according to
 * wasteDetailsConsistence parameter
 *
 * @param {object} params -  the full request payload
 * @returns {object}
 */
const getWasteDetailsConsistence = params => {
  if (!params.wasteDetailsConsistence) {
    return {};
  }
  return {
    [`wasteDetailsConsistence${capitalize(
      params.wasteDetailsConsistence
    )}`]: true
  };
};

const renameAndFormatFields = params => ({
  transporterValidityLimit: dateFmt(params.transporterValidityLimit),
  traderValidityLimit: dateFmt(params.traderValidityLimit),
  recipientCompanySiret10: params.recipientCompanySiret,
  recipientCompanyName10: params.recipientCompanyName,
  recipientCompanyAddress10: params.recipientCompanyAddress,
  recipientCompanyContact10: params.recipientCompanyContact,
  transporterSentAt: dateFmt(params.sentAt),
  senderSentAt: dateFmt(params.sentAt),
  receivedAt1: dateFmt(params.receivedAt),
  receivedAt2: dateFmt(params.receivedAt)
});

/**
 * Return an object according to wasteDetailsPackagings array
 * {wasteDetailsPackagings : ["citerne", "fut"]} ->
 *    {wasteDetailsPackagingsCiterne: true, wasteDetailsPackagingFut: true}
 * @param {object} params -  the full request payload
 * @returns {object}
 */
const getWasteDetailsPackagings = params => {
  if (!params.wasteDetailsPackagings) {
    return {};
  }
  return params.wasteDetailsPackagings.reduce(function(acc, elem) {
    let key = `wasteDetailsPackagings${capitalize(elem)}`;
    return {
      ...acc,
      [key]: true
    };
  }, {});
};

/**
 * Transform numbers as strings to be accpeted by the pdf template
 * @param params -  the full request payload
 * @returns {object}
 */
const stringifyNumberFields = params => {
  let data = { ...params };
  for (let [k, v] of Object.entries(data)) {
    if (typeof v === "number") {
      data[k] = v.toString();
    }
  }
  return data;
};

/**
 * Apply transformers to payload
 * @param params -  the full request payload
 * @returns {object}
 */
function process(params) {
  const data = stringifyNumberFields(params);
  return {
    ...data,
    ...getEmitterType(data),
    ...getWasteDetailsConsistence(data),
    ...getWasteDetailsPackagings(data),
    ...renameAndFormatFields(data)
  };
}

/**
 * Render a form as pdf
 * Loads a pdf template, adds text to fill fields and adds stamp images as overlays
 * @param params - payload
 * @return Buffer
 */
const write = async params => {
  const formData = process(params);

  const fontBytes = fs.readFileSync(path.join(__dirname, "./fonts/arial.ttf"));

  const existingPdfBytes = fs.readFileSync(
    path.join(__dirname, "./templates/bsd.pdf")
  );

  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  pdfDoc.registerFontkit(fontkit);
  const customFont = await pdfDoc.embedFont(fontBytes);

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  const stampBytes = fs.readFileSync(
    path.join(__dirname, "./medias/stamp.png")
  );
  const stampImage = await pdfDoc.embedPng(stampBytes);

  const exemptionStampBytes = fs.readFileSync(
    path.join(__dirname, "./medias/exempt.png")
  );
  const exemptionStampImage = await pdfDoc.embedPng(exemptionStampBytes);

  for (let [k, v] of Object.entries(formData)) {
    if (v === true) {
      checkBox(k, customFont, firstPage);
    }
    if (typeof v === "string") {
      drawText(k, v, customFont, firstPage);
    }
  }

  if (!!formData.signedByTransporter) {
    drawImage("transporterSignature", stampImage, firstPage);
  }
  if (!!formData.sentAt) {
    drawImage("emitterSignature", stampImage, firstPage);
  }
  if (!!formData.processingOperationDone) {
    drawImage("processingSignature", stampImage, firstPage);
  }
  if (!!formData.receivedBy) {
    drawImage("receivedSignature", stampImage, firstPage);
  }

  if (!!formData.transporterIsExemptedOfReceipt) {
    drawImage("exemptionStamp", exemptionStampImage, firstPage);
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes.buffer);
};

module.exports = write;
