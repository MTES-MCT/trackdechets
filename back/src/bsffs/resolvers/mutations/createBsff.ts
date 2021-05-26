import { UserInputError } from "apollo-server-express";
import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { flattenBsffInput, unflattenBsff } from "../../converter";
import { isBsffContributor } from "../../permissions";
import { GROUPING_CODES, OPERATION_QUALIFICATIONS } from "../../constants";

const createBsff: MutationResolvers["createBsff"] = async (
  _,
  { input },
  context
) => {
  const user = checkIsAuthenticated(context);
  const flatInput = flattenBsffInput(input);

  await isBsffContributor(user, flatInput);

  if (input.bsffs?.length > 0) {
    const bsffs = await prisma.bsff.findMany({
      where: {
        id: {
          in: input.bsffs
        }
      }
    });

    if (
      bsffs.some(
        bsff =>
          !GROUPING_CODES.includes(bsff.destinationOperationCode) &&
          bsff.destinationOperationQualification !==
            OPERATION_QUALIFICATIONS.REEXPEDITION
      )
    ) {
      throw new UserInputError(
        `Les bordereaux à associer ont déclaré un traitement qui ne permet pas de leur donner suite`
      );
    }

    if (
      bsffs.some(
        bsff =>
          bsff.destinationOperationCode !== bsffs[0].destinationOperationCode ||
          bsff.destinationOperationQualification !==
            bsffs[0].destinationOperationQualification
      )
    ) {
      throw new UserInputError(
        `Les bordereaux à associer ont déclaré des traitements qui divergent et ne peuvent pas être listés sur un même bordereau`
      );
    }

    flatInput.bsffs = {
      connect: input.bsffs.map(id => ({ id }))
    };
  }

  const bsff = await prisma.bsff.create({
    data: {
      id: getReadableId(ReadableIdPrefix.FF),
      ...flatInput
    }
  });
  return {
    ...unflattenBsff(bsff),
    ficheInterventions: [],
    bsffs: []
  };
};

export default createBsff;
