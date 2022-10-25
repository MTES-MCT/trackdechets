import prisma from "../../prisma";
import { BsffResolvers } from "../../generated/graphql/types";
import { isBsffContributor } from "../permissions";
import { ForbiddenError } from "apollo-server-express";
import { Bsff } from "./Bsff";

export const InitialBsff: BsffResolvers = {
  packagings: Bsff.packagings,
  ficheInterventions: Bsff.ficheInterventions,
  emitter: async ({ id, emitter }, _, { user }) => {
    const bsff = await prisma.bsff.findUnique({ where: { id } });
    try {
      await isBsffContributor(user, bsff);
    } catch (err) {
      throw new ForbiddenError(
        `Vous ne pouvez pas accéder au champ "emitter" du bordereau initial ${id}`
      );
    }
    return emitter;
  }
};
