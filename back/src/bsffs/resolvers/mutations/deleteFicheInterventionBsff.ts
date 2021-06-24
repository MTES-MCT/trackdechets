import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { unflattenFicheInterventionBsff } from "../../converter";
import {
  getBsffOrNotFound,
  getFicheInterventionBsffOrNotFound
} from "../../database";
import { isBsffContributor } from "../../permissions";

const deleteFicheInterventionBsff: MutationResolvers["deleteFicheInterventionBsff"] = async (
  _,
  { id, numero },
  context
) => {
  const user = checkIsAuthenticated(context);
  const bsff = await getBsffOrNotFound({ id });
  await isBsffContributor(user, bsff);

  if (bsff.emitterEmissionSignatureDate) {
    throw new UserInputError(
      `Il n'est pas possible de supprimer une fiche d'intervention après la signature de l'émetteur`
    );
  }

  const existingFicheIntervention = await getFicheInterventionBsffOrNotFound(
    id,
    numero
  );
  await prisma.bsffFicheIntervention.delete({
    where: { id: existingFicheIntervention.id }
  });

  return unflattenFicheInterventionBsff(existingFicheIntervention);
};

export default deleteFicheInterventionBsff;
