import {
  QueryBsffPdfArgs,
  QueryResolvers
} from "../../../generated/graphql/types";
import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsffOrNotFound } from "../../database";
import { checkCanRead } from "../../permissions";
import { createPDFResponse } from "../../../common/pdf";
import { DownloadHandler } from "../../../routers/downloadRouter";
import { buildPdf, getBsffForBuildPdf } from "../../pdf/generator";

export const bsffPdfDownloadHandler: DownloadHandler<QueryBsffPdfArgs> = {
  name: "bsffPdf",
  handler: async (_, res, { id }) => {
    const bsff = await getBsffForBuildPdf({ id });
    const readableStream = await buildPdf(bsff);
    readableStream.pipe(createPDFResponse(res, bsff.id));
  }
};

const bsffPdf: QueryResolvers["bsffPdf"] = async (_, { id }, context) => {
  const user = checkIsAuthenticated(context);
  const bsff = await getBsffOrNotFound({ id });
  await checkCanRead(user, bsff);

  return getFileDownload({
    handler: bsffPdfDownloadHandler.name,
    params: { id }
  });
};

export default bsffPdf;
