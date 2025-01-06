import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationRemoveSignatureAutomationArgs } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { GraphQLContext } from "../../../types";
import { checkUserPermissions, Permission } from "../../../permissions";
import {
  NotCompanyAdminErrorMsg,
  UserInputError
} from "../../../common/errors";

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

  await checkUserPermissions(
    user,
    signatureAutomation.from.orgId,
    Permission.CompanyCanManageSignatureAutomation,
    NotCompanyAdminErrorMsg(signatureAutomation.from.orgId)
  );

  return prisma.signatureAutomation.delete({
    where: {
      id: signatureAutomation.id
    }
  });
}
