import path from "path";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import fontkit from "@pdf-lib/fontkit";
import {
  processMainFormParams,
  fillFields,
  drawImage,
  processSegment,
  processAnnexParams
} from "./helpers";
import {
  pageHeight,
  mainFormFieldSettings,
  temporaryStorageDetailsFieldSettings,
  appendixFieldSettings,
  appendixHeaderFieldSettings,
  appendixYOffsets,
  transportSegmentSettings
} from "./settings";
import { Form } from "@prisma/client";
import prisma from "src/prisma";

const customIdTitleParams = { x: 220, y: 104, fontSize: 12 };
const multimodalYOffset = 85;
/**
 * Render a form as pdf
 * Loads a pdf template, adds text to fill fields and adds stamp images as overlays
 * @param params - payload
 * @return Buffer
 */
export const buildPdf = async (form: Form) => {
  const appendix2Forms = await prisma.form
    .findOne({ where: { id: form.id } })
    .appendix2Forms();
  const segments = await prisma.form
    .findOne({ where: { id: form.id } })
    .transportSegments();
  const temporaryStorageDetail = await prisma.form
    .findOne({ where: { id: form.id } })
    .temporaryStorageDetail();

  const params = { ...form, appendix2Forms, temporaryStorageDetail };

  const transportSegments = segments.sort(
    (a, b) => a.segmentNumber - b.segmentNumber
  );

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

  const existingAppendixBytes = fs.readFileSync(
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

  const paperSignatureBytes = fs.readFileSync(
    path.join(__dirname, "./medias/paper-signature.png")
  );
  const paperSignatureStamp = await mainForm.embedPng(paperSignatureBytes);

  // Start by generating the main page of the PDF
  // ----------------------------
  const formData = processMainFormParams({
    ...params,
    currentPageNumber: 1,
    totalPagesNumber: 1 + (params.temporaryStorageDetail ? 1 : 0),
    isMultimodal: !!segments.length
  });

  // customId does not belong to original cerfa, so we had to add our own field title and mimic font look and feel
  if (!!formData.customId) {
    firstPage.drawText("Autre n° libre :", {
      x: customIdTitleParams.x,
      y: pageHeight - customIdTitleParams.y,
      size: customIdTitleParams.fontSize,
      font: timesBoldFont
    });
  }

  // fill main form fields
  fillFields({
    data: formData,
    page: firstPage,
    settings: mainFormFieldSettings,
    font: arialFont
  });

  // draw watermark if needed
  if (!!process.env.PDF_WATERMARK) {
    drawImage({
      locationName: "watermark",
      image: watermarkImage,
      page: firstPage,
      dimensions: {
        width: 600,
        height: 800
      }
    });
  }
  if (!!formData.noTraceability) {
    drawImage({
      locationName: "noTraceabilityStamp",
      image: noTraceabilityImage,
      page: firstPage,
      dimensions: {
        width: 100,
        height: 50
      }
    });
  }

  if (!!formData.signedByTransporter) {
    if (!!formData.isImportedFromPaper) {
      drawImage({
        locationName: "transporterSignature",
        image: paperSignatureStamp,
        page: firstPage
      });
    } else {
      drawImage({
        locationName: "transporterSignature",
        image: stampImage,
        page: firstPage
      });
    }
  }
  if (!!formData.sentAt) {
    if (!!formData.isImportedFromPaper) {
      drawImage({
        locationName: "emitterSignature",
        image: paperSignatureStamp,
        page: firstPage
      });
    } else {
      drawImage({
        locationName: "emitterSignature",
        image: stampImage,
        page: firstPage
      });
    }
  }
  if (!!formData.processingOperationDone) {
    if (!!formData.isImportedFromPaper) {
      drawImage({
        locationName: "processingSignature",
        image: paperSignatureStamp,
        page: firstPage
      });
    } else {
      drawImage({
        locationName: "processingSignature",
        image: stampImage,
        page: firstPage
      });
    }
  }
  if (!!formData.receivedBy) {
    if (!!formData.isImportedFromPaper) {
      drawImage({
        locationName: "receivedSignature",
        image: paperSignatureStamp,
        page: firstPage
      });
    } else {
      drawImage({
        locationName: "receivedSignature",
        image: stampImage,
        page: firstPage
      });
    }
  }

  if (!!formData.transporterIsExemptedOfReceipt) {
    drawImage({
      locationName: "exemptionStamp",
      image: exemptionStampImage,
      page: firstPage,
      dimensions: {
        width: 150,
        height: 65
      }
    });
  }
  // Temporary storage and 2 first multimodal segments
  // ------------------------------------------------
  if (temporaryStorageDetail || !!transportSegments.length) {
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

    const temporaryStorageData = temporaryStorageDetail
      ? processMainFormParams({
          ...temporaryStorageDetail,
          tempStorerCompanySiret: params.recipientCompanySiret,
          tempStorerCompanyAddress: params.recipientCompanyAddress,
          tempStorerCompanyName: params.recipientCompanyName,
          wasteAcceptationStatus:
            params.temporaryStorageDetail?.tempStorerWasteAcceptationStatus,
          sentAt: params.temporaryStorageDetail.signedAt,
          currentPageNumber: 2,
          totalPagesNumber: 2,
          formReadableId: params.readableId
        })
      : {};
    if (temporaryStorageData) {
      // fill form data
      fillFields({
        data: temporaryStorageData,
        page: tempStoragePage,
        settings: temporaryStorageDetailsFieldSettings,
        font: temporaryStorageArialFont
      });
    }

    if (!!transportSegments) {
      for (const segment of transportSegments.slice(0, 2)) {
        fillFields({
          data: processSegment(segment),
          page: tempStoragePage,
          settings: transportSegmentSettings,
          font: temporaryStorageArialFont,
          yOffset: multimodalYOffset * (segment.segmentNumber - 1)
        });

        if (!!segment.takenOverAt) {
          drawImage({
            locationName: "takenOverSignature",
            image: tempStorageStampImage,
            page: tempStoragePage,
            yOffset: multimodalYOffset * (segment.segmentNumber - 1)
          });
        }
      }
    }

    // draw watermark if needed
    if (!!process.env.PDF_WATERMARK) {
      drawImage({
        locationName: "watermark",
        image: temporaryStorageWatermarkImage,
        page: tempStoragePage,
        dimensions: {
          width: 600,
          height: 800
        }
      });
    }

    if (!!temporaryStorageData.tempStorerSignedAt) {
      drawImage({
        locationName: "tempStorerReceptionSignature",
        image: tempStorageStampImage,
        page: tempStoragePage
      });
    }

    if (!!temporaryStorageData.signedAt) {
      drawImage({
        locationName: "tempStorerSentSignature",
        image: tempStorageStampImage,
        page: tempStoragePage
      });
    }

    if (!!temporaryStorageData.signedByTransporter) {
      drawImage({
        locationName: "tempStorageTransporterSignature",
        image: tempStorageStampImage,
        page: tempStoragePage
      });
    }

    const [
      copiedTempStoragePage
    ] = await mainForm.copyPages(tempStorageDetailsPdf, [0]);
    mainForm.addPage(copiedTempStoragePage);
  }

  // Additional segments pages (if more than 2)
  // ------------------------------------------------
  if (transportSegments.length > 2) {
    const remainingSegments = transportSegments.slice(2); // we already built a page with first 2 segments

    const transportSegmentsFormsByPage = 2;
    const transportSegmentsFormsCount = remainingSegments.length;
    const transportSegmentsPageCount =
      Math.ceil(transportSegmentsFormsCount / transportSegmentsFormsByPage) - 1; // how many multimodal pages do we need

    let subFormCounter = 0; // each appendix page can hold up to 2 sub-forms, let's use a counter
    for (
      let sheetCounter = 0;
      sheetCounter <= transportSegmentsPageCount;
      sheetCounter++
    ) {
      const multimodalPages = await PDFDocument.load(
        existingTemporaryStorageBytes
      );
      multimodalPages.registerFontkit(fontkit);
      const multimodalFont = await multimodalPages.embedFont(arialBytes);
      const multimodalWatermarkImage = await multimodalPages.embedPng(
        watermarkBytes
      );
      const multimodalStampImage = await multimodalPages.embedPng(stampBytes);

      const currentMultimodalPage = multimodalPages.getPages()[0];

      const remaining =
        transportSegmentsFormsCount -
        sheetCounter * transportSegmentsFormsByPage; // how many sub forms left
      const lastPageFormsCount = Math.min(
        remaining,
        transportSegmentsFormsByPage
      ); // if we have less than 2 forms on the last page

      for (
        let pageSubFormCounter = 0;
        pageSubFormCounter <= lastPageFormsCount - 1;
        pageSubFormCounter++
      ) {
        subFormCounter =
          pageSubFormCounter + sheetCounter * transportSegmentsFormsByPage;
        const segment = remainingSegments[subFormCounter];
        const yOffset = multimodalYOffset * pageSubFormCounter;

        fillFields({
          data: processSegment(segment),
          page: currentMultimodalPage,
          settings: transportSegmentSettings,
          font: multimodalFont,
          yOffset
        });

        if (!!segment.takenOverAt) {
          drawImage({
            locationName: "takenOverSignature",
            image: multimodalStampImage,
            page: currentMultimodalPage,
            yOffset
          });
        }

        // draw watermark if needed
        if (!!process.env.PDF_WATERMARK) {
          drawImage({
            locationName: "watermark",
            image: multimodalWatermarkImage,
            page: currentMultimodalPage,
            dimensions: {
              width: 600,
              height: 800
            }
          });
        }
      }
      const [copiedMultimodalPage] = await mainForm.copyPages(multimodalPages, [
        0
      ]);
      mainForm.addPage(copiedMultimodalPage);
    }
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
    const appendixPages = await PDFDocument.load(existingAppendixBytes);
    appendixPages.registerFontkit(fontkit);
    const appendixArialFont = await appendixPages.embedFont(arialBytes);
    const currentAppendixPage = appendixPages.getPages()[0];
    const appendixWatermarkImage = await appendixPages.embedPng(watermarkBytes);

    // fill appendix header
    fillFields({
      data: formData,
      page: currentAppendixPage,
      settings: appendixHeaderFieldSettings,
      font: appendixArialFont
    });

    const remaining = appendix2FormsCount - sheetCounter * formsByAppendix; // how many sub forms left
    const lastPageFormsCount = Math.min(remaining, formsByAppendix); // if we have less than 5 forms on the last page
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
        numbering: `${subFormCounter + 1}`
      };
      // to avoid using coordinates for each one of the 5 subForms, we add a vertical offset
      const yOffset = appendixYOffsets[pageSubFormCounter];

      // fill sub form data
      fillFields({
        data: appendix,
        page: currentAppendixPage,
        settings: appendixFieldSettings,
        font: appendixArialFont,
        yOffset: yOffset
      });
    }

    // draw watermark if needed
    if (!!process.env.PDF_WATERMARK) {
      drawImage({
        locationName: "watermark",
        image: appendixWatermarkImage,
        page: currentAppendixPage,
        dimensions: {
          width: 600,
          height: 800
        }
      });
    }

    // copy each page and merge in global pdf
    const copiedAppendixPages = await mainForm.copyPages(appendixPages, [0]);
    mainForm.addPage(copiedAppendixPages[0]);
  }

  // finally save document and return it
  const pdfBytes = await mainForm.save();
  return Buffer.from(pdfBytes.buffer);
};

export async function buildPdfBase64(form: Form) {
  const buffer = await buildPdf(form);
  return buffer.toString("base64");
}
