import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type {
  AdminRequest,
  MutationCreateAdminRequestArgs,
  ResolversParentTypes
} from "@td/codegen-back";
import { GraphQLContext } from "../../../types";
import { AdminRequestValidationMethod, UserRole } from "@prisma/client";
import { parseCreateAdminRequestInput } from "../../validation";
import { prisma } from "@td/prisma";
import { UserInputError } from "../../../common/errors";
import { getAdminRequestRepository } from "../../repository";
import { fixTyping } from "../typing";
import {
  adminRequestInitialInfoToAuthorEmail,
  adminRequestInitialWarningToAdminEmail,
  renderMail
} from "@td/mail";
import { sendMail } from "../../../mailer/mailing";

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
      "L'entreprise ciblée n'existe pas dans Trackdéchets."
    );
  }

  const companyAssociation = await prisma.companyAssociation.findFirst({
    where: {
      companyId: company.id,
      userId: user.id
    }
  });

  if (companyAssociation?.role === UserRole.ADMIN) {
    throw new UserInputError(
      "Vous êtes déjà administrateur de cette entreprise."
    );
  }

  let collaborator;
  if (adminRequestInput.collaboratorEmail) {
    collaborator = await prisma.user.findFirst({
      where: { email: adminRequestInput.collaboratorEmail }
    });

    if (!collaborator) {
      throw new UserInputError("Le collaborateur ciblé n'existe pas.");
    }

    const collaboratorCompanyAssociation =
      await prisma.companyAssociation.findFirst({
        where: {
          userId: collaborator.id,
          companyId: company.id
        }
      });

    if (!collaboratorCompanyAssociation) {
      throw new UserInputError(
        "Le collaborateur ne fait pas partie de l'entreprise ciblée."
      );
    }
  }

  const { create, findFirst } = getAdminRequestRepository(user);

  // Make sure there isn't already a PENDING request
  const existingRequest = await findFirst({
    userId: user.id,
    companyId: company.id,
    status: "PENDING"
  });

  if (existingRequest) {
    throw new UserInputError(
      "Une demande est déjà en attente pour cette entreprise."
    );
  }

  // Create admin request
  const adminRequest = await create(
    {
      user: { connect: { id: user.id } },
      company: { connect: { id: company.id } },
      collaboratorId: collaborator?.id,
      validationMethod: adminRequestInput.validationMethod
    },
    { include: { company: true } }
  );

  // Immediately warn the admins by email
  const adminsCompanyAssociations = await prisma.companyAssociation.findMany({
    where: {
      companyId: company.id,
      role: UserRole.ADMIN
    },
    include: {
      user: true
    }
  });

  if (adminsCompanyAssociations.length) {
    const mail = renderMail(adminRequestInitialWarningToAdminEmail, {
      to: adminsCompanyAssociations.map(association => ({
        email: association.user.email,
        name: association.user.name
      })),
      variables: {
        company,
        user,
        adminRequest,
        isValidationByCollaboratorApproval:
          adminRequest.validationMethod ===
          AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
        isValidationByMail:
          adminRequest.validationMethod ===
          AdminRequestValidationMethod.SEND_MAIL
      }
    });

    await sendMail(mail);
  }

  // Send confirmation email to author
  const mail = renderMail(adminRequestInitialInfoToAuthorEmail, {
    to: [{ email: user.email, name: user.name }],
    variables: {
      company,
      isValidationByCollaboratorApproval:
        adminRequest.validationMethod ===
        AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
      isValidationByMail:
        adminRequest.validationMethod === AdminRequestValidationMethod.SEND_MAIL
    }
  });

  await sendMail(mail);

  return fixTyping(adminRequest);
};

export default createAdminRequest;
