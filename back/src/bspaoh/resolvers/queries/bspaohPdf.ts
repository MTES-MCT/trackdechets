import { QueryBspaohPdfArgs } from "../../../generated/graphql/types";
import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import { createPDFResponse } from "../../../common/pdf";
import { getBspaohOrNotFound } from "../../database";
import { buildPdf } from "../../pdf/generator";
import { DownloadHandler } from "../../../routers/downloadRouter";

import { checkCanReadPdf } from "../../permissions";

export const bspaohPdfDownloadHandler: DownloadHandler<QueryBspaohPdfArgs> = {
  name: "bspaohPdf",
  handler: async (_, res, { id }) => {
    const bspaoh = await getBspaohOrNotFound({ id });
    const readableStream = await buildPdf(bspaoh);
    readableStream.pipe(createPDFResponse(res, bspaoh.id));
  }
};

export default async function bspaohPdf(
  _,
  { id }: QueryBspaohPdfArgs,
  context
) {
  const user = checkIsAuthenticated(context);
  const bspaoh = await getBspaohOrNotFound({ id });

  await checkCanReadPdf(user, bspaoh);

  return getFileDownload({
    handler: bspaohPdfDownloadHandler.name,
    params: { id }
  });
}
