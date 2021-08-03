import { Request, Response } from "express";
import { QueryResolvers } from "../../../generated/graphql/types";
import {
  getFileDownloadToken,
  registerFileDownloader
} from "../../../common/file-download";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsffOrNotFound } from "../../database";
import { isBsffContributor } from "../../permissions";
import { createPDFResponse } from "../../../common/pdf";
import { generateBsffPdf } from "../../pdf";

const TYPE = "bsff_pdf";

// TODO: it would be better to declare the handlers directly in the download route
registerFileDownloader(TYPE, sendBsffPdf);

async function sendBsffPdf(
  req: Request,
  res: Response,
  { id }: { id: string }
) {
  const bsff = await getBsffOrNotFound({ id });
  const readableStream = await generateBsffPdf(bsff);

  readableStream.pipe(createPDFResponse(res, bsff.id));
}

const bsffPdf: QueryResolvers["bsffPdf"] = async (_, { id }, context) => {
  const user = checkIsAuthenticated(context);
  const bsff = await getBsffOrNotFound({ id });
  await isBsffContributor(user, bsff);

  return getFileDownloadToken({ type: TYPE, params: { id } }, sendBsffPdf);
};

export default bsffPdf;
