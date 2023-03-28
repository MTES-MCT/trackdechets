import prisma from "../prisma";
import { sendMail } from "../mailer/mailing";
import {
  Company,
  CompanyAssociation,
  CompanyType,
  MembershipRequestStatus,
  User
} from "@prisma/client";
import * as COMPANY_CONSTANTS from "../common/constants/COMPANY_CONSTANTS";
import {
  onboardingProducerSecondStep,
  onboardingProfessionalSecondStep,
  membershipRequestDetailsEmail,
  pendingMembershipRequestDetailsEmail,
  pendingMembershipRequestAdminDetailsEmail,
  professionalsSecondOnboardingEmail,
  nonProfessionalsSecondOnboardingEmail
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

// /**
//  * Send first step onboarding email to active users who suscribed yesterday
//  */
// export const sendFirstOnboardingEmail = async (daysAgo = 1) => {
//   const recipients = await getRecentlyAssociatedUsers({ daysAgo });
//   await Promise.all(
//     recipients.map(recipient => {
//       const payload = renderMail(onboardingFirstStep, {
//         to: [{ name: recipient.name, email: recipient.email }]
//       });
//       return sendMail(payload);
//     })
//   );
//   await prisma.$disconnect();
// };

type recipientType = User & {
  companyAssociations: (CompanyAssociation & {
    company: Company;
  })[];
};

// TODO: no longer needed ?
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
 * Return recently "registered" professionals. That means either:
 * - Users who joined a verified pro company x days ago
 * - Users who joined a pro company that was verified x days ago, before its verification
 */
export const getRecentlySubscribedProfessionals = async (daysAgo = 2) => {
  const now = new Date();

  const dateGt = xDaysAgo(now, daysAgo);
  const dateLt = xDaysAgo(now, daysAgo - 1);

  // Company has been verified long ago. Fetch new associations
  const recentlyJoiningProsAssociations =
    await prisma.companyAssociation.findMany({
      where: {
        createdAt: { gte: dateGt, lt: dateLt },
        company: {
          companyTypes: {
            hasSome: COMPANY_CONSTANTS.PROFESSIONALS as CompanyType[]
          },
          verifiedAt: { not: null }
        }
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

  // Company has been verified recently. Take all associations created BEFORE
  // verification (should be creator only)
  const recentlyVerifiedCompaniesCreatorsAssociations =
    await prisma.companyAssociation.findMany({
      where: {
        createdAt: { lte: dateGt },
        company: {
          verifiedAt: { gte: dateGt, lt: dateLt },
          companyTypes: {
            hasSome: COMPANY_CONSTANTS.PROFESSIONALS as CompanyType[]
          }
        }
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

  const users = [
    ...recentlyJoiningProsAssociations.map(j => j.user),
    ...recentlyVerifiedCompaniesCreatorsAssociations.map(p => p.user)
  ];

  const uniqueUsers = users.filter(
    (user, index, self) => self.findIndex(v => v.id === user.id) === index
  );

  return uniqueUsers;
};

export const getRecentlySubscribedNonProfessionals = async (daysAgo = 2) => {
  const now = new Date();

  const dateGt = xDaysAgo(now, daysAgo);
  const dateLt = xDaysAgo(now, daysAgo - 1);

  const associations = await prisma.companyAssociation.findMany({
    where: {
      company: {
        createdAt: { gte: dateGt, lt: dateLt },
        companyTypes: {
          hasSome: COMPANY_CONSTANTS.NON_PROFESSIONALS as CompanyType[]
        }
      }
    },
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  });

  return associations.map(a => a.user);
};

/**
 * Second onboarding email. Different for professionals & non-professionals
 */
export const sendSecondOnboardingEmail = async (daysAgo = 2) => {
  // Pros
  const recentProfessionals = await getRecentlySubscribedProfessionals(daysAgo);
  const proMessageVersions: MessageVersion[] = recentProfessionals.map(pro => ({
    to: [{ email: pro.email, name: pro.name }]
  }));
  const proPayload = renderMail(professionalsSecondOnboardingEmail, {
    messageVersions: proMessageVersions
  });
  await sendMail(proPayload);

  // Non-pros
  const recentNonProfessionals = await getRecentlySubscribedNonProfessionals(
    daysAgo
  );
  const nonProMessageVersions: MessageVersion[] = recentNonProfessionals.map(
    nonPro => ({
      to: [{ email: nonPro.email, name: nonPro.name }]
    })
  );
  const nonProPayload = renderMail(nonProfessionalsSecondOnboardingEmail, {
    messageVersions: nonProMessageVersions
  });
  await sendMail(nonProPayload);

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
export const sendMembershipRequestDetailsEmail = async (daysAgo = 7) => {
  const recipients =
    await getRecentlyRegisteredUsersWithNoCompanyNorMembershipRequest(daysAgo);

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
export const sendPendingMembershipRequestDetailsEmail = async (
  daysAgo = 14
) => {
  const recipients = await getActiveUsersWithPendingMembershipRequests(daysAgo);

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
export const sendPendingMembershipRequestToAdminDetailsEmail = async (
  daysAgo = 14
) => {
  const requests = await getPendingMembershipRequestsAndAssociatedAdmins(
    daysAgo
  );

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
