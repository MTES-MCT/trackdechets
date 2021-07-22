import { Request, Response } from "express";
import {
  QueryBsvhuPdfArgs,
  QueryResolvers
} from "../../../generated/graphql/types";
import {
  getFileDownloadToken,
  registerFileDownloader
} from "../../../common/file-download";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getFormOrFormNotFound } from "../../database";
import { checkIsFormContributor } from "../../permissions";
import { createPDFResponse } from "../../../common/pdf";
import { buildPdf } from "../../pdf/generator";
import prisma from "../../../prisma";

const TYPE = "vhu_form_pdf";

// TODO: it would be better to declare the handlers directly in the download route
registerFileDownloader(TYPE, sendBsvhuPdf);

async function sendBsvhuPdf(
  req: Request,
  res: Response,
  { id }: { id: string }
) {
  const bsvhu = await prisma.bsvhu.findUnique({ where: { id } });
  const readableStream = await buildPdf(bsvhu);

  readableStream.pipe(createPDFResponse(res, bsvhu.id));
}

const formPdfResolver: QueryResolvers["formPdf"] = async (
  _,
  { id }: QueryBsvhuPdfArgs,
  context
) => {
  const user = checkIsAuthenticated(context);
  const form = await getFormOrFormNotFound(id);

  await checkIsFormContributor(
    user,
    form,
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );

  return getFileDownloadToken({ type: TYPE, params: { id } }, sendBsvhuPdf);
};

export default formPdfResolver;
