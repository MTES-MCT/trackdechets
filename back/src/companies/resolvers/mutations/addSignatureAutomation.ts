import { ForbiddenError } from "apollo-server-core";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationAddSignatureAutomationArgs } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { GraphQLContext } from "../../../types";
import { checkIsCompanyAdmin } from "../../../users/permissions";
import { getCompanyOrCompanyNotFound } from "../../database";

export async function addSignatureAutomation(
  _,
  { input }: MutationAddSignatureAutomationArgs,
  context: GraphQLContext
) {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);

  const { from, to } = input;
  const fromCompany = await getCompanyOrCompanyNotFound({ id: from });
  await checkIsCompanyAdmin(user, fromCompany);

  const toCompany = await getCompanyOrCompanyNotFound({ id: to });

  const existingAutomation = await prisma.signatureAutomation.findFirst({
    where: { fromId: from, toId: to }
  });
  if (existingAutomation) {
    throw new ForbiddenError(
      "Cette entreprise est déjà autorisée à signer pour vous les annexes 1. Impossible de l'ajouter plusieurs fois."
    );
  }

  const automation = await prisma.signatureAutomation.create({
    data: {
      fromId: from,
      toId: to
    }
  });

  return {
    ...automation,
    from: fromCompany,
    to: toCompany
  };
}
