import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationAddSignatureAutomationArgs } from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { GraphQLContext } from "../../../types";
import { getCompanyOrCompanyNotFound } from "../../database";
import { checkUserPermissions, Permission } from "../../../permissions";
import {
  ForbiddenError,
  NotCompanyAdminErrorMsg
} from "../../../common/errors";

export async function addSignatureAutomation(
  _,
  { input }: MutationAddSignatureAutomationArgs,
  context: GraphQLContext
) {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);

  const { from, to } = input;
  const fromCompany = await getCompanyOrCompanyNotFound({ id: from });

  await checkUserPermissions(
    user,
    fromCompany.orgId,
    Permission.CompanyCanManageSignatureAutomation,
    NotCompanyAdminErrorMsg(fromCompany.orgId)
  );

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
