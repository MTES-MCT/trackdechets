import {
  QueryBsdasriPdfArgs,
  QueryResolvers
} from "../../../generated/graphql/types";
import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsdasriOrNotFound } from "../../database";
import { buildPdf } from "../../pdf/generator";
import { createPDFResponse } from "../../../common/pdf";
import { DownloadHandler } from "../../../routers/downloadRouter";
import { checkCanRead } from "../../permissions";

export const bsdasriPdfDownloadHandler: DownloadHandler<QueryBsdasriPdfArgs> = {
  name: "bsdasriPdf",
  handler: async (_, res, { id }) => {
    const bsdasri = await getBsdasriOrNotFound({ id });
    const readableStream = await buildPdf(bsdasri);
    readableStream.pipe(createPDFResponse(res, bsdasri.id));
  }
};

const bsdasriPdfResolver: QueryResolvers["bsdasriPdf"] = async (
  _,
  { id }: QueryBsdasriPdfArgs,
  context
) => {
  const user = checkIsAuthenticated(context);
  const dasri = await getBsdasriOrNotFound({ id });

  await checkCanRead(user, dasri);

  return getFileDownload({
    handler: bsdasriPdfDownloadHandler.name,
    params: { id }
  });
};

export default bsdasriPdfResolver;
