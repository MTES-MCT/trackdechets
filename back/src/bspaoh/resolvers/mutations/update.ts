import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationUpdateBspaohArgs } from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { getBspaohOrNotFound } from "../../database";
import { checkCanUpdate } from "../../permissions";

import { expandBspaohFromDb } from "../../converter";
import { parseBspaohInContext } from "../../validation";
import {
  prepareBspaohForParsing,
  prepareBspaohInputs,
  getCurrentSignatureType
} from "./utils";
import { getBspaohRepository } from "../../repository";
import prisma from "../../../prisma";

export default async function edit(
  _,
  { id, input }: MutationUpdateBspaohArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);

  const existingBspaoh = await getBspaohOrNotFound({ id });

  await checkCanUpdate(user, existingBspaoh, input);

  const { preparedExistingBspaoh, existingFirstTransporter } =
    prepareBspaohForParsing(existingBspaoh);

  const parsed = await parseBspaohInContext(
    { input, persisted: { ...preparedExistingBspaoh } },
    {
      enableCompletionTransformers: true,
      currentSignatureType: getCurrentSignatureType(existingBspaoh),
      user
    }
  );

  const { preparedBspaohInput, preparedBspaohTransporterInput } =
    prepareBspaohInputs(parsed);

  if (existingFirstTransporter) {
    await prisma.bspaohTransporter.update({
      where: { id: existingFirstTransporter.id },
      data: {
        ...preparedBspaohTransporterInput
      }
    });
  }

  const bspaohRepository = getBspaohRepository(user);
  const updatedBspaoh = await bspaohRepository.update(
    { id },
    { ...preparedBspaohInput }
  );
  return expandBspaohFromDb(updatedBspaoh);
}
