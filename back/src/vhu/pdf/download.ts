import { Response } from "express";
import prisma from "../../prisma";
import { buildPdf } from "./generator";

/**
 * Render a form pdf as an HTTP response
 */
export default async function downloadPdf(res: Response, { id }) {
  if (!id) {
    res.status(500).send("Identifiant du bordereau manquant.");
  }

  const form = await prisma.vhuForm.findUnique({ where: { id } });

  try {
    const buffer = await buildPdf(form);
    res.status(200);
    res.type("pdf");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment;filename=${form.readableId}.pdf`
    );

    res.send(buffer);
  } catch (err) {
    res.status(500);
    res.send("Une erreur est survenue lors de la génération du PDF.");
  }
}
