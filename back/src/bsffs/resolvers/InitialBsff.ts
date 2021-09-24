import prisma from "../../prisma";
import { BsffResolvers } from "../../generated/graphql/types";
import { getFicheInterventions } from "../database";

export const InitialBsff: BsffResolvers = {
  ficheInterventions: async ({ id }, _, context) => {
    const prismaBsff = await prisma.bsff.findUnique({
      where: { id }
    });
    return getFicheInterventions({ bsff: prismaBsff, context });
  }
};
