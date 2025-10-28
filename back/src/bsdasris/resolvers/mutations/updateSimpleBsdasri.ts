import {
  companyToIntermediaryInput,
  expandBsdasriFromDB,
  flattenBsdasriInput
} from "../../converter";
import { BsdasriType } from "@td/prisma";

import type { BsdasriInput } from "@td/codegen-back";

import { emitterIsAllowedToGroup, checkDasrisAreGroupable } from "./utils";
import { getBsdasriRepository } from "../../repository";

import { UserInputError } from "../../../common/errors";

import { mergeInputAndParseBsdasriAsync } from "../../validation";
import { PrismaBsdasriForParsing } from "../../validation/types";

const getGroupedBsdasriArgs = (
  inputRegroupedBsdasris: string[] | null | undefined
) => {
  if (inputRegroupedBsdasris === null) {
    return { grouping: { set: [] } };
  }

  const args = !!inputRegroupedBsdasris
    ? {
        set: inputRegroupedBsdasris.map(id => ({
          id
        }))
      }
    : {};
  return { grouping: args };
};

/**
 * Bsdasri update helper
 * handle SIMPLE and GROUPING dasris
 */
const updateBsdasri = async ({
  id,
  input,
  dbBsdasri,
  dbGrouping,

  user
}: {
  id: string;
  dbBsdasri: PrismaBsdasriForParsing;
  input: BsdasriInput;
  dbGrouping: { id: string }[];

  user: Express.User;
}) => {
  const { grouping: inputGrouping, synthesizing: inputSynthesizing } = input;
  const isGroupingType = dbBsdasri.type === BsdasriType.GROUPING;
  const flattenedInput = flattenBsdasriInput(input);

  if (inputSynthesizing && inputSynthesizing.length > 0) {
    throw new UserInputError(
      "Le champ synthesizing n'est accessible que sur les dasri de synthèse."
    );
  }

  if (inputGrouping !== undefined) {
    if (!isGroupingType) {
      throw new UserInputError(
        "Le champ grouping n'est accessible que sur les dasri de groupement."
      );
    }
    if (!inputGrouping?.length) {
      throw new UserInputError(
        "Un bordereau de groupement doit avoir des bordereaux associés."
      );
    }

    const newDasrisToGroup = inputGrouping.filter(
      id => !dbGrouping.some(({ id: dbId }) => dbId === id)
    );

    await emitterIsAllowedToGroup(
      flattenedInput?.emitterCompanySiret ?? dbBsdasri?.emitterCompanySiret
    );
    await checkDasrisAreGroupable(
      newDasrisToGroup,
      flattenedInput?.emitterCompanySiret ?? dbBsdasri?.emitterCompanySiret
    );
  }

  const { parsedBsdasri, updatedFields } = await mergeInputAndParseBsdasriAsync(
    dbBsdasri,
    input,
    { user }
  );

  const newIntermediaries = dbBsdasri.intermediaries
    ? {
        deleteMany: {},
        ...(parsedBsdasri?.intermediaries &&
          parsedBsdasri?.intermediaries?.length > 0 && {
            createMany: {
              data: companyToIntermediaryInput(parsedBsdasri.intermediaries)
            }
          })
      }
    : undefined;

  if (updatedFields.length === 0) {
    // Évite de faire un update "à blanc" si l'input
    // ne modifie pas les données. Cela permet de limiter
    // le nombre d'évenements crées dans Mongo.
    return expandBsdasriFromDB(dbBsdasri);
  }

  const bsdasriRepository = getBsdasriRepository(user);

  const { createdAt, grouping, synthesizing, intermediaries, ...newBsdasri } =
    parsedBsdasri;

  const updatedDasri = await bsdasriRepository.update(
    { id },
    {
      ...newBsdasri,
      ...getGroupedBsdasriArgs(inputGrouping),
      intermediaries: newIntermediaries
    }
  );

  return expandBsdasriFromDB(updatedDasri);
};

export default updateBsdasri;
