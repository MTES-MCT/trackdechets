const path = require("path");
const pdflib = require("pdf-lib");
const fs = require("fs");
const fontkit = require("@pdf-lib/fontkit");
const {
  processMainFormParams,
  fillFields,
  drawImage,
  checkBox,
  processAnnexParams,
} = require("./helpers");
const {
  pageHeight,
  mainFormFieldSettings,
  temporaryStorageDetailsFieldSettings,
  appendixFieldSettings,
  appendixHeaderFieldSettings,
  appendixYOffsets,
} = require("./settings");

const { PDFDocument } = pdflib;

const customIdTitleParams = { x: 220, y: 104, fontSize: 12 };

/**
 * Render a form as pdf
 * Loads a pdf template, adds text to fill fields and adds stamp images as overlays
 * @param params - payload
 * @return Buffer
 */
const buildPdf = async (params) => {
  const { appendix2Forms, temporaryStorageDetail } = params;

  const formData = processMainFormParams(params);
  const arialBytes = fs.readFileSync(path.join(__dirname, "./fonts/arial.ttf"));
  const timesBoldBytes = fs.readFileSync(
    path.join(__dirname, "./fonts/times-bold.ttf")
  );

  const existingPdfBytes = fs.readFileSync(
    path.join(__dirname, "./templates/bsd.pdf")
  );

  const existingTemporaryStorageBytes = fs.readFileSync(
    path.join(__dirname, "./templates/bsd_suite.pdf")
  );

  const existingAnnexBytes = fs.readFileSync(
    path.join(__dirname, "./templates/appendix2.pdf")
  );

  const mainForm = await PDFDocument.load(existingPdfBytes);

  mainForm.registerFontkit(fontkit);
  const arialFont = await mainForm.embedFont(arialBytes);
  const timesBoldFont = await mainForm.embedFont(timesBoldBytes);

  const pages = mainForm.getPages();
  const firstPage = pages[0];

  const stampBytes = fs.readFileSync(
    path.join(__dirname, "./medias/stamp.png")
  );
  const stampImage = await mainForm.embedPng(stampBytes);

  const exemptionStampBytes = fs.readFileSync(
    path.join(__dirname, "./medias/exempt.png")
  );
  const exemptionStampImage = await mainForm.embedPng(exemptionStampBytes);

  const noTraceabilityBytes = fs.readFileSync(
    path.join(__dirname, "./medias/no-traceability.png")
  );
  const noTraceabilityImage = await mainForm.embedPng(noTraceabilityBytes);

  const watermarkBytes = fs.readFileSync(
    path.join(__dirname, "./medias/watermark.png")
  );
  const watermarkImage = await mainForm.embedPng(watermarkBytes);

  // customId does not belong to original cerfa, so we had to add our own field title and mimic font look and feel
  if (!!formData.customId) {
    firstPage.drawText("Autre n° libre :", {
      x: customIdTitleParams.x,
      y: pageHeight - customIdTitleParams.y,
      size: customIdTitleParams.fontSize,
      font: timesBoldFont,
    });
  }
  checkBox({
    fieldName: "temporaryStorageNo",
    settings: mainFormFieldSettings,
    font: arialFont,
    page: firstPage,
  });

  // fill main form fields
  fillFields({
    data: formData,
    page: firstPage,
    settings: mainFormFieldSettings,
    font: arialFont,
  });

  // draw watermark if needed
  if (!!process.env.PDF_WATERMARK) {
    drawImage("watermark", watermarkImage, firstPage, {
      width: 600,
      height: 800,
    });
  }
  if (!!formData.noTraceability) {
    drawImage("noTraceabilityStamp", noTraceabilityImage, firstPage, {
      width: 100,
      height: 50,
    });
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
    drawImage("exemptionStamp", exemptionStampImage, firstPage, {
      width: 150,
      height: 65,
    });
  }

  if (temporaryStorageDetail) {
    const temporaryStorageDetailsPdf = await PDFDocument.load(
      existingTemporaryStorageBytes
    );
    temporaryStorageDetailsPdf.registerFontkit(fontkit);
    const temporaryStorageArialFont = await temporaryStorageDetailsPdf.embedFont(
      arialBytes
    );
    const temporaryStorageWatermarkImage = await temporaryStorageDetailsPdf.embedPng(
      watermarkBytes
    );
    const currentTemporaryStoragePage = temporaryStorageDetailsPdf.getPages()[0];

    const tempraryStorageData = processMainFormParams({
      ...temporaryStorageDetail,
      tempStorerCompanySiret: params.recipientCompanySiret,
      tempStorerCompanyAddress: params.recipientCompanyAddress,
      tempStorerCompanyName: params.recipientCompanyName,
      wasteAcceptationStatus: params.tempStorerWasteAcceptationStatus,
    });

    console.log(tempraryStorageData);
    // fill form data
    fillFields({
      data: tempraryStorageData,
      page: currentTemporaryStoragePage,
      settings: temporaryStorageDetailsFieldSettings,
      font: temporaryStorageArialFont,
    });

    // draw watermark if needed
    if (!!process.env.PDF_WATERMARK) {
      drawImage(
        "watermark",
        temporaryStorageWatermarkImage,
        currentTemporaryStoragePage,
        {
          width: 600,
          height: 800,
        }
      );
    }
    if (!!tempraryStorageData.tempStorerSignedAt) {
      drawImage(
        "tempStorerReceptionSignature",
        stampImage,
        currentTemporaryStoragePage
      );
    }

    if (!!tempraryStorageData.signedAt) {
      drawImage(
        "tempStorerSentSignature",
        stampImage,
        currentTemporaryStoragePage
      );
    }

    const copiedPage = await mainForm.copyPages(temporaryStorageDetailsPdf, [
      0,
    ]);
    mainForm.addPage(copiedPage[0]);
  }

  // early return pdf if there is no appendix
  if (!appendix2Forms.length) {
    const mainFormBytes = await mainForm.save();
    return Buffer.from(mainFormBytes.buffer);
  }

  // if we have appendix, we have to merge mainform and appendix in another pdf
  const mergedPdf = await PDFDocument.create();
  const copiedPages = await mergedPdf.copyPages(mainForm, [0]);
  mergedPdf.addPage(copiedPages[0]);

  const formsByAppendix = 5;
  const appendix2FormsCount = appendix2Forms.length;
  const appendixPagesCount = Math.trunc(appendix2FormsCount / formsByAppendix); // how many appendix pages do we need

  let subFormCounter = 0; // each appendix page can hold up to 5 sub-forms, let's use a counter

  for (
    let sheetCounter = 0;
    sheetCounter <= appendixPagesCount;
    sheetCounter++
  ) {
    // create a pdf doc for each appendix, we'll merge it after filling
    let appendixPages = await PDFDocument.load(existingAnnexBytes);
    appendixPages.registerFontkit(fontkit);
    let appendixArialFont = await appendixPages.embedFont(arialBytes);
    let currentAppendixPage = appendixPages.getPages()[0];
    let appendixWatermarkImage = await appendixPages.embedPng(watermarkBytes);

    // fill appendix header
    fillFields({
      data: formData,
      page: currentAppendixPage,
      settings: appendixHeaderFieldSettings,
      font: appendixArialFont,
    });

    let remaining = appendix2FormsCount - sheetCounter * formsByAppendix; // how many sub forms left
    let lastPageFormsCount = Math.min(remaining, formsByAppendix); // if we have less than 5 forms on the last page
    for (
      let pageSubFormCounter = 0;
      pageSubFormCounter <= lastPageFormsCount - 1;
      pageSubFormCounter++
    ) {
      // iterate over current appendix page subform
      subFormCounter = pageSubFormCounter + sheetCounter * formsByAppendix;

      let appendix = appendix2Forms[subFormCounter];
      // process each annex and add numbering
      appendix = {
        ...processAnnexParams(appendix),
        numbering: `${subFormCounter + 1}`,
      };
      // to avoid using coordinates for each one of the 5 subForms, we add a vertical offset
      let yOffset = appendixYOffsets[pageSubFormCounter];

      // fill sub form data
      fillFields({
        data: appendix,
        page: currentAppendixPage,
        settings: appendixFieldSettings,
        font: appendixArialFont,
        yOffset: yOffset,
      });
    }

    // draw watermark if needed
    if (!!process.env.PDF_WATERMARK) {
      drawImage("watermark", appendixWatermarkImage, currentAppendixPage, {
        width: 600,
        height: 800,
      });
    }

    // copy each page and merge in global pdf
    let copiedAppendixPages = await mergedPdf.copyPages(appendixPages, [0]);
    mergedPdf.addPage(copiedAppendixPages[0]);
  }

  // finally save merged document and return it
  const pdfBytes = await mergedPdf.save();
  return Buffer.from(pdfBytes.buffer);
};

module.exports = buildPdf;
