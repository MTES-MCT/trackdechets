import { prisma } from "@td/prisma";
import { sendMail } from "../../../../mailer/mailing";
import {
  adminRequestInitialInfoToAuthorEmail,
  adminRequestInitialWarningToAdminEmail,
  renderMail
} from "@td/mail";
import {
  AdminRequest,
  AdminRequestStatus,
  AdminRequestValidationMethod,
  Company,
  CompanyAssociation,
  User,
  UserRole
} from "@td/prisma";
import { getNextWorkday } from "../../../../dateUtils";
import { sameDayMidnight } from "../../../../utils";
import { ParsedCreateAdminRequestInput } from "../../../validation";
import { UserInputError } from "../../../../common/errors";
import { getAdminRequestRepository } from "../../../repository";
import { addDays } from "date-fns";
import { isDefinedStrict } from "../../../../common/helpers";



// Generates an 8 digit code, using only numbers. Can include and start with zeros
export const generateCode = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

export const checkCanCreateAdminRequest = async (
  user: Express.User,
  adminRequestInput: ParsedCreateAdminRequestInput,
  company: Company,
  companyAssociation: CompanyAssociation | null,
  collaborator: User | null
) => {
  if (companyAssociation?.role === UserRole.ADMIN) {
    throw new UserInputError(
      "Vous êtes déjà administrateur de cet établissement."
    );
  }

  if (adminRequestInput.collaboratorEmail) {
    if (!collaborator) {
      throw new UserInputError(
        "Ce collaborateur n'est pas inscrit sur Trackdéchets."
      );
    }

    if (collaborator && collaborator.id === user.id) {
      throw new UserInputError(
        "Vous ne pouvez pas vous désigner vous-même en temps que collaborateur."
      );
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
        "Ce collaborateur n'est pas rattaché à cet établissement."
      );
    }
  }

  const { findFirst, count } = getAdminRequestRepository(user);

  // Careful here not to be spammed and spend lots of $ on sending mail
  if (
    adminRequestInput.validationMethod ===
    AdminRequestValidationMethod.SEND_MAIL
  ) {
    const mailRequestsCount = await count({
      validationMethod: AdminRequestValidationMethod.SEND_MAIL,
      createdAt: { gt: addDays(new Date(), -7) }
    });

    // Not optimal to place this here, but allows for mocking & testing
    const MAX_ADMIN_REQUESTS_MAILS_PER_WEEK = isDefinedStrict(
      process.env.MAX_ADMIN_REQUESTS_MAILS_PER_WEEK
    )
      ? parseInt(process.env.MAX_ADMIN_REQUESTS_MAILS_PER_WEEK)
      : 100;

    if (mailRequestsCount >= MAX_ADMIN_REQUESTS_MAILS_PER_WEEK) {
      throw new UserInputError(
        "La vérification par courrier a été temporairement désactivée. Veuillez choisir une autre méthode de vérification ou contacter le support."
      );
    }
  }

  // Make sure there isn't already a PENDING request
  const existingPendingRequest = await findFirst({
    userId: user.id,
    companyId: company.id,
    status: AdminRequestStatus.PENDING
  });

  if (existingPendingRequest) {
    throw new UserInputError(
      "Une demande est déjà en cours pour cet établissement."
    );
  }

  // Make sure the user hasn't already a recent REFUSED request
  const existingRefusedRequest = await findFirst({
    userId: user.id,
    companyId: company.id,
    status: AdminRequestStatus.REFUSED,
    updatedAt: { gt: addDays(new Date(), -7) } // Past week
  });

  if (existingRefusedRequest) {
    throw new UserInputError(
      "Une demande a déjà été refusée pour cet établissement au cours des 7 derniers jours."
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
        company: { orgId: company.orgId, name: company.name },
        user: { name: author.name, email: author.email },
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
};

export const sendEmailToAuthor = async (
  author: User,
  company: Company,
  adminRequest: AdminRequest
) => {
  const mail = renderMail(adminRequestInitialInfoToAuthorEmail, {
    to: [{ email: author.email, name: author.name }],
    variables: {
      company: { orgId: company.orgId, name: company.name },
      isValidationByCollaboratorApproval:
        adminRequest.validationMethod ===
        AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
      isValidationByMail:
        adminRequest.validationMethod === AdminRequestValidationMethod.SEND_MAIL
    }
  });

  await sendMail(mail);
};

/**
 * Les admins ont 1 jour ouvré pour répondre. On prend donc le prochain jour ouvré,
 * et on ajoute une journée
 */
export const getAdminOnlyEndDate = (): Date => {
  const resultDate = getNextWorkday(new Date());
  resultDate.setDate(resultDate.getDate() + 1);

  return sameDayMidnight(resultDate);
};

