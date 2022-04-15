import { expandBsdasriFromDB, flattenBsdasriInput } from "../../converter";
import { Bsdasri, BsdasriStatus, BsdasriType } from "@prisma/client";
import prisma from "../../../prisma";
import { BsdasriInput } from "../../../generated/graphql/types";

import { validateBsdasri } from "../../validation";
import { ForbiddenError, UserInputError } from "apollo-server-express";
import { indexBsdasri } from "../../elastic";

import { getEligibleDasrisForSynthesis, aggregatePackagings } from "./utils";

import { getFieldsAllorwedForUpdate } from "./fieldsUpdateRules";

const buildSynthesizedBsdasriArgs = async (
  dasrisToAssociate: Bsdasri[] | null | undefined,
  status: BsdasriStatus
) => {
  if (!dasrisToAssociate?.length) {
    return {};
  }

  const aggregatedPackagings = aggregatePackagings(dasrisToAssociate);

  const summedVolumes = dasrisToAssociate
    .map(dasri => dasri.transporterWasteVolume ?? 0)
    .reduce((prev, curr) => prev + curr, 0);

  const args = {
    ...(status === BsdasriStatus.INITIAL
      ? {
          emitterWastePackagings: aggregatedPackagings,
          emitterWasteVolume: summedVolumes,
          transporterWastePackagings: aggregatedPackagings,
          transporterWasteVolume: summedVolumes
        }
      : {})
  };

  return args;
};

const updateSynthesisBsdasri = async ({
  id,
  input,
  dbBsdasri,
  dbSynthesizing
}: {
  id: string;
  input: BsdasriInput;
  dbBsdasri: Bsdasri;
  dbSynthesizing: any;
}) => {
  const {
    grouping: inputGrouping,
    synthesizing: inputSynthesizing,
    ...rest
  } = input;

  // Validate form input
  if (inputGrouping !== undefined && dbBsdasri.type !== BsdasriType.GROUPING) {
    throw new UserInputError(
      "Le champ grouping n'est accessible que sur les dasri de groupement"
    );
  }

  if (inputSynthesizing !== undefined) {
    if (dbBsdasri.status !== BsdasriStatus.INITIAL) {
      throw new UserInputError(
        "Les bordereaux associés à ce bsd ne sont plus modifiables"
      );
    }
    // Forbid empty associated dasris
    if (!inputSynthesizing?.length) {
      throw new UserInputError(
        "Un bordereau de synthèse doit comporter des bordereaux associés"
      );
    }
  }

  if (!!inputSynthesizing?.length) {
    // filter dasris already associated to current dasri
    const newDasrisToAssociate = inputSynthesizing.filter(
      el => !dbSynthesizing.map(el => el.id).includes(el)
    );
    // check associated dasris meet eligibility criteria
    await getEligibleDasrisForSynthesis(
      newDasrisToAssociate,
      dbBsdasri.transporterCompanySiret
    );
  }
  const dasrisToAssociate = !!inputSynthesizing?.length
    ? await prisma.bsdasri.findMany({
        where: {
          id: { in: inputSynthesizing }
        }
      })
    : [];
  const synthesizedBsdasriArgs = await buildSynthesizedBsdasriArgs(
    dasrisToAssociate,
    dbBsdasri.status
  );
  const flattenedInput = flattenBsdasriInput(rest);
  const flattenedFields = Object.keys(flattenedInput);
  const allowedFields = getFieldsAllorwedForUpdate(dbBsdasri);
  const diff = flattenedFields.filter(el => !allowedFields.includes(el));

  if (!!diff.length) {
    const errMessage = `Des champs ont été verrouillés via signature ou ne sont pas modifiables sur le dasri de synthèse: ${diff.join()}`;
    throw new ForbiddenError(errMessage);
  }
  const flattenedArgs = {
    ...flattenedInput,
    ...synthesizedBsdasriArgs
  };
  const expectedBsdasri = { ...dbBsdasri, ...flattenedArgs };

  await validateBsdasri(expectedBsdasri, {
    isGrouping: false
  });

  const synthesizingArgs = !!inputSynthesizing?.length
    ? {
        synthesizing: {
          set: inputSynthesizing.map(id => ({
            id
          }))
        }
      }
    : {};

  const updatedDasri = await prisma.bsdasri.update({
    where: { id },
    data: { ...flattenedArgs, ...synthesizingArgs }
  });

  const expandedDasri = expandBsdasriFromDB(updatedDasri);

  await indexBsdasri(updatedDasri);
  return expandedDasri;
};

export default updateSynthesisBsdasri;
