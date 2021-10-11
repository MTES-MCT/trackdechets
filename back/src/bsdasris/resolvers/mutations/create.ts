import prisma from "../../../prisma";
import {
  MutationCreateBsdasriArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { unflattenBsdasri, flattenBsdasriInput } from "../../converter";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { checkIsAuthenticated } from "../../../common/permissions";
import { validateBsdasri } from "../../validation";
import { checkIsBsdasriContributor } from "../../permissions";
import { emitterIsAllowedToGroup, checkDasrisAreGroupable } from "./utils";
import { indexBsdasri } from "../../elastic";

/**
 * Bsdasri creation mutation
 * sets bsdasri type to `GROUPING` if a non empty array of grouping dasris is provided
 */
const createBsdasri = async (
  parent: ResolversParentTypes["Mutation"],
  { input: input }: MutationCreateBsdasriArgs,
  context: GraphQLContext,
  isDraft: boolean
) => {
  const user = checkIsAuthenticated(context);

  const { grouping, ...rest } = input;

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
  const isRegrouping = !!grouping && !!grouping.length;

  if (isRegrouping) {
    await emitterIsAllowedToGroup(flattenedInput?.emitterCompanySiret);
    await checkDasrisAreGroupable(grouping, flattenedInput.emitterCompanySiret);
  }

  const signatureContext = isDraft
    ? { isRegrouping }
    : { emissionSignature: true, isRegrouping };

  await validateBsdasri(flattenedInput, signatureContext);

  const newDasri = await prisma.bsdasri.create({
    data: {
      ...flattenedInput,
      id: getReadableId(ReadableIdPrefix.DASRI),
      type: isRegrouping ? "GROUPING" : "SIMPLE",
      grouping: { connect: grouping },
      isDraft: isDraft
    }
  });

  await indexBsdasri(newDasri, context);

  return unflattenBsdasri(newDasri);
};

export default createBsdasri;
