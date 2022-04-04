import prisma from "../../../prisma";
import { QueryBsdaPdfArgs } from "@trackdechets/codegen/src/back.gen";
import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import { createPDFResponse } from "../../../common/pdf";
import { getBsdaOrNotFound } from "../../database";
import { checkIsBsdaContributor } from "../../permissions";
import { buildPdf } from "../../pdf/generator";
import { DownloadHandler } from "../../../routers/downloadRouter";

export const bsdaPdfDownloadHandler: DownloadHandler<QueryBsdaPdfArgs> = {
  name: "bsdaPdf",
  handler: async (_, res, { id }) => {
    const bsda = await prisma.bsda.findUnique({ where: { id } });
    const readableStream = await buildPdf(bsda);
    readableStream.pipe(createPDFResponse(res, bsda.id));
  }
};

export default async function bsdaPdf(_, { id }: QueryBsdaPdfArgs, context) {
  const user = checkIsAuthenticated(context);
  const form = await getBsdaOrNotFound(id);

  await checkIsBsdaContributor(
    user,
    form,
    "Vous n'êtes pas autorisé à accéder à ce bordereau"
  );

  return getFileDownload({
    handler: bsdaPdfDownloadHandler.name,
    params: { id }
  });
}
