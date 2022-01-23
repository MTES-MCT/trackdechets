import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsffOrNotFound, getPreviousBsffs } from "../../database";
import { isBsffContributor } from "../../permissions";
import prisma from "../../../prisma";
import { expandBsffFromDb } from "../../converter";
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

  const previousBsffs = await getPreviousBsffs(existingBsff);

  const ficheInterventions = await prisma.bsffFicheIntervention.findMany({
    where: { bsffs: { some: { id: { in: [existingBsff.id] } } } }
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

  await indexBsff(updatedBsff, context);

  return expandBsffFromDb(updatedBsff);
};

export default publishBsffResolver;
