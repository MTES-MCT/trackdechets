import prisma from "../../prisma";
import { BsffResolvers } from "../../generated/graphql/types";
import { unflattenBsff, unflattenFicheInterventionBsff } from "../converter";
import { isBsffContributor } from "../permissions";

export const Bsff: BsffResolvers = {
  ficheInterventions: async (parent, _, context) => {
    const ficheInterventions = await prisma.bsffFicheIntervention.findMany({
      where: {
        bsffId: parent.id
      }
    });
    const unflattenedFicheInterventions = ficheInterventions.map(
      unflattenFicheInterventionBsff
    );

    try {
      await isBsffContributor(context.user, {
        emitterCompanySiret: parent.emitter?.company?.siret,
        transporterCompanySiret: parent.transporter?.company?.siret,
        destinationCompanySiret: parent.destination?.company?.siret
      });
    } catch (err) {
      unflattenedFicheInterventions.forEach(ficheIntervention => {
        delete ficheIntervention.detenteur;
        delete ficheIntervention.operateur;
      });
    }

    return unflattenedFicheInterventions;
  },
  children: async parent => {
    const children = await prisma.bsff.findMany({
      where: {
        parentId: parent.id
      }
    });
    return children.map(unflattenBsff);
  }
};
