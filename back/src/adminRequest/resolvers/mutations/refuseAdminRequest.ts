import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type {
  AdminRequest,
  MutationRefuseAdminRequestArgs,
  ResolversParentTypes
} from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { parseMutationRefuseAdminRequestArgs } from "../../validation";
import { prisma } from "@td/prisma";
import { ForbiddenError, UserInputError } from "../../../common/errors";
import { getAdminRequestRepository } from "../../repository";
import { fixTyping } from "../typing";
import { AdminRequestStatus } from "@prisma/client";

const refuseAdminRequest = async (
  _: ResolversParentTypes["Mutation"],
  args: MutationRefuseAdminRequestArgs,
  context: GraphQLContext
): Promise<AdminRequest> => {
  // Browser only
  applyAuthStrategies(context, [AuthType.Session]);

  // User must be authenticated
  const user = checkIsAuthenticated(context);

  // Sync validation of input
  const { adminRequestId } = parseMutationRefuseAdminRequestArgs(args);

  const { findFirst, update } = getAdminRequestRepository(user);

  const adminRequest = await findFirst({ id: adminRequestId });

  if (!adminRequest) {
    throw new UserInputError("La demande n'existe pas.");
  }

  // Only rule is user must belong to target company
  const association = await prisma.companyAssociation.findFirst({
    where: {
      userId: user.id,
      companyId: adminRequest.companyId
    }
  });

  if (!association) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à effectuer cette action."
    );
  }

  if (adminRequest.status === AdminRequestStatus.ACCEPTED) {
    throw new UserInputError(
      `La demande a déjà été acceptée et n'est plus modifiable.`
    );
  }

  // Request has already been refused, exit early
  if (adminRequest.status === AdminRequestStatus.REFUSED) {
    return fixTyping(adminRequest);
  }

  // Update the request
  const updatedAdminRequest = await update(
    { id: adminRequestId },
    {
      status: AdminRequestStatus.REFUSED
    }
  );

  return fixTyping(updatedAdminRequest);
};

export default refuseAdminRequest;
