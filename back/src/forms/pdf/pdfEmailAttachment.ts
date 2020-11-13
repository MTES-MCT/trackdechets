import { prisma } from "../../generated/prisma-client";
import buildPdf from "./buildPdf";

/**
 * Render a pdf converted to base64 string to be sent via Mailjet API
 * @param {string} id - form id
 * @return {Promise}
 */
const pdfEmailAttachment = async id => {
  // retrieve form
  const form = await prisma.form({ id });

  const appendix2Forms = await prisma.form({ id: form.id }).appendix2Forms();
  const transportSegments = await prisma
    .form({ id: form.id })
    .transportSegments();
  const temporaryStorageDetail = await prisma
    .form({ id: form.id })
    .temporaryStorageDetail();

  try {
    const buffer = await buildPdf({
      ...form,
      appendix2Forms,
      transportSegments,
      temporaryStorageDetail
    });

    return {
      file: buffer.toString("base64"),
      name: `${form.readableId}.pdf`
    };
  } catch (err) {
    console.log("Erreur lors de la génération du PDF", err);
  }
};

export default pdfEmailAttachment;
