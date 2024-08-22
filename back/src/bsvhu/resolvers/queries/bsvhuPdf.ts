import {
  QueryBsvhuPdfArgs,
  QueryResolvers
} from "../../../generated/graphql/types";
import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsvhuOrNotFound } from "../../database";
import { createPDFResponse } from "../../../common/pdf";
import { buildPdf } from "../../pdf/generator";
import { hasGovernmentReadAllBsdsPermOrThrow } from "../../../permissions";

import { DownloadHandler } from "../../../routers/downloadRouter";
import { checkCanRead } from "../../permissions";

export const bsvhuPdfDownloadHandler: DownloadHandler<QueryBsvhuPdfArgs> = {
  name: "bsvhuPdf",
  handler: async (_, res, { id }) => {
    const bsvhu = await getBsvhuOrNotFound(id);
    const readableStream = await buildPdf(bsvhu);
    readableStream.pipe(createPDFResponse(res, bsvhu.id));
  }
};

const formPdfResolver: QueryResolvers["bsvhuPdf"] = async (
  _,
  { id }: QueryBsvhuPdfArgs,
  context
) => {
  const user = checkIsAuthenticated(context);
  const bsvhu = await getBsvhuOrNotFound(id);

  if (!user.isAdmin && !user.governmentAccountId) {
    await checkCanRead(user, bsvhu);
  }
  if (user.governmentAccountId) {
    await hasGovernmentReadAllBsdsPermOrThrow(user);
  }

  return getFileDownload({
    handler: bsvhuPdfDownloadHandler.name,
    params: { id }
  });
};

export default formPdfResolver;
