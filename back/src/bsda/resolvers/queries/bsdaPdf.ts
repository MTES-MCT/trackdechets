import { Request, Response } from "express";
import prisma from "../../../prisma";
import { QueryBsdaPdfArgs } from "../../../generated/graphql/types";
import {
  getFileDownloadToken,
  registerFileDownloader
} from "../../../common/file-download";
import { checkIsAuthenticated } from "../../../common/permissions";
import { createPDFResponse } from "../../../common/pdf";
import { getBsdaOrNotFound } from "../../database";
import { checkIsBsdaContributor } from "../../permissions";
import { buildPdf } from "../../pdf/generator";

const TYPE = "bsda_pdf";

// TODO: it would be better to declare the handlers directly in the download route
registerFileDownloader(TYPE, sendBsdaPdf);

async function sendBsdaPdf(
  req: Request,
  res: Response,
  { id }: { id: string }
) {
  const bsda = await prisma.bsda.findUnique({ where: { id } });
  const readableStream = await buildPdf(bsda);

  readableStream.pipe(createPDFResponse(res, bsda.id));
}

export default async function bsdaPdf(_, { id }: QueryBsdaPdfArgs, context) {
  const user = checkIsAuthenticated(context);
  const form = await getBsdaOrNotFound(id);

  await checkIsBsdaContributor(
    user,
    form,
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );

  return getFileDownloadToken({ type: TYPE, params: { id } }, sendBsdaPdf);
}
