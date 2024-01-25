import { QueryBsdaPdfArgs } from "../../../generated/graphql/types";
import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import { createPDFResponse } from "../../../common/pdf";
import { getBsdaOrNotFound } from "../../database";
import { BsdaForPDFInclude, buildPdf } from "../../pdf/generator";
import { DownloadHandler } from "../../../routers/downloadRouter";
import { getReadonlyBsdaRepository } from "../../repository";
import { checkCanReadPdf } from "../../permissions";

export const bsdaPdfDownloadHandler: DownloadHandler<QueryBsdaPdfArgs> = {
  name: "bsdaPdf",
  handler: async (_, res, { id }) => {
    const bsda = await getReadonlyBsdaRepository().findUnique(
      { id },
      { include: BsdaForPDFInclude }
    );
    const readableStream = await buildPdf(bsda);
    readableStream.pipe(createPDFResponse(res, bsda.id));
  }
};

export default async function bsdaPdf(_, { id }: QueryBsdaPdfArgs, context) {
  const user = checkIsAuthenticated(context);
  const bsda = await getBsdaOrNotFound(id, { include: { transporters: true } });

  await checkCanReadPdf(user, bsda);

  return getFileDownload({
    handler: bsdaPdfDownloadHandler.name,
    params: { id }
  });
}
