import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsffOrNotFound, getGroupedBsffs } from "../../database";
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

  const forwardedBsff = existingBsff.forwardingId
    ? await prisma.bsff.findUnique({ where: { id: existingBsff.forwardingId } })
    : null;

  const repackagedBsffs = await prisma.bsff
    .findFirst({ where: { id } })
    .repackaging();

  const groupedBsffs = await getGroupedBsffs(existingBsff.id);

  const previousBsffs = [
    ...(!!forwardedBsff ? [forwardedBsff] : []),
    ...groupedBsffs,
    ...repackagedBsffs
  ];

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

  await indexBsff(updatedBsff, context);

  return unflattenBsff(updatedBsff);
};

export default publishBsffResolver;
