import { prisma } from "@td/prisma";
import { sendMail } from "../../../../mailer/mailing";
import {
  adminRequestInitialInfoToAuthorEmail,
  adminRequestInitialWarningToAdminEmail,
  renderMail
} from "@td/mail";
import {
  AdminRequest,
  AdminRequestValidationMethod,
  Company,
  User,
  UserRole
} from "@prisma/client";
import { getNextWorkday } from "../../../../dateUtils";
import { sameDayMidnight } from "../../../../utils";

// Generates an 8 digit code, using only numbers. Can include and start with zeros
export const generateCode = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
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
        company,
        user: author,
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
      company,
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
