import prisma from "../../../prisma";
import {
  MutationCreateBsdasriArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { expandBsdasriFromDB, flattenBsdasriInput } from "../../converter";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { checkIsAuthenticated } from "../../../common/permissions";
import { validateBsdasri, BsdasriValidationContext } from "../../validation";
import { checkIsBsdasriContributor } from "../../permissions";
import {
  emitterIsAllowedToGroup,
  checkDasrisAreGroupable,
  checkDasrisAreEligibleForSynthesis,
  emitterBelongsToUserSirets
} from "./utils";
import { indexBsdasri } from "../../elastic";
import { UserInputError } from "apollo-server-express";
import { BsdasriType } from "@prisma/client";
import { getCachedUserSirets } from "../../../common/redis/users";

const getValidationContext = ({
  isDraft,
  isGrouping,
  isSynthesizing
}: {
  isDraft: boolean;
  isGrouping: boolean;
  isSynthesizing: boolean;
}): BsdasriValidationContext => {
  if (isSynthesizing) {
    return { emissionSignature: true, isSynthesizing };
  }
  return isDraft ? { isGrouping } : { emissionSignature: true, isGrouping };
};

/**
 * Bsdasri creation mutation
 * sets bsdasri type to :
 * - `GROUPING` if a non empty array of grouping dasris is provided
 * - `SYNTHESIZING` if a non empty array of grouping dasris is provided
 * - `SIMPLE` otherwise
 */
const createBsdasri = async (
  _: ResolversParentTypes["Mutation"],
  { input }: MutationCreateBsdasriArgs,
  context: GraphQLContext,
  isDraft: boolean
) => {
  const user = checkIsAuthenticated(context);
  const { grouping, synthesizing, ...rest } = input;

  const formSirets = {
    emitterCompanySiret: input.emitter?.company?.siret,
    destinationCompanySiret: input.destination?.company?.siret,
    transporterCompanySiret: input.transporter?.company?.siret
  };

  await checkIsBsdasriContributor(
    user,
    formSirets,
    "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparaît pas"
  );

  const flattenedInput = flattenBsdasriInput(rest);

  const isGrouping = !!grouping && !!grouping.length;
  const isSynthesizing = !!synthesizing && !!synthesizing.length;

  if (isGrouping && isSynthesizing) {
    throw new UserInputError(
      "Un bordereau dasri ne peut pas à la fois effectuer une opération de synthèse et de regroupement"
    );
  }

  // grouping perms check
  if (isGrouping) {
    await emitterIsAllowedToGroup(flattenedInput?.emitterCompanySiret);
    await checkDasrisAreGroupable(grouping, flattenedInput.emitterCompanySiret);
  }

  // synthesis perms check and specific rules
  if (isSynthesizing) {
    if (isDraft) {
      throw new UserInputError(
        `La création de dasri de synthèse en brouillon n'est pas possible`
      );
    }

    const userSirets = await getCachedUserSirets(user.id);

    await emitterBelongsToUserSirets(
      flattenedInput.emitterCompanySiret,
      userSirets
    );

    await checkDasrisAreEligibleForSynthesis(
      synthesizing,
      flattenedInput.emitterCompanySiret
    );
  }

  const groupedBsdasris = isGrouping ? grouping.map(id => ({ id })) : [];
  const synthesizedBsdasris = isSynthesizing
    ? synthesizing.map(id => ({ id }))
    : [];

  await validateBsdasri(
    flattenedInput,
    getValidationContext({ isDraft, isGrouping, isSynthesizing })
  );

  let bsdasriType: BsdasriType = isGrouping
    ? BsdasriType.GROUPING
    : BsdasriType.SIMPLE;
  bsdasriType = isSynthesizing ? BsdasriType.SYNTHESIS : bsdasriType;

  const newDasri = await prisma.bsdasri.create({
    data: {
      ...flattenedInput,
      id: getReadableId(ReadableIdPrefix.DASRI),
      // status: isSynthesizing ? BsdasriStatus.SENT : BsdasriStatus.INITIAL, // fix me
      type: bsdasriType,
      grouping: { connect: groupedBsdasris },
      synthesizing: { connect: synthesizedBsdasris },
      isDraft
    }
  });

  await indexBsdasri(newDasri, context);

  return expandBsdasriFromDB(newDasri);
};

export default createBsdasri;
