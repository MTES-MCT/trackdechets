import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type {
  AdminRequest,
  MutationAcceptAdminRequestArgs,
  ResolversParentTypes
} from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { AdminRequestStatus, UserRole } from "@prisma/client";
import { parseAcceptAdminRequestInput } from "../../validation";
import { UserInputError } from "../../../common/errors";
import { getAdminRequestRepository } from "../../repository";
import { fixTyping } from "../typing";
import { prisma } from "@td/prisma";
import {
  checkCanAcceptAdminRequest,
  getAdminRequestOrThrow,
  sendEmailToAuthor,
  sendEmailToCompanyAdmins
} from "./utils/acceptAdminRequest.utils";

const acceptAdminRequest = async (
  _: ResolversParentTypes["Mutation"],
  { input }: MutationAcceptAdminRequestArgs,
  context: GraphQLContext
): Promise<AdminRequest> => {
  // Browser only
  applyAuthStrategies(context, [AuthType.Session]);

  // User must be authenticated
  const user = checkIsAuthenticated(context);

  // Sync validation of input
  const adminRequestInput = parseAcceptAdminRequestInput(input);

  const adminRequest = await getAdminRequestOrThrow(user, adminRequestInput);

  // TODO: not everyone from the company can accept. Admins first, then possible collaborators
  const association = await prisma.companyAssociation.findFirst({
    where: {
      userId: user.id,
      companyId: adminRequest.companyId
    }
  });

  await checkCanAcceptAdminRequest(
    user,
    adminRequest,
    association,
    adminRequestInput
  );

  // Request has already been accepted, exit early
  if (adminRequest.status === AdminRequestStatus.ACCEPTED) {
    return fixTyping(adminRequest);
  }

  // Check if user already belongs to company
  const companyAssociation = await prisma.companyAssociation.findFirst({
    where: {
      userId: adminRequest.userId,
      companyId: adminRequest.companyId
    }
  });

  // We should never get to this, but just in case
  if (companyAssociation && companyAssociation.role === UserRole.ADMIN) {
    throw new UserInputError(
      "L'utilisateur est déjà administrateur de l'entreprise."
    );
  }

  // User does not belong to company yet. Add & promote
  if (!companyAssociation) {
    await prisma.companyAssociation.create({
      data: {
        company: { connect: { id: adminRequest.companyId } },
        user: { connect: { id: adminRequest.userId } },
        role: UserRole.ADMIN
      }
    });
  }
  // User belongs to company, but is not admin. Promote
  else {
    await prisma.companyAssociation.update({
      where: {
        id: companyAssociation.id
      },
      data: {
        role: UserRole.ADMIN
      }
    });
  }

  // Update the request
  const { update } = getAdminRequestRepository(user);
  const updatedAdminRequest = await update(
    { id: adminRequest.id },
    {
      status: AdminRequestStatus.ACCEPTED
    }
  );

  const { user: author, company } = adminRequest;

  // Warn the company's admins
  await sendEmailToCompanyAdmins(author, company, adminRequest);

  // Inform the author
  await sendEmailToAuthor(author, company);

  return fixTyping(updatedAdminRequest);
};

export default acceptAdminRequest;
