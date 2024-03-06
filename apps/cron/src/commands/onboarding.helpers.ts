import {
  getCompaniesAndActiveAdminsByCompanyOrgIds,
  formatDate,
  sendMail
} from "back";
import { prisma } from "@td/prisma";
import {
  CompanyType,
  MembershipRequestStatus,
  BsdaRevisionRequest,
  BsdaRevisionRequestApproval,
  BsddRevisionRequest,
  BsddRevisionRequestApproval,
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
  pendingMembershipRequestAdminDetailsEmail,
  profesionalsSecondOnboardingEmail,
  producersSecondOnboardingEmail,
  pendingRevisionRequestAdminDetailsEmail
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
export const sendSecondOnboardingEmail = async (daysAgo = 2) => {
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

    await sendMail(proPayload);
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

    await sendMail(producersPayload);
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
export const sendMembershipRequestDetailsEmail = async (daysAgo = 7) => {
  const recipients =
    await getRecentlyRegisteredUsersWithNoCompanyNorMembershipRequest(daysAgo);

  if (recipients.length) {
    const messageVersions: MessageVersion[] = recipients.map(recipient => ({
      to: [{ email: recipient.email, name: recipient.name }]
    }));

    const payload = renderMail(membershipRequestDetailsEmail, {
      messageVersions
    });

    await sendMail(payload);
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
  daysAgo = 14
) => {
  const recipients = await getActiveUsersWithPendingMembershipRequests(daysAgo);

  if (recipients.length) {
    const messageVersions: MessageVersion[] = recipients.map(recipient => ({
      to: [{ email: recipient.email, name: recipient.name }]
    }));

    const payload = renderMail(pendingMembershipRequestDetailsEmail, {
      messageVersions
    });

    await sendMail(payload);
  }

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

  if (requests.length) {
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
        ...(template.body && {
          params: {
            body: template.body
          }
        })
      };
    });

    const payload = renderMail(pendingMembershipRequestAdminDetailsEmail, {
      messageVersions
    });

    await sendMail(payload);
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
    });

type RequestWithWrappedApprovals =
  | (BsddRevisionRequestWithReadableId & {
      approvals: (BsddRevisionRequestApproval & {
        admins: User[];
        company: Company;
      })[];
    })
  | (BsdaRevisionRequest & {
      approvals: (BsdaRevisionRequestApproval & {
        admins: User[];
        company: Company;
      })[];
    });

/**
 * Will add pending approval companies' admins to requests
 */
export const addPendingApprovalsCompanyAdmins = async (
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

  // Find companies and their respective admins
  const companiesAndAdminsByOrgIds =
    await getCompaniesAndActiveAdminsByCompanyOrgIds(companySirets);

  // Add admins to requests
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
          admins: companiesAndAdminsByOrgIds[approval.approverSiret].admins
        }))
    };
  });
};

export const getPendingBSDDRevisionRequestsWithAdmins = async (
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
  return await addPendingApprovalsCompanyAdmins(requests);
};

export const getPendingBSDARevisionRequestsWithAdmins = async (
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
  return await addPendingApprovalsCompanyAdmins(requests);
};

/**
 * Send an email to admins who didn't answer to a revision request
 */
export const sendPendingRevisionRequestToAdminDetailsEmail = async (
  daysAgo = 5
) => {
  const pendingBsddRevisionRequest =
    await getPendingBSDDRevisionRequestsWithAdmins(daysAgo);
  const pendingBsdaRevisionRequest =
    await getPendingBSDARevisionRequestsWithAdmins(daysAgo);

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

          const template = renderMail(pendingRevisionRequestAdminDetailsEmail, {
            variables,
            messageVersions: []
          });

          return {
            to: approval.admins.map(admin => ({
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

    const payload = renderMail(pendingRevisionRequestAdminDetailsEmail, {
      messageVersions
    });

    await sendMail(payload);
  }

  await prisma.$disconnect();
};
