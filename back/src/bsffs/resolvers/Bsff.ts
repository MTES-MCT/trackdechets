import type { BsffResolvers } from "@td/codegen-back";
import { getFicheInterventions } from "../database";
import { isSessionUser } from "../../auth/auth";
import { expandBsffPackagingFromDB } from "../converter";
import { BsffType } from "@prisma/client";
import {
  getReadonlyBsffPackagingRepository,
  getReadonlyBsffRepository
} from "../repository";
import { isGetBsdsQuery } from "../../bsds/resolvers/queries/bsds";
import { BsffWithTransportersInclude } from "../types";

export const Bsff: BsffResolvers = {
  ficheInterventions: async ({ id }, _, context) => {
    const { findUnique } = getReadonlyBsffRepository();
    const prismaBsff = await findUnique({
      where: { id },
      include: BsffWithTransportersInclude
    });
    const ficheInterventions = await getFicheInterventions({
      bsff: prismaBsff!,
      context
    });
    return ficheInterventions;
  },
  packagings: async (bsff, _, ctx) => {
    // use ES indexed field when requested from dashboard
    if (isGetBsdsQuery(ctx) && isSessionUser(ctx)) {
      // Dans ce cas de figure, bsff.packagings est pré-calculé dans
      // bsffs/converter@expandBsffFromElastic, on peut donc renvoyer
      // directement le résultat
      return bsff.packagings;
    }
    const { findUniqueGetPackagings } = getReadonlyBsffRepository();
    const packagings =
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
