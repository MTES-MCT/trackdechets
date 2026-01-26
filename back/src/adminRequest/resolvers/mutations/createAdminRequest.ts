import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type {
  AdminRequest,
  MutationCreateAdminRequestArgs,
  ResolversParentTypes
} from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { AdminRequestValidationMethod, AdminRequestStatus } from "@td/prisma";
import { parseCreateAdminRequestInput } from "../../validation";
import { prisma } from "@td/prisma";
import { ForbiddenError, UserInputError } from "../../../common/errors";

import { fixTyping } from "../typing";
import { sendAdminRequestVerificationCodeLetter } from "../../../common/post";
import {
  checkCanCreateAdminRequest,
  checkCollaboratorForAdminRequest,
  generateCode,
  getAdminOnlyEndDate,
  sendEmailToAuthor,
  sendEmailToCompanyAdmins
} from "./utils/createAdminRequest.utils";
import { getAdminRequestRepository } from "../../repository";
import { withLock } from "../../../common/redis/lock";

const createAdminRequest = async (
  _: ResolversParentTypes["Mutation"],
  { input }: MutationCreateAdminRequestArgs,
  context: GraphQLContext
): Promise<AdminRequest> => {
  // Browser only
  applyAuthStrategies(context, [AuthType.Session]);

  // User must be authenticated
  const user = checkIsAuthenticated(context);

  // Sync validation of input
  const adminRequestInput = parseCreateAdminRequestInput(input);

  const company = await prisma.company.findFirst({
    where: { orgId: adminRequestInput.companyOrgId }
  });

  if (!company) {
    throw new UserInputError(
      "Cet établissement n'est pas inscrit sur Trackdéchets."
    );
  }

  const companyAssociation = await prisma.companyAssociation.findFirst({
    where: {
      companyId: company.id,
      userId: user.id
    }
  });

  let collaborator;
  if (adminRequestInput.collaboratorEmail) {
    collaborator = await prisma.user.findFirst({
      where: { email: adminRequestInput.collaboratorEmail }
    });
  }

  await checkCanCreateAdminRequest(
    user,
    adminRequestInput,
    company,
    companyAssociation
  );

  // Run collaborator-specific checks but don't reveal collaborator existence to caller.
  // If collaborator checks fail, we still create the request (to avoid leaking existence),
  // but we'll avoid setting `collaboratorId` and therefore avoid sending any collaborator-specific mails.
  let collaboratorCheckFailed = false;
  if (adminRequestInput.collaboratorEmail) {
    try {
      await checkCollaboratorForAdminRequest(
        user,
        adminRequestInput,
        company,
        collaborator
      );
    } catch (_) {
      collaboratorCheckFailed = true;
    }
  }

  // If validation method is mail, generate a code
  const code =
    adminRequestInput.validationMethod ===
    AdminRequestValidationMethod.SEND_MAIL
      ? generateCode()
      : null;

  // Until this date, only admins can accept the request
  const adminOnlyEndDate =
    adminRequestInput.validationMethod !==
    AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
      ? getAdminOnlyEndDate()
      : null;

  // Create admin request atomically to prevent race conditions
  const adminRequest = await withLock(
    `user-admin-requests:${user.id}`,
    async () => {
      // Check pending request count
      const { count, create } = getAdminRequestRepository(user);
      
      const pendingRequests = await count({
        userId: user.id,
        status: AdminRequestStatus.PENDING
      });

      if (pendingRequests >= 5) { // MAX_SIMULTANEOUS_PENDING_REQUESTS
        throw new ForbiddenError(
          `Il n'est pas possible d'avoir plus de 5 demandes en cours.`
        );
      }
      
      const collaboratorId =
        collaboratorCheckFailed || !collaborator ? null : collaborator.id;

      return await create(
        {
          user: { connect: { id: user.id } },
          company: { connect: { id: company.id } },
          collaboratorId,
          validationMethod: adminRequestInput.validationMethod,
          adminOnlyEndDate,
          code
        },
        { include: { company: true } }
      );
    },
    {
      ttl: 10000, // 10 second lock TTL
      timeout: 5000 // 5 second timeout to acquire lock
    }
  );

  if (
    adminRequestInput.validationMethod ===
    AdminRequestValidationMethod.SEND_MAIL
  ) {
    await sendAdminRequestVerificationCodeLetter(
      {
        id: company.id,
        orgId: company.orgId,
        name: company.name,
        siret: company.siret
      },
      { name: user.name },
      code!
    );
  }

  // Immediately warn the admins by email
  await sendEmailToCompanyAdmins(user, company, adminRequest);

  // Send confirmation email to author
  await sendEmailToAuthor(user, company, adminRequest);

  return fixTyping(adminRequest);
};

export default createAdminRequest;
