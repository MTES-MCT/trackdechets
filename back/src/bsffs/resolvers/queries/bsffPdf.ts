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
import { buildPdf } from "../../pdf/generator";
import prisma from "../../../prisma";
import { UserInputError } from "apollo-server-core";
import { getReadonlyBsffPackagingRepository } from "../../repository";

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
    const { findPreviousPackagings } = getReadonlyBsffPackagingRepository();

    const previousPackagings = await findPreviousPackagings(
      bsff.packagings.map(p => p.id)
    );
    const previousBsffIds = [...new Set(previousPackagings.map(p => p.bsffId))];
    const previousBsffs = await prisma.bsff.findMany({
      where: { id: { in: previousBsffIds } },
      include: {
        // includes only packagings in the dependency graph of the BSFF
        packagings: { where: { id: { in: previousPackagings.map(p => p.id) } } }
      }
    });
    const readableStream = await buildPdf({ ...bsff, previousBsffs });
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
