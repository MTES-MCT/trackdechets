import { checkIsAuthenticated } from "../../../common/permissions";
import {
  BsdaInput,
  MutationCreateBsdaArgs
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import { companyToIntermediaryInput, expandBsdaFromDb } from "../../converter";
import { getBsdaRepository } from "../../repository";
import { checkCanCreate } from "../../permissions";
import { UserInputError } from "../../../common/errors";
import { parseBsdaAsync } from "../../validation";
import { graphQlInputToZodBsda } from "../../validation/helpers";
import { Prisma } from "@prisma/client";

type CreateBsda = {
  isDraft: boolean;
  input: BsdaInput;
  context: GraphQLContext;
};

export default async function create(
  _,
  { input }: MutationCreateBsdaArgs,
  context: GraphQLContext
) {
  return genericCreate({ isDraft: false, input, context });
}

export async function genericCreate({ isDraft, input, context }: CreateBsda) {
  const user = checkIsAuthenticated(context);

  await checkCanCreate(user, input);
  const companies = await getUserCompanies(user.id);
  const destinationCompany = companies.find(
    company => company.siret === input.destination?.company?.siret
  );
  if (
    input.type === "COLLECTION_2710" &&
    !destinationCompany?.companyTypes.includes("WASTE_CENTER")
  ) {
    throw new UserInputError(
      "Seules les déchetteries peuvent créer un bordereau de ce type, et elles doivent impérativement être identifiées comme destinataire du déchet."
    );
  }

  const zodBsda = await graphQlInputToZodBsda(input);

  const bsda = await parseBsdaAsync(
    { ...zodBsda, isDraft },
    {
      user,
      enableCompletionTransformers: true,
      enablePreviousBsdasChecks: true,
      currentSignatureType: !isDraft ? "EMISSION" : undefined
    }
  );

  const forwarding = !!bsda.forwarding
    ? { connect: { id: bsda.forwarding } }
    : undefined;
  const grouping =
    bsda.grouping && bsda.grouping.length > 0
      ? { connect: bsda.grouping.map(id => ({ id })) }
      : undefined;
  const intermediaries =
    bsda.intermediaries && bsda.intermediaries.length > 0
      ? {
          createMany: {
            data: companyToIntermediaryInput(bsda.intermediaries)
          }
        }
      : undefined;

  let transporters:
    | Prisma.BsdaTransporterCreateNestedManyWithoutBsdaInput
    | undefined = undefined;

  if (input.transporter) {
    transporters = {
      createMany: {
        // un seul transporteur dans le tableau normalement
        data: bsda.transporters!.map((t, idx) => {
          const { id, bsdaId, ...data } = t;
          return { ...data, number: idx + 1 };
        })
      }
    };
  } else if (input.transporters && input.transporters.length > 0) {
    transporters = {
      connect: bsda.transporters!.map(t => ({ id: t.id! }))
    };
  }

  const bsdaRepository = getBsdaRepository(user);
  const newBsda = await bsdaRepository.create({
    ...bsda,
    forwarding,
    grouping,
    intermediaries,
    transporters
  });

  return expandBsdaFromDb(newBsda);
}
