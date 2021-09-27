import prisma from "../../../prisma";
import {
  MutationCreateBsdasriArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import {
  expandBsdasriFromDb,
  flattenBsdasriInput
} from "../../dasri-converter";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { checkIsAuthenticated } from "../../../common/permissions";
import { validateBsdasri } from "../../validation";
import { checkIsBsdasriContributor } from "../../permissions";
import { emitterIsAllowedToGroup, checkDasrisAreGroupable } from "./utils";
import { indexBsdasri } from "../../elastic";

/**
 * Bsdasri creation mutation
 * sets bsdasriType to `GROUPING` if a non empty array of regroupedBsdasris is provided
 */
const createBsdasri = async (
  parent: ResolversParentTypes["Mutation"],
  { input: input }: MutationCreateBsdasriArgs,
  context: GraphQLContext,
  isDraft: boolean
) => {
  const user = checkIsAuthenticated(context);

  const { regroupedBsdasris, ...rest } = input;

  const formSirets = {
    emitterCompanySiret: input.emitter?.company?.siret,
    recipientCompanySiret: input.recipient?.company?.siret,
    transporterCompanySiret: input.transporter?.company?.siret
  };

  await checkIsBsdasriContributor(
    user,
    formSirets,
    "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparaît pas"
  );

  const flattenedInput = flattenBsdasriInput(rest);
  const isRegrouping = !!regroupedBsdasris && !!regroupedBsdasris.length;

  if (isRegrouping) {
    await emitterIsAllowedToGroup(flattenedInput?.emitterCompanySiret);
    await checkDasrisAreGroupable(
      regroupedBsdasris,
      flattenedInput.emitterCompanySiret
    );
  }

  const signatureContext = isDraft
    ? { isRegrouping }
    : { emissionSignature: true, isRegrouping };

  await validateBsdasri(flattenedInput, signatureContext);

  const newDasri = await prisma.bsdasri.create({
    data: {
      ...flattenedInput,
      id: getReadableId(ReadableIdPrefix.DASRI),
      bsdasriType: isRegrouping ? "GROUPING" : "SIMPLE",
      owner: { connect: { id: user.id } },
      regroupedBsdasris: { connect: regroupedBsdasris },
      isDraft: isDraft
    }
  });

  await indexBsdasri(newDasri, context);

  return expandBsdasriFromDb(newDasri);
};

export default createBsdasri;
