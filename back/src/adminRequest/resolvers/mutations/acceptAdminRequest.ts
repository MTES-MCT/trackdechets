import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type {
  AdminRequest,
  MutationAcceptAdminRequestArgs,
  ResolversParentTypes
} from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import {
  AdminRequestStatus,
  AdminRequestValidationMethod,
  UserRole
} from "@prisma/client";
import { parseAcceptAdminRequestInput } from "../../validation";
import { ForbiddenError, UserInputError } from "../../../common/errors";
import { getAdminRequestRepository } from "../../repository";
import { AdminRequestWithUserAndCompany, fixTyping } from "../typing";
import { prisma } from "@td/prisma";
import { adminRequestAcceptedEmail, renderMail } from "@td/mail";
import { sendMail } from "../../../mailer/mailing";

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

  const { adminRequestId } = adminRequestInput;

  const { findFirst, update } = getAdminRequestRepository(user);

  const adminRequest: AdminRequestWithUserAndCompany | null = (await findFirst(
    { id: adminRequestId },
    {
      include: {
        company: true,
        user: true
      }
    }
  )) as unknown as AdminRequestWithUserAndCompany;

  if (!adminRequest) {
    throw new UserInputError("La demande n'existe pas.");
  }

  // User cannot validate own request
  if (user.id === adminRequest.userId) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à effectuer cette action."
    );
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

  if (adminRequest.status === AdminRequestStatus.REFUSED) {
    throw new UserInputError(
      `La demande a déjà été refusée et n'est plus modifiable.`
    );
  }

  // Request has already been accepted, exit early
  if (adminRequest.status === AdminRequestStatus.ACCEPTED) {
    return fixTyping(adminRequest);
  }

  // Now acceptation depends on the validation method
  if (
    adminRequest.validationMethod ===
    AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL
  ) {
    // TODO
    // TODO
    // TODO
    // TODO
  }

  // If the user does not belong to target company, add him
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
  const updatedAdminRequest = await update(
    { id: adminRequestId },
    {
      status: AdminRequestStatus.ACCEPTED
    }
  );

  // Warn the author by email
  const { user: author, company } = adminRequest;
  const mail = renderMail(adminRequestAcceptedEmail, {
    to: [{ email: author.email, name: author.name }],
    variables: {
      company
    }
  });

  await sendMail(mail);

  return fixTyping(updatedAdminRequest);
};

export default acceptAdminRequest;
