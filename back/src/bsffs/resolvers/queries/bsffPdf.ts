import {
  QueryBsffPdfArgs,
  QueryResolvers
} from "../../../generated/graphql/types";
import { getFileDownload } from "../../../common/fileDownload";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsffOrNotFound, getPreviousPackagings } from "../../database";
import { checkCanReadBsff } from "../../permissions";
import { createPDFResponse } from "../../../common/pdf";
import { DownloadHandler } from "../../../routers/downloadRouter";
import { buildPdf } from "../../pdf/generator";
import prisma from "../../../prisma";
import { UserInputError } from "apollo-server-core";

export const bsffPdfDownloadHandler: DownloadHandler<QueryBsffPdfArgs> = {
  name: "bsffPdf",
  handler: async (_, res, { id }) => {
    const bsff = await prisma.bsff.findUnique({
      where: { id },
      include: {
        ficheInterventions: true,
        packagings: true
      }
    });
    if (bsff == null) {
      throw new UserInputError(`Le BSFF n°${id} n'existe pas.`);
    }
    const previousPackagings = await getPreviousPackagings(
      bsff.packagings.map(p => p.id)
    );
    const previousBsffIds = [...new Set(previousPackagings.map(p => p.bsffId))];
    const previousBsffs = await prisma.bsff.findMany({
      where: { id: { in: previousBsffIds } },
      include: { packagings: true }
    });
    const readableStream = await buildPdf({ ...bsff, previousBsffs });
    readableStream.pipe(createPDFResponse(res, bsff.id));
  }
};

const bsffPdf: QueryResolvers["bsffPdf"] = async (_, { id }, context) => {
  const user = checkIsAuthenticated(context);
  const bsff = await getBsffOrNotFound({ id });
  await checkCanReadBsff(user, bsff);

  return getFileDownload({
    handler: bsffPdfDownloadHandler.name,
    params: { id }
  });
};

export default bsffPdf;
