import {
  QueryBsvhuPdfArgs,
  QueryResolvers
} from "../../../generated/graphql/types";
import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsvhuOrNotFound } from "../../database";
import { checkIsBsvhuContributor } from "../../permissions";
import { createPDFResponse } from "../../../common/pdf";
import { buildPdf } from "../../pdf/generator";

import { DownloadHandler } from "../../../routers/downloadRouter";

export const bsvhuPdfDownloadHandler: DownloadHandler<QueryBsvhuPdfArgs> = {
  name: "bsvhuPdf",
  handler: async (_, res, { id }) => {
    const bsvhu = await getBsvhuOrNotFound(id);
    const readableStream = await buildPdf(bsvhu);
    readableStream.pipe(createPDFResponse(res, bsvhu.id));
  }
};

const formPdfResolver: QueryResolvers["formPdf"] = async (
  _,
  { id }: QueryBsvhuPdfArgs,
  context
) => {
  const user = checkIsAuthenticated(context);
  const form = await getBsvhuOrNotFound(id);

  await checkIsBsvhuContributor(
    user,
    form,
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );

  return getFileDownload({
    handler: bsvhuPdfDownloadHandler.name,
    params: { id }
  });
};

export default formPdfResolver;
