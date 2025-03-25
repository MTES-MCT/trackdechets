import {
  AdminRequest,
  AdminRequestStatus,
  Company,
  CompanyAssociation,
  User,
  UserRole
} from "@prisma/client";
import { ForbiddenError, UserInputError } from "../../../../common/errors";
import { getAdminRequestRepository } from "../../../repository";
import { AdminRequestWithUserAndCompany } from "../../typing";
import { prisma } from "@td/prisma";
import {
  adminRequestRefusedAdminEmail,
  adminRequestRefusedEmail,
  renderMail
} from "@td/mail";
import { sendMail } from "../../../../mailer/mailing";
import { addDays } from "date-fns";

export const getAdminRequestOrThrow = async (
  user: Express.User,
  adminRequestId: string
) => {
  const { findFirst } = getAdminRequestRepository(user);

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

  return adminRequest;
};

export const checkCanRefuseAdminRequest = async (
  user: Express.User,
  adminRequest: AdminRequest,
  companyAssociation: CompanyAssociation | null
) => {
  if (adminRequest.status === AdminRequestStatus.ACCEPTED) {
    throw new UserInputError(
      `La demande a déjà été acceptée et n'est plus modifiable.`
    );
  }

  if (adminRequest.status === AdminRequestStatus.BLOCKED) {
    throw new UserInputError(
      `La demande a déjà été bloquée et n'est plus modifiable.`
    );
  }

  if (adminRequest.status === AdminRequestStatus.EXPIRED) {
    throw new UserInputError(`La demande a expiré et n'est plus modifiable.`);
  }

  // Trackdéchets admins can refuse anything
  if (user.isAdmin) {
    return true;
  }

  // To refuse a request, a user must belong to target company
  if (!companyAssociation) {
    throw new ForbiddenError(
      "Vous n'êtes pas autorisé à effectuer cette action."
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
    const adminMail = renderMail(adminRequestRefusedAdminEmail, {
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
  const mail = renderMail(adminRequestRefusedEmail, {
    to: [{ email: author.email, name: author.name }],
    variables: {
      company: { orgId: company.orgId, name: company.name }
    }
  });

  await sendMail(mail);
};

/**
 * Expire requests that are older than 14 days
 */
export const expireAdminRequests = async () => {
  // TODO: use repository here?
  await prisma.adminRequest.updateMany({
    where: {
      status: AdminRequestStatus.PENDING,
      createdAt: { lt: addDays(new Date(), -14) }
    },
    data: {
      status: AdminRequestStatus.EXPIRED
    }
  });
};
