import { UserInputError } from "apollo-server-core";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationRemoveSignatureAutomationArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { checkIsCompanyAdmin } from "../../../users/permissions";

export async function removeSignatureAutomation(
  _,
  { id }: MutationRemoveSignatureAutomationArgs,
  context: GraphQLContext
) {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);

  const signatureAutomation = await prisma.signatureAutomation.findUnique({
    where: { id },
    include: { from: true }
  });

  if (!signatureAutomation) {
    throw new UserInputError("Délégation inconnue.");
  }

  await checkIsCompanyAdmin(user, signatureAutomation.from);

  return prisma.signatureAutomation.delete({
    where: {
      id: signatureAutomation.id
    }
  });
}
