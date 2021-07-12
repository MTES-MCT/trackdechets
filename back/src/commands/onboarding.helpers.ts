import prisma from "../prisma";
import { sendMail } from "../mailer/mailing";
import { Company, CompanyAssociation, User } from "@prisma/client";
import * as COMPANY_TYPES from "../common/constants/COMPANY_TYPES";
import {
  onboardingFirstStep,
  onboardingProducerSecondStep,
  onboardingProfessionalSecondStep
} from "../mailer/templates";
import { renderMail } from "../mailer/templates/renderers";
/**
 * Compute a past date relative to now
 *
 * @param baseDate Date
 * @param daysAgo Integer
 * @return a date at 00:00:00
 */
export const xDaysAgo = (baseDate: Date, daysAgo: number): Date => {
  const clonedDate = new Date(baseDate.getTime()); // avoid mutating baseDate
  clonedDate.setDate(clonedDate.getDate() - daysAgo);

  return new Date(clonedDate.toDateString());
};

type getRecentlyJoinedUsersParams = {
  daysAgo: number;
  retrieveCompanies?: boolean;
};
export const getRecentlyAssociatedUsers = async ({
  daysAgo,
  retrieveCompanies = false
}: getRecentlyJoinedUsersParams) => {
  const now = new Date();

  const associatedDateGt = xDaysAgo(now, daysAgo);
  const associatedDateLt = xDaysAgo(now, daysAgo - 1);
  // retrieve users whose account was created xDaysAgo
  // and associated company(ies) to tell apart producers and waste professionals according to their type

  return prisma.user.findMany({
    where: {
      firstAssociationDate: { gt: associatedDateGt, lt: associatedDateLt },
      isActive: true
    },
    ...(retrieveCompanies && {
      include: { companyAssociations: { include: { company: true } } }
    })
  });
};

/**
 * Send first step onboarding email to active users who suscribed yesterday
 */
export const sendFirstOnboardingEmail = async () => {
  const recipients = await getRecentlyAssociatedUsers({ daysAgo: 1 });
  await Promise.all(
    recipients.map(recipient => {
      const payload = renderMail(onboardingFirstStep, {
        to: [{ name: recipient.name, email: recipient.email }]
      });
      return sendMail(payload);
    })
  );
  await prisma.$disconnect();
};

type recipientType = User & {
  companyAssociations: (CompanyAssociation & {
    company: Company;
  })[];
};

/**
 * Which email should we send ?
 * We retrieve user company(ies), then check their type
 * If the only type is PRODUCER, we send onboardingProducerSecondStep else
 * we send onboardingProfessionalSecondStep
 * We also have to handle users who belong to several companies
 */
export const selectSecondOnboardingEmail = (recipient: recipientType) => {
  const companyTypes = new Set(
    recipient.companyAssociations.flatMap(c => c.company.companyTypes)
  );

  if ([...companyTypes].some(ct => COMPANY_TYPES.PROFESSIONALS.includes(ct))) {
    return onboardingProfessionalSecondStep;
  }

  return onboardingProducerSecondStep;
};

/**
 * Send second step onboarding email to active users who suscribed 3 days ago
 * email function (and template id) depends upon user profile
 */

export const sendSecondOnboardingEmail = async () => {
  // we explictly retrieve user companies to tell apart producers from waste
  // professionals to selectthe right email template
  const recipients = await getRecentlyAssociatedUsers({
    daysAgo: 3,
    retrieveCompanies: true
  });
  await Promise.all(
    recipients.map(recipient => {
      const mailTemplate = selectSecondOnboardingEmail(recipient);
      const payload = renderMail(mailTemplate, {
        to: [{ email: recipient.email, name: recipient.name }]
      });
      return sendMail(payload);
    })
  );
  await prisma.$disconnect();
};
