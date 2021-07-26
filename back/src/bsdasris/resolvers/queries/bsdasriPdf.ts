import { Request, Response } from "express";
import {
  QueryBsdasriPdfArgs,
  QueryResolvers
} from "../../../generated/graphql/types";
import {
  getFileDownloadToken,
  registerFileDownloader
} from "../../../common/file-download";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsdasriOrNotFound } from "../../database";
import { isDasriContributor } from "../../permissions";
import { buildPdf } from "../../pdf/generator";
import { createPDFResponse } from "../../../common/pdf";

const TYPE = "bsdasri_pdf";

// TODO: it would be better to declare the handlers directly in the download route
registerFileDownloader(TYPE, sendBsdasriPdf);

async function sendBsdasriPdf(
  req: Request,
  res: Response,
  { id }: { id: string }
) {
  const bsdasri = await getBsdasriOrNotFound({ id });
  const readableStream = await buildPdf(bsdasri);

  readableStream.pipe(createPDFResponse(res, bsdasri.id));
}

const bsdasriPdfResolver: QueryResolvers["formPdf"] = async (
  _,
  { id }: QueryBsdasriPdfArgs,
  context
) => {
  const user = checkIsAuthenticated(context);
  const dasri = await getBsdasriOrNotFound({ id });

  await isDasriContributor(user, dasri);

  return getFileDownloadToken({ type: TYPE, params: { id } }, sendBsdasriPdf);
};

export default bsdasriPdfResolver;
