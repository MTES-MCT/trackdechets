import type { BsdasriInput } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { expandBsdasriFromDB } from "../../converter";
import { checkIsAuthenticated } from "../../../common/permissions";
import { validateBsdasri, BsdasriValidationContext } from "../../validation";
import { emitterIsAllowedToGroup, checkDasrisAreGroupable } from "./utils";
import { BsdasriType } from "@prisma/client";
import { getBsdasriRepository } from "../../repository";

import { checkCanCreate } from "../../permissions";
import { parseBsdasriAsync } from "../../validation2";
import { graphQlInputToZodBsdasri } from "../../validation2/helpers";

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
  const { grouping, ...rest } = input;

  await checkCanCreate(user, input);

  const zodBsdasri = graphQlInputToZodBsdasri(input);

  const { createdAt, ...parsedZodBsdasri } = await parseBsdasriAsync(
    { ...zodBsdasri, isDraft, createdAt: new Date() },
    {
      user,
      currentSignatureType: !isDraft ? "EMISSION" : undefined,
      unsealed: true
    }
  );

  const isGrouping = !!grouping && !!grouping.length;

  // grouping perms check
  if (isGrouping) {
    await emitterIsAllowedToGroup(zodBsdasri.emitterCompanySiret);
    await checkDasrisAreGroupable(grouping, zodBsdasri.emitterCompanySiret);
  }

  const groupedBsdasris = isGrouping ? grouping.map(id => ({ id })) : [];

  const bsdasriRepository = getBsdasriRepository(user);

  const bsdasriType: BsdasriType = isGrouping
    ? BsdasriType.GROUPING
    : BsdasriType.SIMPLE;

  const { synthesizing, ...tmp } = parsedZodBsdasri; // fix me

  const newDasri = await bsdasriRepository.create({
    ...tmp,
    // id: getReadableId(ReadableIdPrefix.DASRI),
    type: bsdasriType,
    grouping: { connect: groupedBsdasris },

    isDraft
  });

  return expandBsdasriFromDB(newDasri);
};

export default createBsdasri;
