import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type {
  AdminRequest,
  MutationCreateAdminRequestArgs,
  ResolversParentTypes
} from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { AdminRequestValidationMethod } from "@prisma/client";
import { parseCreateAdminRequestInput } from "../../validation";
import { prisma } from "@td/prisma";
import { UserInputError } from "../../../common/errors";
import { getAdminRequestRepository } from "../../repository";
import { fixTyping } from "../typing";
import { sendAdminRequestVerificationCodeLetter } from "../../../common/post";
import {
  checkCanCreateAdminRequest,
  generateCode,
  getAdminOnlyEndDate,
  sendEmailToAuthor,
  sendEmailToCompanyAdmins
} from "./utils/createAdminRequest.utils";

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
    companyAssociation,
    collaborator
  );

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

  const { create } = getAdminRequestRepository(user);

  // Create admin request
  const adminRequest = await create(
    {
      user: { connect: { id: user.id } },
      company: { connect: { id: company.id } },
      collaboratorId: collaborator?.id,
      validationMethod: adminRequestInput.validationMethod,
      adminOnlyEndDate,
      code
    },
    { include: { company: true } }
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
