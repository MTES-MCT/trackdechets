import prisma from "../prisma";
import { sendMail } from "../mailer/mailing";
import {
  Company,
  CompanyAssociation,
  MembershipRequestStatus,
  User
} from "@prisma/client";
import * as COMPANY_CONSTANTS from "../common/constants/COMPANY_CONSTANTS";
import {
  onboardingFirstStep,
  onboardingProducerSecondStep,
  onboardingProfessionalSecondStep,
  membershipRequestDetailsEmail,
  pendingMembershipRequestDetailsEmail,
  pendingMembershipRequestAdminDetailsEmail
} from "../mailer/templates";
import { renderMail } from "../mailer/templates/renderers";
import { MessageVersion } from "../mailer/types";

/**
 * Compute a past date relative to baseDate
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

  if (
    [...companyTypes].some(ct => COMPANY_CONSTANTS.PROFESSIONALS.includes(ct))
  ) {
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

// Retrieve users:
// - who are active
// - whose account was created x daysAgo
// - who never issued a membership request
// - who do not belong to a company
export const getRecentlyRegisteredUsersWithNoCompanyNorMembershipRequest =
  async (daysAgo: number) => {
    const now = new Date();

    const associatedDateGt = xDaysAgo(now, daysAgo);
    const associatedDateLt = xDaysAgo(now, daysAgo - 1);

    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: associatedDateGt, lt: associatedDateLt },
        isActive: true,
        companyAssociations: { none: {} },
        MembershipRequest: { none: {} }
      }
    });

    return users;
  };

/**
 * Send a mail to users who registered recently and who haven't
 * issued a single MembershipRequest yet
 */
export const sendMembershipRequestDetailsEmail = async () => {
  const recipients =
    await getRecentlyRegisteredUsersWithNoCompanyNorMembershipRequest(7);

  const messageVersions: MessageVersion[] = recipients.map(recipient => ({
    to: [{ email: recipient.email, name: recipient.name }]
  }));

  const payload = renderMail(membershipRequestDetailsEmail, {
    messageVersions
  });

  await sendMail(payload);

  await prisma.$disconnect();
};

export const getActiveUsersWithPendingMembershipRequests = async (
  daysAgo: number
) => {
  const now = new Date();

  const requestDateGt = xDaysAgo(now, daysAgo);
  const requestDateLt = xDaysAgo(now, daysAgo - 1);

  const pendingMembershipRequests = await prisma.membershipRequest.findMany({
    where: {
      createdAt: { gte: requestDateGt, lt: requestDateLt },
      status: MembershipRequestStatus.PENDING
    }
  });

  const uniqueUserIds = [
    ...new Set(pendingMembershipRequests.map(p => p.userId))
  ];

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      id: { in: uniqueUserIds }
    }
  });

  return users;
};

/**
 * Send a mail to all users who issued a membership request and who
 * got no answer
 */
export const sendPendingMembershipRequestDetailsEmail = async () => {
  const recipients = await getActiveUsersWithPendingMembershipRequests(14);

  const messageVersions: MessageVersion[] = recipients.map(recipient => ({
    to: [{ email: recipient.email, name: recipient.name }]
  }));

  const payload = renderMail(pendingMembershipRequestDetailsEmail, {
    messageVersions
  });

  await sendMail(payload);

  await prisma.$disconnect();
};

export const getPendingMembershipRequestsAndAssociatedAdmins = async (
  daysAgo: number
) => {
  const now = new Date();

  const requestDateGt = xDaysAgo(now, daysAgo);
  const requestDateLt = xDaysAgo(now, daysAgo - 1);

  return prisma.membershipRequest.findMany({
    where: {
      createdAt: { gte: requestDateGt, lt: requestDateLt },
      status: MembershipRequestStatus.PENDING,
      user: { isActive: true }
    },
    include: {
      user: true,
      company: {
        include: {
          companyAssociations: {
            where: { role: "ADMIN", user: { isActive: true } },
            include: { user: true }
          }
        }
      }
    }
  });
};

/**
 * For each unanswered membership request issued X days ago, send an
 * email to all the admins of request's targeted company
 */
export const sendPendingMembershipRequestToAdminDetailsEmail = async () => {
  const requests = await getPendingMembershipRequestsAndAssociatedAdmins(14);

  const messageVersions: MessageVersion[] = requests.map(request => {
    const variables = {
      requestId: request.id,
      email: request.user.email,
      orgName: request.company.name,
      orgId: request.company.orgId
    };

    const template = renderMail(pendingMembershipRequestAdminDetailsEmail, {
      variables,
      messageVersions: []
    });

    return {
      to: request.company.companyAssociations.map(companyAssociation => ({
        email: companyAssociation.user.email,
        name: companyAssociation.user.name
      })),
      params: {
        body: template.body
      }
    };
  });

  const payload = renderMail(pendingMembershipRequestAdminDetailsEmail, {
    messageVersions
  });

  await sendMail(payload);

  await prisma.$disconnect();
};
