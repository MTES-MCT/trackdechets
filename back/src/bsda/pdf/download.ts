import { Response, Request } from "express";
import prisma from "../../prisma";
import { buildPdf } from "./generator";

/**
 * Render a pdf as an HTTP response
 */
export default async function downloadPdf(
  _req: Request,
  res: Response,
  { id }
) {
  if (!id) {
    res.status(500).send("Identifiant du bordereau manquant.");
  }

  const bsda = await prisma.bsda.findUnique({
    where: { id }
  });

  const buffer = await buildPdf(bsda);
  res.status(200);
  res.type("html");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment;filename=${bsda.id}.pdf`);

  res.send(buffer);
}
