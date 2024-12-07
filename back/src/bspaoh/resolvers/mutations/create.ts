import { checkIsAuthenticated } from "../../../common/permissions";
import { GraphQLContext } from "../../../types";
import { expandBspaohFromDb } from "../../converter";
import { checkCanCreate } from "../../permissions";
import { BspaohStatus } from "@prisma/client";
import type { BspaohInput, MutationCreateBspaohArgs } from "@td/codegen-back";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import { parseBspaohInContext } from "../../validation";
import { getBspaohRepository } from "../../repository";
import { prepareBspaohInputs } from "./utils";

export default async function create(
  _,
  { input }: MutationCreateBspaohArgs,
  context: GraphQLContext
) {
  return genericCreate({ isDraft: false, input, context });
}
type CreateBspaoh = {
  isDraft: boolean;
  input: BspaohInput;
  context: GraphQLContext;
};

export async function genericCreate({ isDraft, input, context }: CreateBspaoh) {
  const user = checkIsAuthenticated(context);

  await checkCanCreate(user, input);

  const currentSignatureType = isDraft ? undefined : "EMISSION";
  const parsed = await parseBspaohInContext(
    { input },
    {
      currentSignatureType,
      enableCompletionTransformers: true,
      isCreation: true
    }
  );

  const { preparedBspaohInput, preparedBspaohTransporterInput } =
    prepareBspaohInputs(parsed);

  const bspaohRepository = getBspaohRepository(user);

  // even if a draft paoh input does not include any transporter field, we create an empty paoh transporter
  // which will be completed to be published
  const newBspaoh = await bspaohRepository.create({
    ...preparedBspaohInput,
    id: getReadableId(ReadableIdPrefix.PAOH),
    status: isDraft ? BspaohStatus.DRAFT : BspaohStatus.INITIAL,
    transporters: {
      create: [{ ...preparedBspaohTransporterInput, number: 1 }]
    }
  });
  return expandBspaohFromDb(newBspaoh);
}
