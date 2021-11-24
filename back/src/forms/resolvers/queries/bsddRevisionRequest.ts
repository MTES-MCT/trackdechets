import { UserInputError } from "apollo-server-core";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryBsddRevisionRequestArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { checkIsOneOfTheCompaniesMember } from "../../permissions";

export default async function bsddRevisionRequest(
  _,
  { id }: QueryBsddRevisionRequestArgs,
  context: GraphQLContext
) {
  const user = checkIsAuthenticated(context);
  const revisionRequest = await prisma.bsddRevisionRequest.findUnique({
    where: { id },
    include: { validations: true }
  });

  if (!revisionRequest) {
    throw new UserInputError("Révision introuvable.");
  }

  const companiesIdsOnRevisionRequest = [
    revisionRequest.requestedById,
    ...revisionRequest.validations.map(val => val.companyId)
  ];
  await checkIsOneOfTheCompaniesMember(user.id, companiesIdsOnRevisionRequest);

  return revisionRequest;
}
