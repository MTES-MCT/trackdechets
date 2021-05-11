import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import {
  flattenFicheInterventionBsffInput,
  unflattenFicheInterventionBsff
} from "../../converter";
import {
  getBsffOrNotFound,
  getFicheInterventionBsffOrNotFound
} from "../../database";
import { isBsffContributor } from "../../permissions";

const updateFicheInterventionBsff: MutationResolvers["updateFicheInterventionBsff"] = async (
  _,
  { id, numero, input },
  context
) => {
  const user = checkIsAuthenticated(context);
  const bsff = await getBsffOrNotFound(id);
  await isBsffContributor(user, bsff);

  const existingFicheIntervention = await getFicheInterventionBsffOrNotFound(
    id,
    numero
  );
  const updatedFicheIntervention = await prisma.bsffFicheIntervention.update({
    data: flattenFicheInterventionBsffInput(input),
    where: { id: existingFicheIntervention.id }
  });

  return unflattenFicheInterventionBsff(updatedFicheIntervention);
};

export default updateFicheInterventionBsff;
