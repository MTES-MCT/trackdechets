import { BsffResolvers } from "../../generated/graphql/types";
import { getFicheInterventions } from "../database";
import { dashboardOperationName } from "../../common/queries";
import { isSessionUser } from "../../auth";
import { expandBsffPackagingFromDB } from "../converter";
import { BsffPackaging, BsffType } from "@prisma/client";
import {
  getReadonlyBsffPackagingRepository,
  getReadonlyBsffRepository
} from "../repository";

export const Bsff: BsffResolvers = {
  ficheInterventions: async ({ id }, _, context) => {
    const { findUnique } = getReadonlyBsffRepository();
    const prismaBsff = await findUnique({
      where: { id }
    });
    const ficheInterventions = await getFicheInterventions({
      bsff: prismaBsff!,
      context
    });
    return ficheInterventions;
  },
  packagings: async (bsff, _, ctx) => {
    let packagings: BsffPackaging[] = [];
    // use ES indexed field when requested from dashboard
    if (
      ctx?.req?.body?.operationName === dashboardOperationName &&
      isSessionUser(ctx)
    ) {
      packagings = (bsff?.packagings as any) ?? [];
    }
    const { findUniqueGetPackagings } = getReadonlyBsffRepository();
    packagings =
      (await findUniqueGetPackagings(
        {
          where: { id: bsff.id }
        },
        { orderBy: { numero: "asc" } }
      )) ?? [];

    return packagings.map(packaging => expandBsffPackagingFromDB(packaging));
  },
  forwarding: async ({ id, type }) => {
    if (type !== BsffType.REEXPEDITION) {
      return [];
    }
    const { findUniqueGetPackagings } = getReadonlyBsffRepository();
    const { findPreviousPackagings } = getReadonlyBsffPackagingRepository();
    const packagings =
      (await findUniqueGetPackagings(
        {
          where: { id }
        },
        { select: { id: true } }
      )) ?? [];
    const forwarding = await findPreviousPackagings(
      packagings.map(p => p.id),
      1
    );
    return forwarding.map(p => expandBsffPackagingFromDB(p));
  },
  repackaging: async ({ id, type }) => {
    if (type !== BsffType.RECONDITIONNEMENT) {
      return [];
    }
    const { findUniqueGetPackagings } = getReadonlyBsffRepository();
    const { findPreviousPackagings } = getReadonlyBsffPackagingRepository();
    const packagings =
      (await findUniqueGetPackagings(
        {
          where: { id }
        },
        { select: { id: true } }
      )) ?? [];
    const repackaging = await findPreviousPackagings(
      packagings.map(p => p.id),
      1
    );
    return repackaging.map(p => expandBsffPackagingFromDB(p));
  },
  grouping: async ({ id, type }) => {
    if (type !== BsffType.GROUPEMENT) {
      return [];
    }
    const { findUniqueGetPackagings } = getReadonlyBsffRepository();
    const { findPreviousPackagings } = getReadonlyBsffPackagingRepository();
    const packagings =
      (await findUniqueGetPackagings(
        {
          where: { id }
        },
        { select: { id: true } }
      )) ?? [];
    const grouping = await findPreviousPackagings(
      packagings.map(p => p.id),
      1
    );
    return grouping.map(p => expandBsffPackagingFromDB(p));
  }
};
