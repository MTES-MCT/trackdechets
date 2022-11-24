import prisma from "../../prisma";
import { BsffResolvers } from "../../generated/graphql/types";
import { getFicheInterventions, getPreviousPackagings } from "../database";
import { dashboardOperationName } from "../../common/queries";
import { isSessionUser } from "../../auth";
import { expandBsffPackagingFromDB } from "../converter";
import { BsffType } from "@prisma/client";

export const Bsff: BsffResolvers = {
  ficheInterventions: async ({ id }, _, context) => {
    const prismaBsff = await prisma.bsff.findUnique({
      where: { id }
    });
    const ficheInterventions = await getFicheInterventions({
      bsff: prismaBsff,
      context
    });
    return ficheInterventions;
  },
  packagings: async (bsff, _, ctx) => {
    let packagings = [];
    // use ES indexed field when requested from dashboard
    if (
      ctx?.req?.body?.operationName === dashboardOperationName &&
      isSessionUser(ctx)
    ) {
      packagings = bsff?.packagings ?? [];
    } else {
      packagings = await prisma.bsff
        .findUnique({ where: { id: bsff.id } })
        .packagings({ orderBy: { numero: "asc" } });
    }
    return packagings.map(packaging => expandBsffPackagingFromDB(packaging));
  },
  forwarding: async ({ id, type }) => {
    if (type !== BsffType.REEXPEDITION) {
      return [];
    }
    const packagings = await prisma.bsff
      .findUnique({ where: { id } })
      .packagings({ select: { id: true } });
    const forwarding = await getPreviousPackagings(
      packagings.map(p => p.id),
      1
    );
    return forwarding.map(p => expandBsffPackagingFromDB(p));
  },
  repackaging: async ({ id, type }) => {
    if (type !== BsffType.RECONDITIONNEMENT) {
      return [];
    }
    const packagings = await prisma.bsff
      .findUnique({ where: { id } })
      .packagings({ select: { id: true } });
    const repackaging = await getPreviousPackagings(
      packagings.map(p => p.id),
      1
    );
    return repackaging.map(p => expandBsffPackagingFromDB(p));
  },
  grouping: async ({ id, type }) => {
    if (type !== BsffType.GROUPEMENT) {
      return [];
    }
    const packagings = await prisma.bsff
      .findUnique({ where: { id } })
      .packagings({ select: { id: true } });
    const grouping = await getPreviousPackagings(
      packagings.map(p => p.id),
      1
    );
    return grouping.map(p => expandBsffPackagingFromDB(p));
  }
};
