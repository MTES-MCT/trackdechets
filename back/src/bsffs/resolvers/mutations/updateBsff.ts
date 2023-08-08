import { Prisma, BsffType } from "@prisma/client";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getBsffOrNotFound, getPackagingCreateInput } from "../../database";
import { flattenBsffInput, expandBsffFromDB } from "../../converter";
import { checkCanUpdate } from "../../permissions";
import {
  validateBsff,
  validateFicheInterventions,
  validatePreviousPackagings
} from "../../validation";
import { toBsffPackagingWithType } from "../../compat";
import {
  getBsffFicheInterventionRepository,
  getBsffPackagingRepository,
  getBsffRepository
} from "../../repository";
import { checkEditionRules } from "../../edition/bsffEdition";
import { sirenifyBsffInput } from "../../sirenify";
import { recipify } from "../../recipify";
import { UserInputError } from "../../../common/errors";

const updateBsff: MutationResolvers["updateBsff"] = async (
  _,
  { id, input },
  context
) => {
  const user = checkIsAuthenticated(context);

  const existingBsff = await getBsffOrNotFound({ id });
  await checkCanUpdate(user, existingBsff, input);

  const { findPreviousPackagings } = getBsffPackagingRepository(user);
  const { findMany: findManyFicheInterventions } =
    getBsffFicheInterventionRepository(user);
  const { update: updateBsff } = getBsffRepository(user);

  if (input.type && input.type !== existingBsff.type) {
    throw new UserInputError(
      "Vous ne pouvez pas modifier le type de BSFF après création"
    );
  }

  if (
    input.emitter?.company?.siret?.length &&
    [
      BsffType.GROUPEMENT,
      BsffType.RECONDITIONNEMENT,
      BsffType.REEXPEDITION
    ].includes(existingBsff.type as any) &&
    input.emitter?.company?.siret !== existingBsff.emitterCompanySiret
  ) {
    throw new UserInputError(
      "Vous ne pouvez pas modifier l'établissement émetteur après création du BSFF en cas de réexpédition, groupement ou reconditionnement"
    );
  }

  if (existingBsff.emitterEmissionSignatureDate) {
    // discard related objects updates after emission signatures
    delete input.packagings;
    delete input.grouping;
    delete input.forwarding;
    delete input.repackaging;
    delete input.ficheInterventions;
  }
  const sirenifiedInput = await sirenifyBsffInput(input, user);
  const autocompletedInput = await recipify(sirenifiedInput);
  const flatInput = flattenBsffInput(autocompletedInput);

  const futureBsff = {
    ...existingBsff,
    ...flatInput,
    packagings:
      input.packagings?.map(toBsffPackagingWithType) ?? existingBsff.packagings
  };

  await checkEditionRules(existingBsff, input, user);

  const packagingHasChanged =
    !!input.forwarding ||
    !!input.grouping ||
    !!input.repackaging ||
    !!input.packagings;

  await validateBsff(futureBsff, {
    isDraft: existingBsff.isDraft,
    transporterSignature: !!existingBsff.transporterTransportSignatureDate
  });

  const existingPreviousPackagings = await findPreviousPackagings(
    existingBsff.packagings.map(p => p.id),
    1
  );

  const ficheInterventions = await findManyFicheInterventions({
    where:
      input.ficheInterventions && input.ficheInterventions.length > 0
        ? { id: { in: input.ficheInterventions } }
        : { bsffs: { some: { id: { in: [existingBsff.id] } } } }
  });

  await validateFicheInterventions(futureBsff, ficheInterventions);

  const futurePreviousPackagingsIds = {
    ...(futureBsff.type === BsffType.REEXPEDITION
      ? {
          forwarding:
            input.forwarding ?? existingPreviousPackagings.map(p => p.id)
        }
      : {}),
    ...(futureBsff.type === BsffType.GROUPEMENT
      ? {
          grouping: input.grouping ?? existingPreviousPackagings.map(p => p.id)
        }
      : {}),
    ...(futureBsff.type === BsffType.RECONDITIONNEMENT
      ? {
          repackaging:
            input.repackaging ?? existingPreviousPackagings.map(p => p.id)
        }
      : {})
  };

  const futurePreviousPackagings = await validatePreviousPackagings(
    futureBsff,
    futurePreviousPackagingsIds
  );

  const data: Prisma.BsffUpdateInput = {
    ...flatInput,
    ...(packagingHasChanged
      ? {
          packagings: {
            deleteMany: {},
            create: getPackagingCreateInput(
              futureBsff,
              futurePreviousPackagings
            )
          }
        }
      : {})
  };

  if (ficheInterventions.length > 0) {
    data.ficheInterventions = {
      set: ficheInterventions.map(({ id }) => ({ id }))
    };
    data.detenteurCompanySirets = ficheInterventions
      .map(fi => fi.detenteurCompanySiret)
      .filter(Boolean);
  }

  const updatedBsff = await updateBsff({ where: { id }, data });

  return expandBsffFromDB(updatedBsff);
};

export default updateBsff;
