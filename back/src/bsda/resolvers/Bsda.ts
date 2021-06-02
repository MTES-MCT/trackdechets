import { BsdaResolvers } from "../../generated/graphql/types";
import prisma from "../../prisma";

export const Bsda: BsdaResolvers = {
  associations: async parent => {
    const bsdas = await prisma.bsda.findMany({
      where: {
        childBsdaId: parent.id
      }
    });
    return bsdas.map(bsda => ({
      id: bsda.id,
      status: bsda.status
    }));
  }
};
