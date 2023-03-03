import { UserInputError } from "apollo-server-express";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  BsdaInput,
  MutationCreateBsdaArgs
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { getUserCompanies } from "../../../users/database";
import {
  companyToIntermediaryInput,
  expandBsdaFromDb,
  flattenBsdaInput
} from "../../converter";
import { checkIsBsdaContributor } from "../../permissions";
import { getBsdaRepository } from "../../repository";
import { getContextualBsdaSchema } from "../../validation/validate";

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

  const unparsedBsda = flattenBsdaInput(input);

  await checkIsBsdaContributor(
    user,
    { ...unparsedBsda, intermediaries: input.intermediaries },
    "Vous ne pouvez pas créer un bordereau sur lequel votre entreprise n'apparait pas"
  );

  const bsda = await getContextualBsdaSchema({
    currentSignatureType: !isDraft ? "EMISSION" : undefined
  }).parseAsync({ ...unparsedBsda, isDraft });

  const forwarding = Boolean(bsda.forwarding)
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

  const newBsda = await getBsdaRepository(user).create({
    ...bsda,
    forwarding,
    grouping,
    intermediaries
  });

  return expandBsdaFromDb(newBsda);
}
