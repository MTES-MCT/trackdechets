import type { BsdasriInput } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { expandBsdasriFromDB, flattenBsdasriInput } from "../../converter";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { checkIsAuthenticated } from "../../../common/permissions";
import { validateBsdasri, BsdasriValidationContext } from "../../validation";
import { emitterIsAllowedToGroup, checkDasrisAreGroupable } from "./utils";
import { BsdasriType } from "@prisma/client";
import { getBsdasriRepository } from "../../repository";
import { sirenify } from "../../sirenify";
import { recipify } from "../../recipify";
import { checkCanCreate } from "../../permissions";

const getValidationContext = ({
  isDraft,
  isGrouping = false,
  isSynthesizing = false
}: {
  isDraft: boolean;
  isGrouping?: boolean;
  isSynthesizing?: boolean;
}): BsdasriValidationContext => {
  if (isSynthesizing) {
    return { emissionSignature: true };
  }
  return isDraft
    ? { isGrouping, isDraft: true }
    : { emissionSignature: true, isGrouping };
};

/**
 * Bsdasri creation mutation
 * sets bsdasri type to :
 * - `GROUPING` if a non empty array of grouping dasris is provided
 * - `SIMPLE` otherwise
 */
const createBsdasri = async (
  input: BsdasriInput,
  context: GraphQLContext,
  isDraft: boolean
) => {
  const user = checkIsAuthenticated(context);
  const { grouping, synthesizing, ...rest } = input;

  await checkCanCreate(user, input);

  const sirenifiedInput = await sirenify(rest, user);

  const autocompletedInput = await recipify(sirenifiedInput);

  const flattenedInput = flattenBsdasriInput(autocompletedInput);

  const isGrouping = !!grouping && !!grouping.length;

  // grouping perms check
  if (isGrouping) {
    await emitterIsAllowedToGroup(flattenedInput?.emitterCompanySiret);
    await checkDasrisAreGroupable(grouping, flattenedInput.emitterCompanySiret);
  }

  const groupedBsdasris = isGrouping ? grouping.map(id => ({ id })) : [];

  await validateBsdasri(
    flattenedInput,
    getValidationContext({ isDraft, isGrouping })
  );
  const bsdasriRepository = getBsdasriRepository(user);

  const bsdasriType: BsdasriType = isGrouping
    ? BsdasriType.GROUPING
    : BsdasriType.SIMPLE;

  const newDasri = await bsdasriRepository.create({
    ...flattenedInput,
    id: getReadableId(ReadableIdPrefix.DASRI),
    type: bsdasriType,
    grouping: { connect: groupedBsdasris },

    isDraft
  });

  return expandBsdasriFromDB(newDasri);
};

export default createBsdasri;
