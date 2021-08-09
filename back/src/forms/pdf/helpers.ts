import { Form } from "@prisma/client";
import { extractPostalCode } from "../../utils";
import { isFormContributor } from "../permissions";
import { pageHeight, imageLocations } from "./settings";
import { transportModeLabels } from "../../common/pdf/helpers";
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
  yOffset = 0
}) => {
  const params = settings[fieldName];
  if (!!params) {
    const fontSize = params.fontSize ? params.fontSize : 8;
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
      lineHeight: fontSize * 1.2
    });
  }
};

/**
 * Draw a × in checkbox
 * @param fieldName - name of the field
 * @param font - font object
 * @param page - page on which we want to write
 */

export const checkBox = ({ fieldName, settings, font, page, yOffset = 0 }) => {
  drawText({ fieldName, settings, font, page, yOffset, content: "×" });
};

/**
 * Draw an image on page
 * @param locationName - imageLocations field
 * @param image - which image we want to draw
 * @param page - page on which we want to write
 */

export const drawImage = ({
  locationName,
  image,
  page,
  dimensions = { width: 75, height: 37 },
  yOffset = 0
}) => {
  const location = imageLocations[locationName];

  page.drawImage(image, {
    x: location.x,
    y: pageHeight - (location.y + yOffset),

    ...dimensions
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
export const getEmitterType = params => {
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
export const dateFmt = datestr => {
  if (!datestr) {
    return "";
  }
  const date = new Date(datestr);
  const year = date.getFullYear();
  let month: number | string = date.getMonth() + 1;
  let day: number | string = date.getDate();

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
const getTemporaryStorageExistance = params => {
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

/**
 * Return either wasteDetailsQuantityEstimated: true | wasteDetailsQuantityReal: true etc according to
 * wasteDetailsQuantityType parameter
 *
 * @param {object} params -  the full request payload
 * @returns {object}
 */
export const getWasteDetailsType = params => {
  if (!params.wasteDetailsQuantityType) {
    return {};
  }
  const field = {
    ESTIMATED: "wasteDetailsQuantityEstimated",
    REAL: "wasteDetailsQuantityReal"
  }[params.wasteDetailsQuantityType];
  return {
    [field]: true
  };
};

const getTempStorerWasteDetailsType = params => {
  if (!params.tempStorerQuantityType) {
    return {};
  }
  const field = {
    ESTIMATED: "tempStorerQuantityEstimated",
    REAL: "tempStorerQuantityReal"
  }[params.tempStorerQuantityType];
  return {
    [field]: true
  };
};

/**
 * Format date fields to french fmt and copy some fields values to other fields
 * @param params
 * @returns {{traderValidityLimit: *, senderSentAt: *, transporterSentAt: *, recipientCompanyName10: *, transporterValidityLimit: *, recipientCompanySiret10: *, signedAt: *, recipientCompanyContact10: *, receivedAt: *, recipientCompanyAddress10: *}}
 */
const renameAndFormatMainFormFields = params => ({
  transporterValidityLimit: dateFmt(params.transporterValidityLimit),
  traderValidityLimit: dateFmt(params.traderValidityLimit),
  recipientCompanySiret10: params.temporaryStorageDetail
    ? params.temporaryStorageDetail.destinationCompanySiret
    : params.recipientCompanySiret,
  recipientCompanyName10: params.temporaryStorageDetail
    ? params.temporaryStorageDetail.destinationCompanyName
    : params.recipientCompanyName,
  recipientCompanyAddress10: params.temporaryStorageDetail
    ? params.temporaryStorageDetail.destinationCompanyAddress
    : params.recipientCompanyAddress,
  recipientCompanyContact10: params.temporaryStorageDetail
    ? params.temporaryStorageDetail.destinationCompanyContact
    : params.recipientCompanyContact,
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
  tempStoredFormSignedBy: params.signedBy
});

/**
 * Return an object according to wasteDetailsPackagings array
 * {wasteDetailsPackagingInfos : [{type: "citerne", quantity: 2}, {type: "fut", quantity: 1}]} ->
 *    {wasteDetailsPackagingsCiterne: true, wasteDetailsPackagingFut: true}
 * @param {object} params -  the full request payload
 * @returns {object}
 */
const getWasteDetailsPackagings = params => {
  if (!params.wasteDetailsPackagingInfos) {
    return {};
  }
  return params.wasteDetailsPackagingInfos.reduce(function (acc, elem) {
    const key = `wasteDetailsPackagings${capitalize(elem.type)}`;
    return {
      ...acc,
      [key]: true,
      ...(elem.other ? { wasteDetailsPackagingsAutreDetails: elem.other } : {})
    };
  }, {});
};

/**
 * Return the number of packages as the total sum of wasteDetailsPackagingInfos packages
 * @param params -  the full request payload
 */
const getWasteDetailsNumberOfPackages = params => {
  if (!params.wasteDetailsPackagingInfos) {
    return {};
  }

  return {
    wasteDetailsNumberOfPackages: params.wasteDetailsPackagingInfos
      .reduce((acc, elem) => acc + elem.quantity, 0)
      .toString()
  };
};

/**
 * Transform numbers as strings to be accepted by the pdf template
 */
const stringifyNumberFields = <T>(params: T): T => {
  const data = { ...params };
  for (const [k, v] of Object.entries(data)) {
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
const getAcceptationStatus = params => {
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
export const getWasteRefusalreason = params =>
  params.wasteAcceptationStatus === "PARTIALLY_REFUSED"
    ? {
        wasteRefusalReason: `Refus partiel: ${
          params.wasteRefusalReason
        } - Tonnage estimé de refus : ${getWasteQuantityRefused(
          params.wasteDetailsQuantity,
          params.quantityReceived
        )} tonnes`
      }
    : {};

const getEcoOrganismeName = (params: { ecoOrganismeName?: string }) => {
  return {
    ecoOrganismeName: params.ecoOrganismeName
      ? `Eco-organisme responsable:\n${params.ecoOrganismeName}`
      : undefined
  };
};

const processTransporterData = (data: MainFormParams) => ({
  ...data,
  transporterCompanySiren: data.transporterCompanySiret
    ? siretToSiren(data.transporterCompanySiret)
    : null
});

interface MainFormParams {
  customId?: string;
  noTraceability?: boolean;
  signedByTransporter?: boolean;
  sentAt?: string;
  processingOperationDone?: string;
  receivedBy?: string;
  transporterIsExemptedOfReceipt?: boolean;
  tempStorerSignedAt?: string;
  signedAt?: string;
  mode?: "ROAD" | "RAIL" | "AIR" | "RIVER" | "SEA";
  takenOverAt?: string;
  transporterCompanySiret?: string;
  isImportedFromPaper?: boolean;
}

export function processMainFormParams(params) {
  params = { ...params, ...getWasteRefusalreason(params) }; // compute refused quantity before converting number to strings
  const data = stringifyNumberFields(params);

  return [
    getEmitterType,
    getWasteDetailsConsistence,
    getWasteDetailsPackagings,
    getWasteDetailsNumberOfPackages,
    getWasteDetailsType,
    renameAndFormatMainFormFields,
    getAcceptationStatus,
    getEcoOrganismeName,
    getTemporaryStorageExistance,
    getTempStorerWasteDetailsType,
    processTransporterData
  ].reduce((acc, fn) => ({ ...acc, ...fn(acc) }), data);
}

// on appendix subforms, wasteDetailsQuantityReal checkbox is checked is quantityReceived is filled
const checkWasteDetailsQuantityReal = data =>
  !!data.quantityReceived ? { wasteDetailsQuantityReal: true } : {};

export function processAnnexParams(params) {
  const data = stringifyNumberFields(params);
  return {
    ...data,

    ...getWasteDetailsType(data),
    ...checkWasteDetailsQuantityReal(data),
    receivedAt: dateFmt(params.receivedAt)
  };
}

/**
 * Hide all emitter fields to a pdf viewer that is not part
 * of the appendix 2 form. It prevents the final destination
 * form accessing TTR commercial info.
 */
export async function hideEmitterFields(appendix2: Form, user: Express.User) {
  if (!user) {
    // may happen when the pdf is generated for DREAL after form is declined
    // or in case of road control
    return appendix2;
  }
  const {
    emitterCompanySiret,
    emitterCompanyName,
    emitterCompanyAddress,
    emitterCompanyContact,
    emitterCompanyMail,
    emitterCompanyPhone,
    ...rest
  } = appendix2;
  if (!(await isFormContributor(user, appendix2))) {
    return {
      ...rest,
      emitterCompanySiret: "",
      emitterCompanyName: "",
      emitterCompanyAddress: extractPostalCode(emitterCompanyAddress),
      emitterCompanyContact: "",
      emitterCompanyMail: "",
      emitterCompanyPhone: ""
    };
  }
  return appendix2;
}

function verboseMode(mode) {
  if (!mode) {
    return "";
  }
  return transportModeLabels[mode];
}
export function processSegment(segment) {
  const data = processMainFormParams(stringifyNumberFields(segment));
  return {
    ...data,
    takenOverAt: dateFmt(data.takenOverAt),
    mode: verboseMode(data.mode)
  };
}

/**
 * Fill a generated PDFDocument according to data and settings
 *
 */

export const fillFields = ({ data, settings, font, page, yOffset = 0 }) => {
  for (const [fieldName, content] of Object.entries(data)) {
    if (content === true) {
      checkBox({
        fieldName,
        settings: settings,
        font: font,
        page: page,
        yOffset
      });
    } else {
      const cont =
        typeof content === "string"
          ? content
          : settings[fieldName]?.content?.(data);

      if (typeof cont === "string") {
        drawText({
          fieldName,
          content: cont,
          settings: settings,
          font: font,
          page: page,
          yOffset
        });
      }
    }
  }
};

export const siretToSiren = (siren: string) => siren.slice(0, 9);
