const path = require("path");
const hummus = require("hummus");
const fillForm = require("./filler").fillForm;

const imgParams = { transformation: { width: 90, proportional: true } };

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
const getWasteDetailsConsistence = params => ({
  [`wasteDetailsConsistence${capitalize(params.wasteDetailsConsistence)}`]: true
});

const renameAndFormatFields = params => ({
  transporterValidityLimit: dateFmt(params.transporterValidityLimit),
  traderValidityLimit: dateFmt(params.traderValidityLimit),
  recipientCompanySiret10: params.recipientCompanySiret,
  recipientCompanyName10: params.recipientCompanyName,
  recipientCompanyAddress10: params.recipientCompanyAddress,
  recipientCompanyPhone10: params.recipientCompanyPhone,
  recipientCompanyMail10: params.recipientCompanyMail,
  recipientCompanyContact10: params.recipientCompanyContact,
  sentAt8: dateFmt(params.sentAt),
  sentAt9: dateFmt(params.sentAt),
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
const getWasteDetailsPackagings = params =>
  params.wasteDetailsPackagings.reduce(function(acc, elem) {
    let key = `wasteDetailsPackagings${capitalize(elem)}`;
    return {
      ...acc,
      [key]: true
    };
  }, {});

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
 * It takes a pdf templates with dynamic fields, fills them and adds stamp images as overlays.
 * @param params - payload
 * @param res - response
 */
function write(params, res) {
  let inputStream = new hummus.PDFRStreamForFile(
    path.join(__dirname, "../templates/bsd.pdf")
  );

  let writer = hummus.createWriterToModify(
    inputStream,
    new hummus.PDFStreamForResponse(res)
  );
  const formData = process(params);
  fillForm(writer, formData);

  let pageModifier = new hummus.PDFPageModifier(writer, 0, true);
  let ctx = pageModifier.startContext().getContext();
  if (!!formData.signedByTransporter) {
    ctx.drawImage(
      450,
      310,
      path.join(__dirname, "../medias/stamp.png"),
      imgParams
    );
  }
  if (!!formData.sentAt) {
    ctx.drawImage(450, 248, "./medias/stamp.png", imgParams);
  }
  if (!!formData.processingOperationDone) {
    ctx.drawImage(450, 110, "./medias/stamp.png", imgParams);
  }
  if (!!formData.receivedBy) {
    ctx.drawImage(200, 110, "./medias/stamp.png", imgParams);
  }

  if (!!formData.transporterIsExemptedOfReceipt) {
    ctx.drawImage(450, 345, "./medias/exempt.png", imgParams);
  }

  pageModifier.endContext().writePage();

  writer.end();
  res.end(writer);
}

module.exports = write;
