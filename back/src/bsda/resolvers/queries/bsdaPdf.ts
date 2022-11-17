import { QueryBsdaPdfArgs } from "../../../generated/graphql/types";
import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import { createPDFResponse } from "../../../common/pdf";
import { getBsdaOrNotFound } from "../../database";
import { checkCanAccessBsdaPdf } from "../../permissions";
import { buildPdf } from "../../pdf/generator";
import { DownloadHandler } from "../../../routers/downloadRouter";
import { getBsdaRepository } from "../../repository";

export const bsdaPdfDownloadHandler: DownloadHandler<QueryBsdaPdfArgs> = {
  name: "bsdaPdf",
  handler: async (req, res, { id }) => {
    const bsda = await getBsdaRepository(req.user).findUnique({ id });
    const readableStream = await buildPdf(bsda);
    readableStream.pipe(createPDFResponse(res, bsda.id));
  }
};

export default async function bsdaPdf(_, { id }: QueryBsdaPdfArgs, context) {
  const user = checkIsAuthenticated(context);
  const bsda = await getBsdaOrNotFound(id, {
    include: { intermediaries: true }
  });

  await checkCanAccessBsdaPdf(user, bsda);

  return getFileDownload({
    handler: bsdaPdfDownloadHandler.name,
    params: { id }
  });
}
