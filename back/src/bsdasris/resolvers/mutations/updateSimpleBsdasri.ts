import { expandBsdasriFromDB, flattenBsdasriInput } from "../../converter";
import { BsdasriStatus, BsdasriType, Bsdasri } from "@prisma/client";

import { BsdasriInput } from "../../../generated/graphql/types";
import { validateBsdasri } from "../../validation";
import { emitterIsAllowedToGroup, checkDasrisAreGroupable } from "./utils";
import { getBsdasriRepository } from "../../repository";
import { checkEditionRules } from "../../edition";
import { sirenify } from "../../sirenify";
import { recipify } from "../../recipify";
import { UserInputError } from "../../../common/errors";

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
  dbBsdasri: Bsdasri;
  input: BsdasriInput;
  dbGrouping: any;

  user: Express.User;
}) => {
  const { grouping: inputGrouping, synthesizing: inputSynthesizing } = input;
  const isGroupingType = dbBsdasri.type === BsdasriType.GROUPING;
  const sirenifiedInput = await sirenify(input, user);
  const autocompletedInput = await recipify(sirenifiedInput);
  const flattenedInput = flattenBsdasriInput(autocompletedInput);

  if (inputGrouping && inputGrouping.length > 0 && !isGroupingType) {
    throw new UserInputError(
      "Le champ grouping n'est accessible que sur les dasri de groupement."
    );
  }

  if (inputSynthesizing && inputSynthesizing.length > 0) {
    throw new UserInputError(
      "Le champ synthesizing n'est accessible que sur les dasri de synthèse."
    );
  }

  if (inputGrouping !== undefined) {
    if (dbBsdasri.status !== BsdasriStatus.INITIAL) {
      throw new UserInputError(
        "Les bordereaux associés à ce bsd ne sont plus modifiables"
      );
    }

    if (!inputGrouping?.length) {
      throw new UserInputError(
        "Un bordereau de groupement doit avoir des bordereaux associés."
      );
    }

    await emitterIsAllowedToGroup(
      flattenedInput?.emitterCompanySiret ?? dbBsdasri?.emitterCompanySiret
    );
    const newDasrisToGroup = inputGrouping.filter(
      el => !dbGrouping.map(el => el.id).includes(el)
    );
    await checkDasrisAreGroupable(
      newDasrisToGroup,
      flattenedInput?.emitterCompanySiret ?? dbBsdasri?.emitterCompanySiret
    );
  }

  const expectedBsdasri = { ...dbBsdasri, ...flattenedInput };

  // Validate form input

  await validateBsdasri(expectedBsdasri as any, {
    isGrouping: isGroupingType
  });

  await checkEditionRules(dbBsdasri, input, user);

  const bsdasriRepository = getBsdasriRepository(user);

  const updatedDasri = await bsdasriRepository.update(
    { id },
    {
      ...flattenedInput,
      ...getGroupedBsdasriArgs(inputGrouping)
    }
  );

  return expandBsdasriFromDB(updatedDasri);
};

export default updateBsdasri;
