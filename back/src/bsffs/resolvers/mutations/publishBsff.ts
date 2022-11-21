import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsffOrNotFound, getPreviousPackagings } from "../../database";
import { isBsffContributor } from "../../permissions";
import prisma from "../../../prisma";
import { expandBsffFromDB } from "../../converter";
import { indexBsff } from "../../elastic";
import {
  validateBsff,
  validateFicheInterventions,
  validatePreviousPackagings
} from "../../validation";
import { BsffType } from "@prisma/client";

const publishBsffResolver: MutationResolvers["publishBsff"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);
  const existingBsff = await getBsffOrNotFound({ id });

  const packagings = await prisma.bsff
    .findUnique({ where: { id: existingBsff.id } })
    .packagings();

  await isBsffContributor(user, existingBsff);

  const previousPackagings = await getPreviousPackagings(
    existingBsff.packagings.map(p => p.id),
    1
  );
  const previousPackagingsIds = {
    ...(existingBsff.type === BsffType.REEXPEDITION
      ? { forwarding: previousPackagings.map(p => p.id) }
      : {}),
    ...(existingBsff.type === BsffType.GROUPEMENT
      ? { grouping: previousPackagings.map(p => p.id) }
      : {}),
    ...(existingBsff.type === BsffType.RECONDITIONNEMENT
      ? { repackaging: previousPackagings.map(p => p.id) }
      : {})
  };

  const ficheInterventions = await prisma.bsffFicheIntervention.findMany({
    where: { bsffs: { some: { id: { in: [existingBsff.id] } } } }
  });

  const fullBsff = { ...existingBsff, packagings, isDraft: false };

  await validateBsff(fullBsff);
  await validateFicheInterventions(fullBsff, ficheInterventions);
  await validatePreviousPackagings(fullBsff, previousPackagingsIds);

  const updatedBsff = await prisma.bsff.update({
    data: {
      isDraft: false
    },
    where: {
      id: existingBsff.id
    }
  });

  await indexBsff(updatedBsff, context);

  return expandBsffFromDB(updatedBsff);
};

export default publishBsffResolver;
