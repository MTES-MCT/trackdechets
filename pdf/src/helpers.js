const { pageHeight, imageLocations } = require("./settings");

/**
 * Write text on the pdf by retrieving field params in fieldSettings object
 *  Can right align, limit content length or split content according to fieldSettings params.
 *
 * @param fieldName - name of the field
 * @param content - text to write
 * @param font - font object
 * @param page - page on which we want to write
 */
const drawText = ({
  fieldName,
  settings,
  content,
  font,
  page,
  yOffset = 0,
}) => {
  let params = settings[fieldName];
  if (!!params) {
    let fontSize = params.fontSize ? params.fontSize : 8;
    let x = params.x;

    if (!!params.rightAlign) {
      const contentWidth = font.widthOfTextAtSize(content, fontSize);
      x = x - contentWidth;
    }
    if (!!params.maxLength && content.length > params.maxLength) {
      content = `${content.substring(0, params.maxLength - 1)}…`;
    }
    if (!!params.lineBreakAt) {
      content = `${content.substring(
        0,
        params.lineBreakAt
      )}\n${content.substring(params.lineBreakAt)}`;
    }

    page.drawText(content, {
      x: x,
      y: pageHeight - params.y - yOffset,
      size: fontSize,
      font: font,
      lineHeight: fontSize * 1.2,
    });
  }
};

/**
 * Draw a × in checkbox
 * @param fieldName - name of the field (see
 * @param font - font object
 * @param page - page on which we want to write
 */

const checkBox = ({ fieldName, settings, font, page, yOffset = 0 }) => {
  drawText({ fieldName, settings, font, page, yOffset, content: "×" });
};

/**
 * Draw an image on page
 * @param locationName - imageLocations field
 * @param image - which image we want to draw
 * @param page - page on which we want to write
 */

const drawImage = ({
  locationName,
  image,
  page,
  dimensions = { width: 75, height: 37 },
  yOffset = 0
}) => {
  location = imageLocations[locationName];

  page.drawImage(image, {
    x: location.x,
    y: pageHeight - (location.y + yOffset),

    ...dimensions,
  });
};

const capitalize = (string) =>
  string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();

/**
 * Returns either emitterTypeProducer|emitterTypeAppendix1|emitterTypeAppendix2|emitterTypeOther according to
 * emitterType value
 *
 * @param {object} params -  the full request payload
 * @returns {object}
 */
