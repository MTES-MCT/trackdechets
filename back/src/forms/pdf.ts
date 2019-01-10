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

  return axios
    .post("http://td-pdf:3000/pdf", form)
    .then(response => response.data.pipe(res))
    .catch(_ => res.status(500).send("Erreur lors de la génération du PDF"));
};
