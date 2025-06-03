import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type {
  AdminRequest,
  MutationRefuseAdminRequestArgs,
  ResolversParentTypes
} from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { parseMutationRefuseAdminRequestArgs } from "../../validation";
import { prisma } from "@td/prisma";
import { getAdminRequestRepository } from "../../repository";
import { fixTyping } from "../typing";
import { AdminRequestStatus } from "@prisma/client";
import {
  checkCanRefuseAdminRequest,
  getAdminRequestOrThrow,
  sendEmailToAuthor,
  sendEmailToCompanyAdmins
} from "./utils/refuseAdminRequest.utils";

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

  const adminRequest = await getAdminRequestOrThrow(user, adminRequestId);

  const association = await prisma.companyAssociation.findFirst({
    where: {
      userId: user.id,
      companyId: adminRequest.companyId
    }
  });

  await checkCanRefuseAdminRequest(user, adminRequest, association);

  // Request has already been refused, exit early
  if (adminRequest.status === AdminRequestStatus.REFUSED) {
    return fixTyping(adminRequest);
  }

  // Update the request
  const { update } = getAdminRequestRepository(user);
  const updatedAdminRequest = await update(
    { id: adminRequestId },
    {
      status: AdminRequestStatus.REFUSED
    }
  );

  const { user: author, company } = adminRequest;

  // Warn the company's admins
  await sendEmailToCompanyAdmins(author, company, adminRequest);

  // Inform the author by email
  await sendEmailToAuthor(author, company);

  return fixTyping(updatedAdminRequest);
};

export default refuseAdminRequest;
