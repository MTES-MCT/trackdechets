import {
  getCompaniesAndSubscribersByCompanyOrgIds,
  formatDate,
  sendMail,
  UserNotification,
  getDelegationNotifiableUsers,
  getRegistryDelegationsExpiringInDays
} from "back";
import { prisma } from "@td/prisma";
import {
  CompanyType,
  MembershipRequestStatus,
  BsdaRevisionRequest,
  BsdaRevisionRequestApproval,
  BsddRevisionRequest,
  BsdasriRevisionRequestApproval,
  BsddRevisionRequestApproval,
  BsdasriRevisionRequest,
  Company,
  RevisionRequestApprovalStatus,
  RevisionRequestStatus,
  User
} from "@prisma/client";
import * as COMPANY_CONSTANTS from "@td/constants";
import {
  renderMail,
  MessageVersion,
  membershipRequestDetailsEmail,
  pendingMembershipRequestDetailsEmail,
  pendingMembershipRequestEmail,
  profesionalsSecondOnboardingEmail,
  producersSecondOnboardingEmail,
  pendingRevisionRequestEmail,
  expiringRegistryDelegationWarning
} from "@td/mail";
import { xDaysAgo } from "./helpers";

/**
 * Return recently "registered" profesionals. That means either:
 * - Users who joined a verified pro company x days ago
 * - Users who joined a pro company that was verified x days ago, before its verification
 */
export const getRecentlyRegisteredProfesionals = async (daysAgo = 2) => {
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
          verifiedAt: { lte: dateGt }
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
        createdAt: { lte: dateLt },
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

export const getRecentlyRegisteredProducers = async (daysAgo = 2) => {
  const now = new Date();

  const dateGt = xDaysAgo(now, daysAgo);
  const dateLt = xDaysAgo(now, daysAgo - 1);

  const associations = await prisma.companyAssociation.findMany({
    where: {
      createdAt: { gte: dateGt, lt: dateLt },
      company: {
        companyTypes: {
          hasSome: COMPANY_CONSTANTS.NON_PROFESSIONALS as CompanyType[]
        }
      }
    },
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  });

  const uniqueUsers = associations
    .map(a => a.user)
    .filter(
      (user, index, self) => self.findIndex(v => v.id === user.id) === index
    );

  return uniqueUsers;
};

/**
 * Second onboarding email. Different for profesionals & non-profesionals / producers
 */
export const sendSecondOnboardingEmail = async (daysAgo = 2, sync = false) => {
  // Pros
  const profesionals = await getRecentlyRegisteredProfesionals(daysAgo);

  // Send pros email (if any)
  if (profesionals.length) {
    const proMessageVersions: MessageVersion[] = profesionals.map(pro => ({
      to: [{ email: pro.email, name: pro.name }]
    }));
    const proPayload = renderMail(profesionalsSecondOnboardingEmail, {
      messageVersions: proMessageVersions
    });

    await sendMail(proPayload, { sync });
  }

  // Producers. If already in pro list, remove (only 1 email, pro has priority)
  const producers = await getRecentlyRegisteredProducers(daysAgo);
  const profesionalsIds = profesionals.map(p => p.id);
  const filteredProducers = producers.filter(
    r => !profesionalsIds.includes(r.id)
  );

  // Send producers email (if any)
  if (filteredProducers.length) {
    const producersMessageVersions: MessageVersion[] = filteredProducers.map(
      producer => ({
        to: [{ email: producer.email, name: producer.name }]
      })
    );
    const producersPayload = renderMail(producersSecondOnboardingEmail, {
      messageVersions: producersMessageVersions
    });

    await sendMail(producersPayload, { sync });
  }

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
export const sendMembershipRequestDetailsEmail = async (
  daysAgo = 7,
  sync = false
) => {
  const recipients =
    await getRecentlyRegisteredUsersWithNoCompanyNorMembershipRequest(daysAgo);

  if (recipients.length) {
    const messageVersions: MessageVersion[] = recipients.map(recipient => ({
      to: [{ email: recipient.email, name: recipient.name }]
    }));

    const payload = renderMail(membershipRequestDetailsEmail, {
      messageVersions
    });

    await sendMail(payload, { sync });
  }

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
  daysAgo = 14,
  sync = false
) => {
  const recipients = await getActiveUsersWithPendingMembershipRequests(daysAgo);

  if (recipients.length) {
    const messageVersions: MessageVersion[] = recipients.map(recipient => ({
      to: [{ email: recipient.email, name: recipient.name }]
    }));

    const payload = renderMail(pendingMembershipRequestDetailsEmail, {
      messageVersions
    });

    await sendMail(payload, { sync });
  }

  await prisma.$disconnect();
};

/**
 * Récupère toutes les demandes de rattachement qui sont en attente depuis `daysAgo`
 * jours ainsi que :
 * - les établissements de rattachement correspondants.
 * - les utilisateurs au sein de ces établissements qui sont abonnées aux notifications
 * de demandes de rattachement par e-mail.
 */
export const getPendingMembershipRequestsAndAssociatedSubscribers = async (
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
            where: {
              notificationIsActiveMembershipRequest: true,
              user: {
                isActive: true
              }
            },
            include: { user: true }
          }
        }
      }
    }
  });
};

