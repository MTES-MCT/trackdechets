import { Response } from "express";
import prisma from "../../prisma";
import { buildPdf } from "./generator";

/**
 * Render a dasri pdf as an HTTP response
 */
export default async function downloadPdf(res: Response, { id }) {
  if (!id) {
    res.status(500).send("Identifiant du bordereau manquant.");
  }

  const bsdasri = await prisma.bsdasri.findUnique({
    where: { id }
  });

  try {
    const buffer = await buildPdf(bsdasri);
    res.status(200);
    res.type("html");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment;filename=${bsdasri.id}.html`
    );

    res.send(buffer);
  } catch (err) {
    console.log(err);

    res.status(500);
    res.send("Une erreur est survenue lors de la génération du PDF.");
  }
}
