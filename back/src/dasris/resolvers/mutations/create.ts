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
import getReadableId, { ReadableIdPrefix } from "../../../common/readableId";
import { checkIsAuthenticated } from "../../../common/permissions";
import { validateBsdasri } from "../../validation";
import { checkIsBsdasriContributor } from "../../permissions";

import { emitterIsAllowedToGroup, checkDasrisAreGroupable } from "./utils";

const createBsdasri = async (
  parent: ResolversParentTypes["Mutation"],
  { bsdasriCreateInput: input }: MutationCreateBsdasriArgs,
  context: GraphQLContext,
  isDraft: boolean
) => {
  const user = checkIsAuthenticated(context);

  const { regroupedBsdasris, ...bsdasriCreateInput } = input;

  const formSirets = {
    emitterCompanySiret: bsdasriCreateInput.emitter?.company?.siret,
    recipientCompanySiret: bsdasriCreateInput.recipient?.company?.siret,
    transporterCompanySiret: bsdasriCreateInput.transporter?.company?.siret
  };

  await checkIsBsdasriContributor(
    user,
    formSirets,
    "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparaît pas"
  );

  const flattenedInput = flattenBsdasriInput(bsdasriCreateInput);
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

  try {
    const newDasri = await prisma.bsdasri.create({
      data: {
        ...flattenedInput,
        id: await getReadableId(ReadableIdPrefix.DASRI),
        owner: { connect: { id: user.id } },
        regroupedBsdasris: { connect: regroupedBsdasris },
        isDraft: isDraft
      }
    });
    return expandBsdasriFromDb(newDasri);
  } catch (e) {

    console.log(e);
  }
};

export default createBsdasri;
