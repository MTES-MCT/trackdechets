import { Prisma } from "@td/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import getReadableId, { ReadableIdPrefix } from "../../../forms/readableId";
import type { BsvhuInput, MutationCreateBsvhuArgs } from "@td/codegen-back";

import { GraphQLContext } from "../../../types";
import {
  companyToIntermediaryInput,
  expandVhuFormFromDb
} from "../../converter";
import { parseBsvhuAsync } from "../../validation";
import { getBsvhuRepository } from "../../repository";

import { checkCanCreate } from "../../permissions";
import { graphQlInputToZodBsvhu } from "../../validation/helpers";

type CreateBsvhu = {
  isDraft: boolean;
  input: BsvhuInput;
  context: GraphQLContext;
};

export default async function create(
  _,
  { input }: MutationCreateBsvhuArgs,
  context: GraphQLContext
) {
  return genericCreate({ isDraft: false, input, context });
}

export async function genericCreate({ isDraft, input, context }: CreateBsvhu) {
  const user = checkIsAuthenticated(context);

  await checkCanCreate(user, input);

  const zodBsvhu = await graphQlInputToZodBsvhu(input);
  const { createdAt, ...parsedZodBsvhu } = await parseBsvhuAsync(
    { ...zodBsvhu, isDraft, createdAt: new Date() },
    {
      user,
      currentSignatureType: !isDraft ? "EMISSION" : undefined,
      unsealed: true
    }
  );

  const intermediaries =
    parsedZodBsvhu.intermediaries && parsedZodBsvhu.intermediaries.length > 0
      ? {
          create: companyToIntermediaryInput(parsedZodBsvhu.intermediaries)
        }
      : undefined;

  let transporters:
    | Prisma.BsvhuTransporterCreateNestedManyWithoutBsvhuInput
    | undefined = undefined;
  if (input.transporter) {
    transporters = {
      createMany: {
        // un seul transporteur dans le tableau normalement
        data: parsedZodBsvhu.transporters!.map((t, idx) => {
          const { id, bsvhuId, createdAt, ...data } = t;
          return { ...data, number: idx + 1 };
        })
      }
    };
  } else if (input.transporters && input.transporters.length > 0) {
    transporters = {
      connect: parsedZodBsvhu.transporters!.map(t => ({ id: t.id! }))
    };
  }

  const bsvhuRepository = getBsvhuRepository(user);

  const newForm = await bsvhuRepository.create({
    ...parsedZodBsvhu,
    id: getReadableId(ReadableIdPrefix.VHU),
    isDraft,
    intermediaries,
    transporters
  });

  return expandVhuFormFromDb(newForm);
}
