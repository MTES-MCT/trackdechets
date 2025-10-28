import type { BsdasriInput } from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import {
  expandBsdasriFromDB,
  companyToIntermediaryInput
} from "../../converter";
import { checkIsAuthenticated } from "../../../common/permissions";
import { emitterIsAllowedToGroup, checkDasrisAreGroupable } from "./utils";
import { BsdasriType } from "@td/prisma";
import { getBsdasriRepository } from "../../repository";

import { checkCanCreate } from "../../permissions";
import { parseBsdasriAsync } from "../../validation";
import { graphQlInputToZodBsdasri } from "../../validation/helpers";

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
  const { grouping } = input;

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
  const intermediaries =
    parsedZodBsdasri.intermediaries &&
    parsedZodBsdasri.intermediaries.length > 0
      ? {
          create: companyToIntermediaryInput(parsedZodBsdasri.intermediaries)
        }
      : undefined;
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

  const { synthesizing, ...createInput } = parsedZodBsdasri;

  const newDasri = await bsdasriRepository.create({
    ...createInput,
    type: bsdasriType,
    grouping: { connect: groupedBsdasris },
    intermediaries,

    isDraft
  });

  return expandBsdasriFromDB(newDasri);
};

export default createBsdasri;
