import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsffOrNotFound } from "../../database";
import { checkCanUpdate } from "../../permissions";
import { expandBsffFromDB } from "../../converter";
import {
  validateBsff,
  validateFicheInterventions,
  validatePreviousPackagings
} from "../../validation";
import { BsffType } from "@prisma/client";
import {
  getBsffFicheInterventionRepository,
  getBsffPackagingRepository,
  getBsffRepository
} from "../../repository";

const publishBsffResolver: MutationResolvers["publishBsff"] = async (
  _,
  { id },
  context
) => {
  const user = checkIsAuthenticated(context);
  const existingBsff = await getBsffOrNotFound({ id });

  const { update: updateBsff, findUniqueGetPackagings } =
    getBsffRepository(user);
  const { findPreviousPackagings } = getBsffPackagingRepository(user);
  const { findMany: findManyFicheIntervention } =
    getBsffFicheInterventionRepository(user);

  const packagings =
    (await findUniqueGetPackagings({
      where: { id: existingBsff.id }
    })) ?? [];

  await checkCanUpdate(user, existingBsff);

  const previousPackagings = await findPreviousPackagings(
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

  const ficheInterventions = await findManyFicheIntervention({
    where: { bsffs: { some: { id: { in: [existingBsff.id] } } } }
  });

  const fullBsff = { ...existingBsff, packagings, isDraft: false };

  await validateBsff(fullBsff, { isDraft: false, transporterSignature: false });
  await validateFicheInterventions(fullBsff, ficheInterventions);
  await validatePreviousPackagings(fullBsff, previousPackagingsIds);

  const updatedBsff = await updateBsff({
    where: {
      id: existingBsff.id
    },
    data: {
      isDraft: false
    }
  });

  return expandBsffFromDB(updatedBsff);
};

export default publishBsffResolver;
