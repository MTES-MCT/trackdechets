import axios from "axios";
import { prisma } from "../generated/prisma-client";

type ResponseType = "arraybuffer" | "stream";

/**
 * Custom error to be handled
 */
class PdfDraftError extends Error {
  constructor(message: string) {
    super(message);
    // Set the prototype explicitly
    // cf. https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work.
    Object.setPrototypeOf(this, PdfDraftError.prototype);
  }
}

/**
 * Build a pdf converted to base64 string to be sent via Mailjet API
 * @param  form - A form instance queried from Prisma
 * @param {ResponseType} responseType - arraybuffer or stream
 * @return {Axios Promise}
 */
const buildPdf = async (form, responseType: ResponseType) => {
  if (form.status === "DRAFT") {
    throw new PdfDraftError("Impossible de générer un PDF pour un brouillon.");
  }

  const appendix2Forms = await prisma.form({ id: form.id }).appendix2Forms();
  return axios.post(
    "http://td-pdf:3201/pdf",
    { ...form, appendix2Forms },
    { responseType }
  );
};

/**
 * Render a form pdf as an HTTP response
 */
export async function downloadPdf(res, { id }) {
  if (!id) {
    return res.status(500).send("Identifiant du bordereau manquant.");
  }

  const form = await prisma.form({ id });

  return buildPdf(form, "stream")
    .then(response => {
      // set headers to keep downloaded file name on all browsers
      return response.data.pipe(res).set(response.headers);
    })
    .catch(err => {
      console.error(err);
      if (err instanceof PdfDraftError) {
        return res.status(500).send(err.message);
      }
      res.status(500).send("Erreur lors de la génération du PDF");
    });
}

/**
 * Render a pdf converted to base64 string to be sent via Mailjet API
 * @param {string} id - form id
 * @return {Promise}
 */
export const pdfEmailAttachment = async id => {
  // retrieve form
  const form = await prisma.form({ id });

  return buildPdf(form, "arraybuffer")
    .then(response => {
      return {
        file: Buffer.from(response.data, "binary").toString("base64"),
        name: `${form.readableId}.pdf`
      };
    })

    .catch(err => {
      console.log("Erreur lors de la génération du PDF", err);
    });
};
