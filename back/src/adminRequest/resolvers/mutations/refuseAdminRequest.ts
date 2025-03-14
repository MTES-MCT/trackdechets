import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type {
  MutationRefuseAdminRequestArgs,
  ResolversParentTypes
} from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { parseMutationRefuseAdminRequestArgs } from "../../validation";
import { prisma } from "@td/prisma";
import { ForbiddenError, UserInputError } from "../../../common/errors";
import { getAdminRequestRepository } from "../../repository";
import { AdminRequestWithUserAndCompany, fixTyping } from "../typing";
import { AdminRequestStatus, AdminRequest, UserRole } from "@prisma/client";
import {
  adminRequestRefusedAdminEmail,
  adminRequestRefusedEmail,
  renderMail
} from "@td/mail";
import { sendMail } from "../../../mailer/mailing";

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

  const { user: author, company } = adminRequest;

  // Warn the admins
  const adminsCompanyAssociations = await prisma.companyAssociation.findMany({
    where: {
      companyId: adminRequest.companyId,
      role: UserRole.ADMIN,
      userId: { not: adminRequest.userId }
    },
    include: { user: true }
  });

  if (adminsCompanyAssociations.length) {
    const adminMail = renderMail(adminRequestRefusedAdminEmail, {
      to: adminsCompanyAssociations.map(association => ({
        email: association.user.email,
        name: association.user.name
      })),
      variables: {
        company,
        user: author
      }
    });

    await sendMail(adminMail);
  }

  // Inform the author by email
  const mail = renderMail(adminRequestRefusedEmail, {
    to: [{ email: author.email, name: author.name }],
    variables: {
      company
    }
  });

  await sendMail(mail);

  return fixTyping(updatedAdminRequest);
};

export default refuseAdminRequest;