/**
 * For each unanswered membership request issued X days ago, send an
 * email to all the users inside the companies who are subsribed to
 * membership requests notifications by e-mail.
 */
export const sendPendingMembershipRequestEmail = async (
  daysAgo = 14,
  sync = false
) => {
  const requests = await getPendingMembershipRequestsAndAssociatedSubscribers(
    daysAgo
  );

  if (requests.length) {
    const messageVersions: MessageVersion[] = requests
      .map(request => {
        const variables = {
          requestId: request.id,
          email: request.user.email,
          orgName: request.company.name,
          orgId: request.company.orgId
        };

        const template = renderMail(pendingMembershipRequestEmail, {
          variables,
          messageVersions: []
        });

        if (request.company.companyAssociations.length) {
          return {
            to: request.company.companyAssociations.map(companyAssociation => ({
              email: companyAssociation.user.email,
              name: companyAssociation.user.name
            })),
            ...(template.body && {
              params: {
                body: template.body
              }
            })
          };
        }

        return null;
      })
      .filter(Boolean);

    const payload = renderMail(pendingMembershipRequestEmail, {
      messageVersions
    });

    await sendMail(payload, { sync });
  }

  await prisma.$disconnect();
};

export interface BsddRevisionRequestWithReadableId extends BsddRevisionRequest {
  bsdd: { readableId: string };
}

type RequestWithApprovals =
  | (BsddRevisionRequestWithReadableId & {
      approvals: BsddRevisionRequestApproval[];
    })
  | (BsdaRevisionRequest & {
      approvals: BsdaRevisionRequestApproval[];
    })
  | (BsdasriRevisionRequest & {
      approvals: BsdasriRevisionRequestApproval[];
    });

type RequestWithWrappedApprovals =
  | (BsddRevisionRequestWithReadableId & {
      approvals: (BsddRevisionRequestApproval & {
        subscribers: User[];
        company: Company;
      })[];
    })
  | (BsdaRevisionRequest & {
      approvals: (BsdaRevisionRequestApproval & {
        subscribers: User[];
        company: Company;
      })[];
    })
  | (BsdasriRevisionRequest & {
      approvals: (BsdasriRevisionRequestApproval & {
        subscribers: User[];
        company: Company;
      })[];
    });

/**
 * Will add pending approval companies' admins to requests
 */
export const addPendingApprovalsCompanySubscribers = async (
  requests: RequestWithApprovals[]
): Promise<RequestWithWrappedApprovals[]> => {
  // Extract all pending company sirets
  const companySirets: string[] = requests
    .map(request =>
      request.approvals
        .filter(
          approval => approval.status === RevisionRequestApprovalStatus.PENDING
        )
        .map(approvals => approvals.approverSiret)
    )
    .flat();

  // Find companies and their respective mail subscribers
  const companiesAndAdminsByOrgIds =
    await getCompaniesAndSubscribersByCompanyOrgIds(
      companySirets,
      UserNotification.REVISION_REQUEST
    );

  // Add mail subscribers to requests
  return requests.map((request: RequestWithApprovals) => {
    return {
      ...request,
      approvals: request.approvals
        .filter(
          approval =>
            approval.status === RevisionRequestApprovalStatus.PENDING &&
            // Make sure company exists. May have been deleted.
            Boolean(companiesAndAdminsByOrgIds[approval.approverSiret])
        )
        .map(approval => ({
          ...approval,
          company: companiesAndAdminsByOrgIds[approval.approverSiret],
          subscribers:
            companiesAndAdminsByOrgIds[approval.approverSiret].subscribers
        }))
    };
  });
};

