import { UserInputError } from "apollo-server-express";
import omit from "object.omit";
import { Prisma, BsffType } from "@prisma/client";
import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  getBsffOrNotFound,
  getPackagingCreateInput,
  getPreviousPackagings
} from "../../database";
import { flattenBsffInput, expandBsffFromDB } from "../../converter";
import { checkCanWriteBsff } from "../../permissions";
import {
  validateBsff,
  validateFicheInterventions,
  validatePreviousPackagings
} from "../../validation";
import { indexBsff } from "../../elastic";
import { toBsffPackagingWithType } from "../../compat";

const updateBsff: MutationResolvers["updateBsff"] = async (
  _,
  { id, input },
  context
) => {
  const user = checkIsAuthenticated(context);

  const existingBsff = await getBsffOrNotFound({ id });
  await checkCanWriteBsff(user, existingBsff);

  if (existingBsff.destinationReceptionSignatureDate) {
    throw new UserInputError(
      `Il n'est pas possible d'éditer un BSFF qui a été récéptionné`
    );
  }

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

  let flatInput = { ...flattenBsffInput(input) };

  if (existingBsff.emitterEmissionSignatureDate) {
    flatInput = omit(flatInput, [
      "type",
      "emitterCompanyAddress",
      "emitterCompanyContact",
      "emitterCompanyMail",
      "emitterCompanyName",
      "emitterCompanyPhone",
      "emitterCompanySiret",
      "wasteCode",
      "wasteDescription",
      "weightValue",
      "weightIsEstimate",
      "destinationPlannedOperationCode"
    ]);

    delete input.grouping;
    delete input.forwarding;
    delete input.ficheInterventions;
  }

  if (existingBsff.transporterTransportSignatureDate) {
    flatInput = omit(flatInput, [
      "transporterCompanyAddress",
      "transporterCompanyContact",
      "transporterCompanyMail",
      "transporterCompanyName",
      "transporterCompanyPhone",
      "transporterCompanySiret",
      "transporterCompanyVatNumber",
      "transporterRecepisseDepartment",
      "transporterRecepisseNumber",
      "transporterRecepisseValidityLimit",
      "transporterTransportMode",
      "wasteAdr"
    ]);
  }

  if (existingBsff.destinationReceptionSignatureDate) {
    flatInput = omit(flatInput, [
      "destinationCompanyAddress",
      "destinationCompanyContact",
      "destinationCompanyMail",
      "destinationCompanyName",
      "destinationCompanyPhone",
      "destinationCompanySiret",
      "destinationReceptionDate"
    ]);
  }

  const futureBsff = {
    ...existingBsff,
    ...flatInput,
    packagings:
      input.packagings?.map(toBsffPackagingWithType) ?? existingBsff.packagings
  };

  await checkCanWriteBsff(user, futureBsff);

  const packagingHasChanged =
    !!input.forwarding ||
    !!input.grouping ||
    !!input.repackaging ||
    !!input.packagings;

  const existingPreviousPackagings = await getPreviousPackagings(
    existingBsff.packagings.map(p => p.id),
    1
  );

  const ficheInterventions = await prisma.bsffFicheIntervention.findMany({
    where:
      input.ficheInterventions?.length > 0
        ? { id: { in: input.ficheInterventions } }
        : { bsffs: { some: { id: { in: [existingBsff.id] } } } }
  });

  await validateBsff(futureBsff);

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
  const updatedBsff = await prisma.bsff.update({
    data,
    where: { id }
  });

  await indexBsff(updatedBsff, context);

  return expandBsffFromDB(updatedBsff);
};

export default updateBsff;
