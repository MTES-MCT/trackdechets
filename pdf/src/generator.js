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

  // Start by generating the main page of the PDF
  // ----------------------------
  const formData = processMainFormParams({
    ...params,
    currentPageNumber: 1,
    totalPagesNumber: 1 + (params.temporaryStorageDetail ? 1 : 0),
  });

  // customId does not belong to original cerfa, so we had to add our own field title and mimic font look and feel
  if (!!formData.customId) {
    firstPage.drawText("Autre n° libre :", {
      x: customIdTitleParams.x,
      y: pageHeight - customIdTitleParams.y,
      size: customIdTitleParams.fontSize,
      font: timesBoldFont,
    });
  }

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

  // Temporary storage page
  // ----------------------
  if (temporaryStorageDetail) {
    const tempStorageDetailsPdf = await PDFDocument.load(
      existingTemporaryStorageBytes
    );
    tempStorageDetailsPdf.registerFontkit(fontkit);
    const temporaryStorageArialFont = await tempStorageDetailsPdf.embedFont(
      arialBytes
    );
    const temporaryStorageWatermarkImage = await tempStorageDetailsPdf.embedPng(
      watermarkBytes
    );
    const tempStorageStampImage = await tempStorageDetailsPdf.embedPng(
      stampBytes
    );

    const [tempStoragePage] = tempStorageDetailsPdf.getPages();

    const temporaryStorageData = processMainFormParams({
      ...temporaryStorageDetail,
      tempStorerCompanySiret: params.recipientCompanySiret,
      tempStorerCompanyAddress: params.recipientCompanyAddress,
      tempStorerCompanyName: params.recipientCompanyName,
      wasteAcceptationStatus:
        params.temporaryStorageDetail.tempStorerWasteAcceptationStatus,
      sentAt: params.temporaryStorageDetail.signedAt,
      currentPageNumber: 2,
      totalPagesNumber: 2,
      formReadableId: params.readableId,
    });

    // fill form data
    fillFields({
      data: temporaryStorageData,
      page: tempStoragePage,
      settings: temporaryStorageDetailsFieldSettings,
      font: temporaryStorageArialFont,
    });

    // draw watermark if needed
    if (!!process.env.PDF_WATERMARK) {
      drawImage("watermark", temporaryStorageWatermarkImage, tempStoragePage, {
        width: 600,
        height: 800,
      });
    }

    if (!!temporaryStorageData.tempStorerSignedAt) {
      drawImage(
        "tempStorerReceptionSignature",
        tempStorageStampImage,
        tempStoragePage
      );
    }

    if (!!temporaryStorageData.signedAt) {
      drawImage(
        "tempStorerSentSignature",
        tempStorageStampImage,
        tempStoragePage
      );
    }

    if (!!temporaryStorageData.signedByTransporter) {
      drawImage(
        "tempStorageTransporterSignature",
        tempStorageStampImage,
        tempStoragePage
      );
    }

    const [
      copiedTempStoragePage,
    ] = await mainForm.copyPages(tempStorageDetailsPdf, [0]);
    mainForm.addPage(copiedTempStoragePage);
  }

  // early return pdf if there is no appendix
  if (!appendix2Forms.length) {
    const mainFormBytes = await mainForm.save();
    return Buffer.from(mainFormBytes.buffer);
  }

  // Time to append the appendix 2 pages
  // ----------------------------
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
    let copiedAppendixPages = await mainForm.copyPages(appendixPages, [0]);
    mainForm.addPage(copiedAppendixPages[0]);
  }

  // finally save document and return it
  const pdfBytes = await mainForm.save();
  return Buffer.from(pdfBytes.buffer);
};

module.exports = buildPdf;