const getEmitterType = (params) => {
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
const dateFmt = (datestr) => {
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
 * Return either temporaryStorageYes: true | temporaryStorageNo: true etc according to
 * recipientIsTempStorage parameter
 *
 * @param {object} params -  the full request payload
 * @returns {object}
 */
const getTemporaryStorageExistance = (params) => {
  if (params.recipientIsTempStorage) {
    return { temporaryStorageYes: true };
  }
  return { temporaryStorageNo: true };
};

/**
 * Return either wasteDetailsConsistenceLiquid: true | wasteDetailsConsistenceSolid: true etc according to
 * wasteDetailsConsistence parameter
 *
 * @param {object} params -  the full request payload
 * @returns {object}
 */
const getWasteDetailsConsistence = (params) => {
  if (!params.wasteDetailsConsistence) {
    return {};
  }
  return {
    [`wasteDetailsConsistence${capitalize(
      params.wasteDetailsConsistence
    )}`]: true,
  };
};

/**
 * Return either wasteDetailsQuantityEstimated: true | wasteDetailsQuantityReal: true etc according to
 * wasteDetailsQuantityType parameter
 *
 * @param {object} params -  the full request payload
 * @returns {object}
 */
const getWasteDetailsType = (params) => {
  if (!params.wasteDetailsQuantityType) {
    return {};
  }
  let field = {
    ESTIMATED: "wasteDetailsQuantityEstimated",
    REAL: "wasteDetailsQuantityReal",
  }[params.wasteDetailsQuantityType];
  return {
    [field]: true,
  };
};

const getTempStorerWasteDetailsType = (params) => {
  if (!params.tempStorerQuantityType) {
    return {};
  }
  let field = {
    ESTIMATED: "tempStorerQuantityEstimated",
    REAL: "tempStorerQuantityReal",
  }[params.tempStorerQuantityType];
  return {
    [field]: true,
  };
};

/**
 * Format date fields to french fmt and copy some fields values to other fields
 * @param params
 * @returns {{traderValidityLimit: *, senderSentAt: *, transporterSentAt: *, recipientCompanyName10: *, transporterValidityLimit: *, recipientCompanySiret10: *, signedAt: *, recipientCompanyContact10: *, receivedAt: *, recipientCompanyAddress10: *}}
 */
const renameAndFormatMainFormFields = (params) => ({
  transporterValidityLimit: dateFmt(params.transporterValidityLimit),
  traderValidityLimit: dateFmt(params.traderValidityLimit),
  recipientCompanySiret10: params.recipientCompanySiret,
  recipientCompanyName10: params.recipientCompanyName,
  recipientCompanyAddress10: params.recipientCompanyAddress,
  recipientCompanyContact10: params.recipientCompanyContact,
  transporterSentAt: dateFmt(params.sentAt),
  senderSentBy: params.sentBy,
  senderSentAt: dateFmt(params.sentAt),
  receivedAt: dateFmt(params.receivedAt),
  signedAt: dateFmt(params.signedAt),
  receivedBy10: params.receivedBy,
  processedAt: dateFmt(params.processedAt),
  tempStorerReceivedAt: dateFmt(params.tempStorerReceivedAt),
  tempStorerSignedAt: dateFmt(params.tempStorerSignedAt),
  tempStoredFormSignedAt: dateFmt(params.signedAt),
  tempStoredFormSignedBy: dateFmt(params.signedBy),
});

/**
 * Return an object according to wasteDetailsPackagings array
 * {wasteDetailsPackagings : ["citerne", "fut"]} ->
 *    {wasteDetailsPackagingsCiterne: true, wasteDetailsPackagingFut: true}
 * @param {object} params -  the full request payload
 * @returns {object}
 */
const getWasteDetailsPackagings = (params) => {
  if (!params.wasteDetailsPackagings) {
    return {};
  }
  return params.wasteDetailsPackagings.reduce(function (acc, elem) {
    let key = `wasteDetailsPackagings${capitalize(elem)}`;
    return {
      ...acc,
      [key]: true,
    };
  }, {});
};

/**
 * Transform numbers as strings to be accepted by the pdf template
 * @param params -  the full request payload
 * @returns {object}
 */
const stringifyNumberFields = (params) => {
  let data = { ...params };
  for (let [k, v] of Object.entries(data)) {
    if (typeof v === "number") {
      data[k] = v.toString();
    }
  }
  return data;
};

/**
 * We rely on wasteAcceptationStatus field which can take the following values: null|ACCEPTED|PARTIALLY_REFUSED
 * we return either { wasteAccepted: true } or { wasteNotAccepted: true }
 * @param params
 * @returns object
 */
const getAcceptationStatus = (params) => {
  if (["ACCEPTED", "PARTIALLY_REFUSED"].includes(params.wasteAcceptationStatus))
    return { wasteAccepted: true };
  if (params.wasteAcceptationStatus === "REFUSED")
    return { wasteNotAccepted: true };
  return {};
};

/**
 * Compute estimated refused quantity
 * @param wasteDetailsQuantity
 * @param quantityReceived
 * @returns {string}
 */
const getWasteQuantityRefused = (wasteDetailsQuantity, quantityReceived) =>
  (wasteDetailsQuantity.toFixed(3) - quantityReceived.toFixed(3)).toFixed(3);

/**
 * Reword wasteRefusalReason if waste is partially refused
 * @param params
 * @returns object
 */
const getWasteRefusalreason = (params) =>
  params.wasteAcceptationStatus === "PARTIALLY_REFUSED"
    ? {
      wasteRefusalReason: `Refus partiel: ${
        params.wasteRefusalReason
        } - Tonnage estimé de refus : ${getWasteQuantityRefused(
          params.wasteDetailsQuantity,
          params.quantityReceived
        )} tonnes`,
    }
    : {};

/**
 * Flatten ecoOrganisme object and keep only relevant properties for the PDF
 *
 * @param params
 * @returns object
 */
const getFlatEcoOrganisme = (params) => {
  return params.ecoOrganisme && params.ecoOrganisme.name
    ? {
      ecoOrganismeName: `Eco-organisme responsable:\n${params.ecoOrganisme.name}`,
    }
    : {};
};

/**
 * Apply transformers to payload
 * @param params -  the full request payload
 * @returns {object}
 */
function processMainFormParams(params) {
  params = { ...params, ...getWasteRefusalreason(params) }; // compute refused quantity before converting number to strings
  const data = stringifyNumberFields(params);
  return {
    ...data,
    ...getEmitterType(data),
    ...getWasteDetailsConsistence(data),
    ...getWasteDetailsPackagings(data),
    ...getWasteDetailsType(data),
    ...renameAndFormatMainFormFields(data),
    ...getAcceptationStatus(data),
    ...getFlatEcoOrganisme(data),
    ...getTemporaryStorageExistance(data),
    ...getTempStorerWasteDetailsType(data),
  };
}

// on appendix subforms, wasteDetailsQuantityReal checkbox is checked is quantityReceived is filled
const checkWasteDetailsQuantityReal = (data) =>
  !!data.quantityReceived ? { wasteDetailsQuantityReal: true } : {};

function processAnnexParams(params) {
  const data = stringifyNumberFields(params);
  return {
    ...data,

    ...getWasteDetailsType(data),
    ...checkWasteDetailsQuantityReal(data),
    receivedAt: dateFmt(params.receivedAt),
  };
}

const transportModeLabels = {
  ROAD: "Route",
  AIR: "Voie aérienne",
  RAIL: "Voie ferrée",
  RIVER: "Voie fluviale",
};

function verboseMode(mode) {
  if (!mode) { return "" }
  return transportModeLabels[mode]
}
function processSegment(segment) {
  return {
    ...segment,
    takenOverAt: dateFmt(segment.takenOverAt),
    mode: verboseMode(segment.mode)
  }

}

/**
 * Fill a generated PDFDocument according to data and settings
 *
 */

const fillFields = ({ data, settings, font, page, yOffset = 0 }) => {
  for (let [fieldName, content] of Object.entries(data)) {
    if (content === true) {
      checkBox({
        fieldName,
        settings: settings,
        font: font,
        page: page,
        yOffset,
      });
    }
    if (typeof content === "string") {
      drawText({
        fieldName,
        content,
        settings: settings,
        font: font,
        page: page,
        yOffset,
      });
    }
  }
};

exports.checkBox = checkBox;
exports.drawImage = drawImage;
exports.getEmitterType = getEmitterType;
exports.getWasteRefusalreason = getWasteRefusalreason;
exports.getWasteDetailsType = getWasteDetailsType;
exports.processMainFormParams = processMainFormParams;
exports.processAnnexParams = processAnnexParams;
exports.processSegment = processSegment;
exports.fillFields = fillFields;