export const getPendingBSDDRevisionRequestsWithSubscribers = async (
  daysAgo: number
): Promise<RequestWithWrappedApprovals[]> => {
  const now = new Date();

  const requestDateGt = xDaysAgo(now, daysAgo);
  const requestDateLt = xDaysAgo(now, daysAgo - 1);

  // Get all pending requests
  const requests = await prisma.bsddRevisionRequest.findMany({
    where: {
      createdAt: { gte: requestDateGt, lt: requestDateLt },
      status: RevisionRequestStatus.PENDING
    },
    include: { approvals: true, bsdd: { select: { readableId: true } } }
  });

  // Add admins to requests
  return await addPendingApprovalsCompanySubscribers(requests);
};

export const getPendingBSDARevisionRequestsWithSubscribers = async (
  daysAgo: number
): Promise<RequestWithWrappedApprovals[]> => {
  const now = new Date();

  const requestDateGt = xDaysAgo(now, daysAgo);
  const requestDateLt = xDaysAgo(now, daysAgo - 1);

  // Get all pending requests
  const requests = await prisma.bsdaRevisionRequest.findMany({
    where: {
      createdAt: { gte: requestDateGt, lt: requestDateLt },
      status: RevisionRequestStatus.PENDING
    },
    include: { approvals: true }
  });

  // Add admins to requests
  return await addPendingApprovalsCompanySubscribers(requests);
};

export const getPendingBSDASRIRevisionRequestsWithSubscribers = async (
  daysAgo: number
): Promise<RequestWithWrappedApprovals[]> => {
  const now = new Date();

  const requestDateGt = xDaysAgo(now, daysAgo);
  const requestDateLt = xDaysAgo(now, daysAgo - 1);

  // Get all pending requests
  const requests = await prisma.bsdasriRevisionRequest.findMany({
    where: {
      createdAt: { gte: requestDateGt, lt: requestDateLt },
      status: RevisionRequestStatus.PENDING
    },
    include: { approvals: true }
  });

  // Add admins to requests
  return await addPendingApprovalsCompanySubscribers(requests);
};

/**
 * Send an email to admins who didn't answer to a revision request
 */
export const sendPendingRevisionRequestEmail = async (
  daysAgo = 5,
  sync = false
) => {
  const pendingBsddRevisionRequest =
    await getPendingBSDDRevisionRequestsWithSubscribers(daysAgo);
  const pendingBsdaRevisionRequest =
    await getPendingBSDARevisionRequestsWithSubscribers(daysAgo);

  const requests = [
    ...pendingBsddRevisionRequest,
    ...pendingBsdaRevisionRequest
  ];

  if (requests.length) {
    // Build a message template for each request, for each approval
    const messageVersions: MessageVersion[] = requests
      .filter(request => request.approvals.length !== 0)
      .map(request => {
        return request.approvals.map(approval => {
          const variables = {
            requestCreatedAt: formatDate(request.createdAt),
            bsdReadableId:
              (request as BsddRevisionRequestWithReadableId).bsdd?.readableId ??
              (request as BsdaRevisionRequest).bsdaId,
            bsdId:
              (request as BsddRevisionRequestWithReadableId).bsddId ??
              (request as BsdaRevisionRequest).bsdaId,
            companyName: approval.company.name,
            companyOrgId: approval.company.orgId
          };

          const template = renderMail(pendingRevisionRequestEmail, {
            variables,
            messageVersions: []
          });

          return {
            to: approval.subscribers.map(admin => ({
              email: admin.email,
              name: admin.name
            })),
            ...(template.body && {
              params: {
                body: template.body
              }
            })
          };
        });
      })
      .flat();

    const payload = renderMail(pendingRevisionRequestEmail, {
      messageVersions
    });

    await sendMail(payload, { sync });
  }

  await prisma.$disconnect();
};

/**
 * If a delegation expires in X days, warn involved companies' users.
 *
 * If delegation isn't even X days long, skip.
 */
export const sendExpiringRegistryDelegationWarning = async () => {
  const expiringDelegations = await getRegistryDelegationsExpiringInDays(7);

  const messageVersions: MessageVersion[] = await Promise.all(
    expiringDelegations
      .map(async delegation => {
        const users = await getDelegationNotifiableUsers(delegation);

        if (!users.length) return undefined;

        const template = renderMail(expiringRegistryDelegationWarning, {
          variables: {
            // TODO
          },
          messageVersions: []
        });

        return {
          to: users.map(user => ({
            email: user.email,
            name: user.name
          })),
          ...(template.body && {
            params: {
              body: template.body
            }
          })
        };
      })
      .filter(Boolean) as unknown as MessageVersion[]
  );

  const payload = renderMail(pendingRevisionRequestEmail, {
    messageVersions
  });

  await sendMail(payload);
};
