import { applyAuthStrategies, AuthType } from "../../../../auth/auth";
import { checkIsAuthenticated } from "../../../../common/permissions";
import type { QueryResolvers } from "@td/codegen-back";
import { parseQueryAdminRequestArgs } from "../../../validation";
import { fixTyping } from "../../typing";
import { getAdminRequestRepository } from "../../../repository";
import { UserInputError } from "../../../../common/errors";
import { prisma } from "@td/prisma";

const adminRequestResolver: QueryResolvers["adminRequest"] = async (
  _,
  args,
  context
) => {
  // Browser only
  applyAuthStrategies(context, [AuthType.Session]);

  // User must be authenticated
  const user = checkIsAuthenticated(context);

  // Sync validation of args
  const { adminRequestId } = parseQueryAdminRequestArgs(args);

  const { findFirst } = getAdminRequestRepository(user);
  const adminRequest = await findFirst({ id: adminRequestId });

  if (!adminRequest) {
    throw new UserInputError("Cette demande n'existe pas.");
  }

  // In order to view a request, you must either be its author or
  // be a member of the company it is targeting
  if (adminRequest.userId !== user.id) {
    const companyAssociation = await prisma.companyAssociation.findFirst({
      where: {
        companyId: adminRequest.companyId,
        userId: user.id
      }
    });

    if (!companyAssociation) {
      throw new UserInputError(
        "Vous n'êtes pas autorisé à effectuer cette action."
      );
    }
  }

  return fixTyping(adminRequest);
};

export default adminRequestResolver;
