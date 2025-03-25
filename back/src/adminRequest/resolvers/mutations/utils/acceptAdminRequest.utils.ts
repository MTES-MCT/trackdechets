import {
  AdminRequest,
  AdminRequestStatus,
  AdminRequestValidationMethod,
  Company,
  CompanyAssociation,
  User,
  UserRole
} from "@prisma/client";
import { ForbiddenError, UserInputError } from "../../../../common/errors";
import { isDefined } from "../../../../common/helpers";
import { getAdminRequestRepository } from "../../../repository";
import { AdminRequestWithUserAndCompany } from "../../typing";
import { sendMail } from "../../../../mailer/mailing";
import {
  adminRequestAcceptedAdminEmail,
  adminRequestAcceptedEmail,
  renderMail
} from "@td/mail";
import { prisma } from "@td/prisma";
import { ParsedAcceptAdminRequestInput } from "../../../validation";

const CODE_MAX_ATTEMPTS = 3;

export const getAdminRequestOrThrow = async (
  user: Express.User,
  adminRequestInput
) => {
  const { adminRequestId, orgId } = adminRequestInput;

  const { findFirst } = getAdminRequestRepository(user);

  // Either the user is the author of the request, and he will have to provide an orgId & a validation code
  // (validation by code sent in mail)
  // Either he is a member of the company, and will have to provide the adminRequestId
  const where = isDefined(adminRequestId)
    ? { id: adminRequestId }
    : { userId: user.id, company: { orgId } };

  const adminRequest: AdminRequestWithUserAndCompany | null = (await findFirst(
    where,
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

  return adminRequest;
};

export const checkCanAcceptAdminRequest = async (
  user: Express.User,
  adminRequest: AdminRequest,
  companyAssociation: CompanyAssociation | null,
  adminRequestInput: ParsedAcceptAdminRequestInput
) => {
  if (adminRequest.status === AdminRequestStatus.REFUSED) {
    throw new UserInputError(
      `La demande a déjà été refusée et n'est plus modifiable.`
    );
  }

  if (adminRequest.status === AdminRequestStatus.BLOCKED) {
    throw new UserInputError(
      `La demande a été bloquée et n'est plus modifiable.`
    );
  }

  if (adminRequest.status === AdminRequestStatus.EXPIRED) {
    throw new UserInputError(`La demande a expiré et n'est plus modifiable.`);
  }

  // Admins can accept any request, but they must provide the request id
  if (user.isAdmin && isDefined(adminRequestInput.adminRequestId)) {
    return true;
  }

  // Only admins can accept a request in the initial time period
  if (
    adminRequest.adminOnlyEndDate &&
    new Date().getTime() < new Date(adminRequest.adminOnlyEndDate).getTime() &&
    (!companyAssociation || companyAssociation?.role !== UserRole.ADMIN)
  ) {
    throw new ForbiddenError(
      "Seuls les administrateurs de l'établissement peuvent approuver la demande à ce stade."
    );
  }

  // User can validate his own request only if verification mode = mail
  if (
    user.id === adminRequest.userId &&
    adminRequest.validationMethod !== AdminRequestValidationMethod.SEND_MAIL
  ) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à effectuer cette action."
    );
  }

  // User cannot accept request if he does not belong to the company, except
  // if validation method = MAIL
  if (
    !companyAssociation &&
    adminRequest.validationMethod !== AdminRequestValidationMethod.SEND_MAIL
  ) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à effectuer cette action."
    );
  }

  // Acceptation by mail: code must be correct, 3 attempts max
  // Company admins can validate with the code though
  if (
    (!companyAssociation || companyAssociation.role !== UserRole.ADMIN) &&
    adminRequest.validationMethod === AdminRequestValidationMethod.SEND_MAIL &&
    adminRequestInput.code !== adminRequest.code
  ) {
    // Increment attempts
    const { update } = getAdminRequestRepository(user);
    const updatedRequest = await update(
      {
        id: adminRequest.id
      },
      {
        codeAttempts: { increment: 1 }
      }
    );

    // Max is reached. Block the request
    if (updatedRequest.codeAttempts >= CODE_MAX_ATTEMPTS) {
      await update(
        {
          id: adminRequest.id
        },
        {
          status: AdminRequestStatus.BLOCKED
        }
      );

      throw new UserInputError(
        "Le code de vérification est erroné. La demande a été bloquée."
      );
    }

    throw new UserInputError(
      `Le code de vérification est erroné. Il vous reste ${
        CODE_MAX_ATTEMPTS - updatedRequest.codeAttempts
      } tentatives.`
    );
  }
};

export const sendEmailToCompanyAdmins = async (
  author: User,
  company: Company,
  adminRequest: AdminRequest
) => {
  const adminsCompanyAssociations = await prisma.companyAssociation.findMany({
    where: {
      companyId: adminRequest.companyId,
      role: UserRole.ADMIN,
      userId: { not: adminRequest.userId }
    },
    include: { user: true }
  });

  if (adminsCompanyAssociations.length) {
    const adminMail = renderMail(adminRequestAcceptedAdminEmail, {
      to: adminsCompanyAssociations.map(association => ({
        email: association.user.email,
        name: association.user.name
      })),
      variables: {
        company: { orgId: company.orgId, name: company.name },
        user: { name: author.name }
      }
    });

    await sendMail(adminMail);
  }
};

export const sendEmailToAuthor = async (author: User, company: Company) => {
  // Inform the author by email
  const authorMail = renderMail(adminRequestAcceptedEmail, {
    to: [{ email: author.email, name: author.name }],
    variables: {
      company: { orgId: company.orgId, name: company.name }
    }
  });

  await sendMail(authorMail);
};
