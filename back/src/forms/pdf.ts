import axios from "axios";
import { prisma } from "../generated/prisma-client";

export const pdfHandler = async (req, res) => {
  const { id } = req.query;
  const form = await prisma.form({ id });

  if (form.status === "DRAFT") {
    return res
      .status(500)
      .send("Impossible de générer un PDF pour un brouillon.");
  }

  const appendix2Forms = await prisma.form({ id }).appendix2Forms();
  return axios
    .post(
      "http://td-pdf:3201/pdf",
      { ...form, appendix2Forms },
      { responseType: "stream" }
    )
    .then(response => response.data.pipe(res))
    .catch(err => {
      console.error(err);
      res.status(500).send("Erreur lors de la génération du PDF");
    });
};

/**
 * Build a pdf converted to base64 string to be sent via Mailjet API
 * @param {string} id - form id
 * @return {Promise}
 */
export const pdfAttachment = async id => {
  // retrieve form
  const form = await prisma.form({ id });

  if (form.status === "DRAFT") {
    console.log("Impossible de générer un PDF pour un brouillon.");
    return;
  }

  const appendix2Forms = await prisma.form({ id }).appendix2Forms();
  // Request pdf to td-pdf service, then build a base64 string and return an object containing
  // file and its name (readableID + pdf extension)
  return axios
    .post(
      "http://td-pdf:3201/pdf",
      { ...form, appendix2Forms },
      { responseType: "arraybuffer" }
    )
    .then(response => ({
      file: Buffer.from(response.data, "binary").toString("base64"),
      name: `${form.readableId}.pdf`
    }))

    .catch(err => {
      console.log("Erreur lors de la génération du PDF", err);
    });
};
