import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsffOrNotFound } from "../../database";
import { isBsffContributor } from "../../permissions";
import prisma from "../../../prisma";
import { unflattenBsff } from "../../converter";
import { indexBsff } from "../../elastic";
import { validateBsff } from "../../validation";

const publishBsffResolver: MutationResolvers["publishBsff"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);
  const existingBsff = await getBsffOrNotFound({ id });

  await isBsffContributor(user, existingBsff);

  const previousBsffs = await prisma.bsff.findMany({
    where: { nextBsffId: existingBsff.id }
  });
  const ficheInterventions = await prisma.bsffFicheIntervention.findMany({
    where: { bsffId: existingBsff.id }
  });

  await validateBsff(existingBsff, previousBsffs, ficheInterventions);

  const updatedBsff = await prisma.bsff.update({
    data: {
      isDraft: false
    },
    where: {
      id: existingBsff.id
    }
  });

  await indexBsff(updatedBsff);

  return unflattenBsff(updatedBsff);
};

export default publishBsffResolver;
