import prisma from "../../prisma";
import { BsffResolvers } from "../../generated/graphql/types";
import { unflattenBsff, unflattenFicheInterventionBsff } from "../converter";
import { isBsffContributor } from "../permissions";
import { getNextBsffs } from "../database";

export const Bsff: BsffResolvers = {
  ficheInterventions: async ({ id }, _, context) => {
    const prismaBsff = await prisma.bsff.findUnique({
      where: { id }
    });
    const ficheInterventions = await prisma.bsffFicheIntervention.findMany({
      where: {
        bsffId: prismaBsff.id
      }
    });
    const unflattenedFicheInterventions = ficheInterventions.map(
      unflattenFicheInterventionBsff
    );

    try {
      await isBsffContributor(context.user, prismaBsff);
    } catch (err) {
      unflattenedFicheInterventions.forEach(ficheIntervention => {
        delete ficheIntervention.detenteur;
        delete ficheIntervention.operateur;
      });
    }

    return unflattenedFicheInterventions;
  },
  nextBsff: async ({ id }) => {
    const prismaBsff = await prisma.bsff.findUnique({
      where: { id }
    });
    const nextBsff = await prisma.bsff.findUnique({
      where: { id: prismaBsff.parentId }
    });

    return unflattenBsff(nextBsff);
  },
  nextBsffs: async ({ id }) => {
    const prismaBsff = await prisma.bsff.findUnique({
      where: { id }
    });
    const nextBsffs = await getNextBsffs(prismaBsff);

    return nextBsffs.map(unflattenBsff);
  },
  previousBsffs: async ({ id }) => {
    const children = await prisma.bsff.findMany({
      where: {
        parentId: id
      }
    });
    return children.map(unflattenBsff);
  }
};
