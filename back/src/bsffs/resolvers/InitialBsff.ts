import prisma from "../../prisma";
import { BsffResolvers } from "../../generated/graphql/types";
import { getFicheInterventions } from "../database";
import { isBsffContributor } from "../permissions";
import { ForbiddenError } from "apollo-server-express";

export const InitialBsff: BsffResolvers = {
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
  },
  ficheInterventions: async ({ id }, _, context) => {
    const prismaBsff = await prisma.bsff.findUnique({
      where: { id }
    });
    return getFicheInterventions({ bsff: prismaBsff, context });
  }
};
