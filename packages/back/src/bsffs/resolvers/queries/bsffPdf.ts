import {
  QueryBsffPdfArgs,
  QueryResolvers
} from "@trackdechets/codegen/src/back.gen";
import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsffOrNotFound } from "../../database";
import { isBsffContributor } from "../../permissions";
import { createPDFResponse } from "../../../common/pdf";
import { generateBsffPdf } from "../../pdf";
import { DownloadHandler } from "../../../routers/downloadRouter";

export const bsffPdfDownloadHandler: DownloadHandler<QueryBsffPdfArgs> = {
  name: "bsffPdf",
  handler: async (_, res, { id }) => {
    const bsff = await getBsffOrNotFound({ id });
    const readableStream = await generateBsffPdf(bsff);
    readableStream.pipe(createPDFResponse(res, bsff.id));
  }
};

const bsffPdf: QueryResolvers["bsffPdf"] = async (_, { id }, context) => {
  const user = checkIsAuthenticated(context);
  const bsff = await getBsffOrNotFound({ id });
  await isBsffContributor(user, bsff);

  return getFileDownload({
    handler: bsffPdfDownloadHandler.name,
    params: { id }
  });
};

export default bsffPdf;
