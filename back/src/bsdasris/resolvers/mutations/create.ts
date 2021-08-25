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
import {
  emitterIsAllowedToGroup,
  checkDasrisAreAssociable,
  getBsdasriType
} from "./utils";
import { indexBsdasri } from "../../elastic";
import { BsdasriGroupingParameterError } from "../../errors";

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

  const { regroupedBsdasris, synthesizedBsdasris, ...rest } = input;

  if (!!regroupedBsdasris?.length && !!synthesizedBsdasris?.length) {
    throw new BsdasriGroupingParameterError();
  }

  const formSirets = {
    emitterCompanySiret: input.emitter?.company?.siret,
    recipientCompanySiret: input.recipient?.company?.siret,
    transporterCompanySiret: input.transporter?.company?.siret
  };
  ``;

  await checkIsBsdasriContributor(
    user,
    formSirets,
    "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparaît pas"
  );

  const flattenedInput = flattenBsdasriInput(rest);
  const isRegrouping = !!regroupedBsdasris?.length;
  const isSynthesizing = !!synthesizedBsdasris?.length;
  if (isRegrouping && isSynthesizing) {
    throw new BsdasriGroupingParameterError();
  }
  if (isRegrouping) {
    // Only some actors all allowed to group dasris
    await emitterIsAllowedToGroup(flattenedInput?.emitterCompanySiret);
    await checkDasrisAreAssociable({
      bsdasrisToAssociate: regroupedBsdasris,
      emitterSiret: flattenedInput.emitterCompanySiret,
      associationType: "group"
    });
  }
  if (isSynthesizing) {
    await checkDasrisAreAssociable({
      bsdasrisToAssociate: synthesizedBsdasris,
      emitterSiret: flattenedInput.emitterCompanySiret,
      associationType: "synthesis"
    });
  }
  const signatureContext = isDraft
    ? { isRegrouping: isRegrouping || isSynthesizing }
    : { emissionSignature: true, isRegrouping: isRegrouping || isSynthesizing };

  await validateBsdasri(flattenedInput, signatureContext);

  const newDasri = await prisma.bsdasri.create({
    data: {
      ...flattenedInput,
      id: getReadableId(ReadableIdPrefix.DASRI),
      bsdasriType: getBsdasriType(isRegrouping, isSynthesizing),
      owner: { connect: { id: user.id } },
      regroupedBsdasris: { connect: regroupedBsdasris },
      synthesizedBsdasris: { connect: synthesizedBsdasris },
      isDraft: isDraft
    }
  });

  await indexBsdasri(newDasri);

  return expandBsdasriFromDb(newDasri);
};

export default createBsdasri;
