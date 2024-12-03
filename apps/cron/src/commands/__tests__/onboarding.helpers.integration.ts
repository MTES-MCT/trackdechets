import {
  BsdaRevisionRequest,
  BsdasriRevisionRequest,
  MembershipRequestStatus,
  UserRole
} from "@prisma/client";
import { prisma } from "@td/prisma";
import {
  associateUserToCompany,
  endOfDay,
  inXDays,
  Mutation,
  MutationDeleteCompanyArgs,
  todayAtMidnight,
  toddMMYYYY
} from "back";
import { resetDatabase } from "libs/back/tests-integration";
import makeClient from "back/src/__tests__/testClient";
import {
  companyAssociatedToExistingUserFactory,
  companyFactory,
  createMembershipRequest,
  formFactory,
  userFactory,
  userWithCompanyFactory
} from "back/src/__tests__/factories";
import { registryDelegationFactory } from "back/src/registryDelegation/__tests__/factories";
import { bsdaFactory } from "back/src/bsda/__tests__/factories";
import { bsdasriFactory } from "back/src/bsdasris/__tests__/factories";
import {
  BsddRevisionRequestWithReadableId,
  addPendingApprovalsCompanySubscribers,
  getActiveUsersWithPendingMembershipRequests,
  getPendingBSDARevisionRequestsWithSubscribers,
  getPendingBSDDRevisionRequestsWithSubscribers,
  getPendingBSDASRIRevisionRequestsWithSubscribers,
  getPendingMembershipRequestsAndAssociatedSubscribers,
  getRecentlyRegisteredProducers,
  getRecentlyRegisteredProfesionals,
  getRecentlyRegisteredUsersWithNoCompanyNorMembershipRequest,
  getExpiringRegistryDelegationWarningMailPayloads
} from "../onboarding.helpers";
import { xDaysAgo } from "../helpers";

const TODAY = new Date();
const ONE_DAY_AGO = xDaysAgo(TODAY, 1);
const TWO_DAYS_AGO = xDaysAgo(TODAY, 2);
const THREE_DAYS_AGO = xDaysAgo(TODAY, 3);
const FOUR_DAYS_AGO = xDaysAgo(TODAY, 4);

const NOW = todayAtMidnight();
const YESTERDAY = xDaysAgo(NOW, 1);
const NOW_PLUS_SEVEN_DAYS = endOfDay(inXDays(NOW, 7));

export const DELETE_COMPANY = `
  mutation DeleteCompany($id: ID!) {
    deleteCompany(id: $id) {
      id
    }
  }
`;

describe("getRecentlyRegisteredUsersWithNoCompanyNorMembershipRequest", () => {
  afterEach(resetDatabase);

  it("should return users created X days ago", async () => {
    // Should be returned
    const userMinus3Days = await userFactory({ createdAt: THREE_DAYS_AGO });

    // Should not be returned because not created 3 days ago
    await userFactory({ createdAt: TWO_DAYS_AGO });
    await userFactory({ createdAt: TODAY });

    const users =
      await getRecentlyRegisteredUsersWithNoCompanyNorMembershipRequest(3);

    expect(users.length).toEqual(1);
    expect(users[0].id).toEqual(userMinus3Days.id);
  });

  it("should return active users created X days ago", async () => {
    // Should be returned
    const userMinus3Days = await userFactory({
      createdAt: THREE_DAYS_AGO,
      isActive: true
    });

    // Should not be returned because not active
    await userFactory({
      createdAt: THREE_DAYS_AGO,
      isActive: false
    });

    // Should not be returned because not created 3 days ago
    await userFactory({ createdAt: TWO_DAYS_AGO });
    await userFactory({ createdAt: TODAY });

    const users =
      await getRecentlyRegisteredUsersWithNoCompanyNorMembershipRequest(3);

    expect(users.length).toEqual(1);
    expect(users[0].id).toEqual(userMinus3Days.id);
  });

  it("should return users created X days ago with no company", async () => {
    // Should be returned
    const userWithNoCompany = await userFactory();

    // Should not be returned cause belongs to a company
    const userWithCompany = await userFactory();
    await companyAssociatedToExistingUserFactory(
      userWithCompany,
      UserRole.MEMBER
    );

    const users =
      await getRecentlyRegisteredUsersWithNoCompanyNorMembershipRequest(0);

    expect(users.length).toEqual(1);
    expect(users[0].id).toEqual(userWithNoCompany.id);
  });

  it("should return users created X days ago with no membershipRequest", async () => {
    const company = await companyFactory();

    // Should be returned
    const userWithNoMembershipRequest = await userFactory();

    // Should not be returned because has a membership request
    const userWithMembershipRequest = await userFactory();
    await createMembershipRequest(userWithMembershipRequest, company);

    const users =
      await getRecentlyRegisteredUsersWithNoCompanyNorMembershipRequest(0);

    expect(users.length).toEqual(1);
    expect(users[0].id).toEqual(userWithNoMembershipRequest.id);
  });

  it("should return active users created X days ago with no company and no membershipRequest", async () => {
    const company = await companyFactory();

    // Should be returned
    const userCreated3DaysAgo = await userFactory({
      createdAt: THREE_DAYS_AGO
    });

    // Should not be returned cause not active
    await userFactory({
      createdAt: THREE_DAYS_AGO,
      isActive: false
    });

    // Should not be returned cause belongs to a company
    const userCreated3DaysAgoWithACompany = await userFactory({
      createdAt: THREE_DAYS_AGO
    });
    await companyAssociatedToExistingUserFactory(
      userCreated3DaysAgoWithACompany,
      UserRole.MEMBER
    );

    // Should not be returned cause has a membership request
    const userCreated3DaysAgoWithMembershipRequest = await userFactory({
      createdAt: THREE_DAYS_AGO
    });
    await createMembershipRequest(
      userCreated3DaysAgoWithMembershipRequest,
      company
    );

    // Should not be returned cause has a company and a membership request
    const userCreated3DaysAgoWithCompanyAndMembershipRequest =
      await userFactory({
        createdAt: THREE_DAYS_AGO
      });
    await companyAssociatedToExistingUserFactory(
      userCreated3DaysAgoWithCompanyAndMembershipRequest,
      UserRole.MEMBER
    );
    await createMembershipRequest(
      userCreated3DaysAgoWithCompanyAndMembershipRequest,
      company
    );

    // Should not be returned cause created 2 days ago
    await userFactory({
      createdAt: TWO_DAYS_AGO
    });

    // Should not be returned cause created 4 days ago
    await userFactory({
      createdAt: FOUR_DAYS_AGO
    });

    const users =
      await getRecentlyRegisteredUsersWithNoCompanyNorMembershipRequest(3);

    expect(users.length).toEqual(1);
    expect(users[0].id).toEqual(userCreated3DaysAgo.id);
  });
});

describe("getActiveUsersWithPendingMembershipRequests", () => {
  afterEach(resetDatabase);

  it("should return user that created a membership request X days ago", async () => {
    const company = await companyFactory();

    // Should return this user
    const user = await userFactory();
    await createMembershipRequest(user, company, {
      createdAt: THREE_DAYS_AGO
    });

    // Should not return this user because unactive
    const unactiveUser = await userFactory({ isActive: false });
    await createMembershipRequest(unactiveUser, company, {
      createdAt: THREE_DAYS_AGO
    });

    // Should not return this user because 2 days ago, not 3
    const user2DaysAgo = await userFactory();
    await createMembershipRequest(user2DaysAgo, company, {
      createdAt: TWO_DAYS_AGO
    });

    // Should not return this user because no membership request
    await userFactory();

    // Should not return because request is not PENDING
    const userWithPendingRequest = await userFactory();
    await createMembershipRequest(userWithPendingRequest, company, {
      status: MembershipRequestStatus.ACCEPTED,
      createdAt: TWO_DAYS_AGO
    });

    const users = await getActiveUsersWithPendingMembershipRequests(3);

    expect(users.length).toEqual(1);
    expect(users[0].id).toEqual(user.id);
  });

  it("should return user that created a membership request X days ago only once", async () => {
    const user = await userFactory();
    const company0 = await companyFactory();
    const company1 = await companyFactory();

    await createMembershipRequest(user, company0, {
      createdAt: THREE_DAYS_AGO
    });

    await createMembershipRequest(user, company1, {
      createdAt: THREE_DAYS_AGO
    });

    const users = await getActiveUsersWithPendingMembershipRequests(3);

    expect(users.length).toEqual(1);
    expect(users[0].id).toEqual(user.id);
  });

  it("should return user that created a membership request X days ago with PENDING status only", async () => {
    const company = await companyFactory();

    // Should be the only one returned cause status PENDING
    const user0 = await userFactory();
    await createMembershipRequest(user0, company, {
      createdAt: THREE_DAYS_AGO,
      status: MembershipRequestStatus.PENDING
    });

    const user1 = await userFactory();
    await createMembershipRequest(user1, company, {
      createdAt: THREE_DAYS_AGO,
      status: MembershipRequestStatus.REFUSED
    });

    const user2 = await userFactory();
    await createMembershipRequest(user2, company, {
      createdAt: THREE_DAYS_AGO,
      status: MembershipRequestStatus.ACCEPTED
    });

    const users = await getActiveUsersWithPendingMembershipRequests(3);

    expect(users.length).toEqual(1);
    expect(users[0].id).toEqual(user0.id);
  });
});

describe("getPendingMembershipRequestsAndAssociatedMailSubscribers ", () => {
  afterEach(resetDatabase);

  it("should return pending membership requests created X days ago with all associated notification subscribers", async () => {
    const user0 = await userFactory();
    const user1 = await userFactory();
    const user2 = await userFactory();
    const user3 = await userFactory({ isActive: false });

    const companyAndAdmin0 = await userWithCompanyFactory(
      "ADMIN",
      {},
      {},
      { notificationIsActiveMembershipRequest: true }
    );

    // crée un second admin abonné aux notifications de demandes de rattachement
    const admin01 = await userFactory();
    await associateUserToCompany(
      admin01.id,
      companyAndAdmin0.company.orgId,
      UserRole.ADMIN,
      { notificationIsActiveMembershipRequest: true }
    );

    // crée un troisième admin qui n'est pas abonné aux notifications de demandes de rattachement
    const admin02 = await userFactory();
    await associateUserToCompany(
      admin02.id,
      companyAndAdmin0.company.orgId,
      UserRole.ADMIN,
      { notificationIsActiveMembershipRequest: false }
    );

    const companyAndAdmin1 = await userWithCompanyFactory("ADMIN");
    const companyAndAdmin2 = await userWithCompanyFactory("ADMIN");
    const companyAndAdmin3 = await userWithCompanyFactory("ADMIN");

    // Should be returned, along with admin
    const request0 = await createMembershipRequest(
      user0,
      companyAndAdmin0.company,
      {
        createdAt: THREE_DAYS_AGO,
        status: MembershipRequestStatus.PENDING
      }
    );

    // Should not be returned, because 2 days ago
    await createMembershipRequest(user1, companyAndAdmin1.company, {
      createdAt: TWO_DAYS_AGO,
      status: MembershipRequestStatus.PENDING
    });

    // Should not be returned, because request was accepted
    await createMembershipRequest(user2, companyAndAdmin2.company, {
      createdAt: THREE_DAYS_AGO,
      status: MembershipRequestStatus.ACCEPTED
    });

    // Should not be returned, because user is unactive
    await createMembershipRequest(user3, companyAndAdmin3.company, {
      createdAt: THREE_DAYS_AGO,
      status: MembershipRequestStatus.PENDING
    });

    const requests = await getPendingMembershipRequestsAndAssociatedSubscribers(
      3
    );

    expect(requests.length).toEqual(1);

    expect(requests).toEqual([
      expect.objectContaining({
        id: request0.id,
        user: expect.objectContaining({ email: user0.email }),
        company: expect.objectContaining({
          orgId: companyAndAdmin0.company.orgId,
          companyAssociations: [
            expect.objectContaining({
              user: expect.objectContaining({
                email: companyAndAdmin0.user.email
              })
            }),
            expect.objectContaining({
              user: expect.objectContaining({
                email: admin01.email
              })
            })
            // admin02 ne doit pas être présent ici car
            // il n'est pas abonné aux notifications de
            // demandes de rattachement
          ]
        })
      })
    ]);
  });

  it("should return all requests from a user, even if targeting different companies", async () => {
    const user0 = await userFactory();

    // Should be returned
    const companyAndAdmin0 = await userWithCompanyFactory("ADMIN");

    // Should be returned
    const companyAndAdmin1 = await userWithCompanyFactory("ADMIN");

    // Should be returned, along with admin
    const request0 = await createMembershipRequest(
      user0,
      companyAndAdmin0.company,
      {
        createdAt: THREE_DAYS_AGO,
        status: MembershipRequestStatus.PENDING
      }
    );

    // Should be returned, along with admin
    const request1 = await createMembershipRequest(
      user0,
      companyAndAdmin1.company,
      {
        createdAt: THREE_DAYS_AGO,
        status: MembershipRequestStatus.PENDING
      }
    );

    const requests = await getPendingMembershipRequestsAndAssociatedSubscribers(
      3
    );

    expect(requests.length).toEqual(2);

    expect(requests.find(r => r.id === request0.id)).toMatchObject({
      id: request0.id,
      company: expect.objectContaining({
        orgId: companyAndAdmin0.company.orgId
      }),
      user: expect.objectContaining({ email: user0.email })
    });

    expect(requests.find(r => r.id == request1.id)).toMatchObject({
      id: request1.id,
      company: expect.objectContaining({
        orgId: companyAndAdmin1.company.orgId
      }),
      user: expect.objectContaining({ email: user0.email })
    });
  });
});

describe("getPendingBSDARevisionRequestsWithSubscribers", () => {
  afterEach(resetDatabase);

  it("should return empty array if DB is empty", async () => {
    // Given

    // When
    const pendingBSDARevisionRequest =
      await getPendingBSDARevisionRequestsWithSubscribers(2);

    // Then
    expect(pendingBSDARevisionRequest.length).toEqual(0);
  });

  it("should return pending request and subscribers to REVISION_REQUEST notifications", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(
      "ADMIN",
      {},
      {},
      { notificationIsActiveRevisionRequest: true }
    );
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      },
      transporterOpt: { transporterCompanySiret: companyOfSomeoneElse.siret }
    });

    const request = await prisma.bsdaRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    // When
    const pendingBSDARevisionRequest =
      await getPendingBSDARevisionRequestsWithSubscribers(2);

    // Then
    expect(pendingBSDARevisionRequest.length).toEqual(1);
    expect(pendingBSDARevisionRequest[0].id).toEqual(request.id);
    expect(
      (pendingBSDARevisionRequest[0] as BsdaRevisionRequest).bsdaId
    ).toEqual(bsda.id);
    expect(pendingBSDARevisionRequest[0].approvals.length).toEqual(1);
    expect(pendingBSDARevisionRequest[0].approvals[0].company.id).toEqual(
      company.id
    );
    expect(
      pendingBSDARevisionRequest[0].approvals[0].subscribers.length
    ).toEqual(1);
    expect(
      pendingBSDARevisionRequest[0].approvals[0].subscribers[0].id
    ).toEqual(user.id);
  });

  it("should not return pending request and subscribers NOT xDaysAgo", async () => {
    // Given
    const { company } = await userWithCompanyFactory("ADMIN");
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      },
      transporterOpt: { transporterCompanySiret: companyOfSomeoneElse.siret }
    });

    // Should not be returned because 3 days ago
    await prisma.bsdaRevisionRequest.create({
      data: {
        createdAt: THREE_DAYS_AGO,
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    const bsda2 = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      },
      transporterOpt: { transporterCompanySiret: companyOfSomeoneElse.siret }
    });

    // Should not be returned because 1 day ago
    await prisma.bsdaRevisionRequest.create({
      data: {
        createdAt: ONE_DAY_AGO,
        bsdaId: bsda2.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    // When
    const pendingBSDARevisionRequest =
      await getPendingBSDARevisionRequestsWithSubscribers(2);

    // Then
    expect(pendingBSDARevisionRequest.length).toEqual(0);
  });

  it("should not return non-pending requests", async () => {
    // Given
    const { company } = await userWithCompanyFactory("ADMIN");
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      },
      transporterOpt: { transporterCompanySiret: companyOfSomeoneElse.siret }
    });

    // Should not be returned because not pending
    await prisma.bsdaRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        status: "ACCEPTED"
      }
    });

    // When
    const pendingBSDARevisionRequest =
      await getPendingBSDARevisionRequestsWithSubscribers(2);

    // Then
    expect(pendingBSDARevisionRequest.length).toEqual(0);
  });

  it("should return multiple pending request and company admins", async () => {
    // Given

    // Request 1
    const { user, company } = await userWithCompanyFactory(
      "ADMIN",
      {},
      {},
      { notificationIsActiveRevisionRequest: true }
    );
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      },
      transporterOpt: { transporterCompanySiret: companyOfSomeoneElse.siret }
    });

    const request = await prisma.bsdaRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    // Request 2
    const { user: user2, company: company2 } = await userWithCompanyFactory(
      "ADMIN",
      {},
      {},
      { notificationIsActiveRevisionRequest: true }
    );
    const { company: companyOfSomeoneElse2 } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsda2 = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      },
      transporterOpt: { transporterCompanySiret: companyOfSomeoneElse.siret }
    });

    const request2 = await prisma.bsdaRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsdaId: bsda2.id,
        authoringCompanyId: companyOfSomeoneElse2.id,
        approvals: { create: { approverSiret: company2.siret! } },
        comment: ""
      }
    });

    // When
    const pendingBSDARevisionRequest =
      await getPendingBSDARevisionRequestsWithSubscribers(2);

    // Then
    expect(pendingBSDARevisionRequest.length).toEqual(2);

    expect(pendingBSDARevisionRequest[0].id).toEqual(request.id);
    expect(
      (pendingBSDARevisionRequest[0] as BsdaRevisionRequest).bsdaId
    ).toEqual(bsda.id);
    expect(pendingBSDARevisionRequest[0].approvals.length).toEqual(1);
    expect(
      pendingBSDARevisionRequest[0].approvals[0].subscribers.length
    ).toEqual(1);
    expect(
      pendingBSDARevisionRequest[0].approvals[0].subscribers[0].id
    ).toEqual(user.id);
    expect(pendingBSDARevisionRequest[0].approvals[0].company.id).toEqual(
      company.id
    );

    expect(pendingBSDARevisionRequest[1].id).toEqual(request2.id);
    expect(
      (pendingBSDARevisionRequest[1] as BsdaRevisionRequest).bsdaId
    ).toEqual(bsda2.id);
    expect(pendingBSDARevisionRequest[1].approvals.length).toEqual(1);
    expect(
      pendingBSDARevisionRequest[1].approvals[0].subscribers.length
    ).toEqual(1);
    expect(
      pendingBSDARevisionRequest[1].approvals[0].subscribers[0].id
    ).toEqual(user2.id);
    expect(pendingBSDARevisionRequest[1].approvals[0].company.id).toEqual(
      company2.id
    );
  });

  it("should return all subscribers from pending companies", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(
      "ADMIN",
      {},
      {},
      { notificationIsActiveRevisionRequest: true }
    );
    const user2 = await userFactory();
    await associateUserToCompany(user2.id, company.orgId, "ADMIN", {
      notificationIsActiveRevisionRequest: true
    });

    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      },
      transporterOpt: { transporterCompanySiret: companyOfSomeoneElse.siret }
    });

    const request = await prisma.bsdaRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    // When
    const pendingBSDARevisionRequest =
      await getPendingBSDARevisionRequestsWithSubscribers(2);

    // Then
    expect(pendingBSDARevisionRequest.length).toEqual(1);
    expect(pendingBSDARevisionRequest[0].approvals.length).toEqual(1);
    expect(pendingBSDARevisionRequest[0].id).toEqual(request.id);
    expect(
      (pendingBSDARevisionRequest[0] as BsdaRevisionRequest).bsdaId
    ).toEqual(bsda.id);
    expect(pendingBSDARevisionRequest[0].approvals[0].company.id).toEqual(
      company.id
    );
    expect(
      pendingBSDARevisionRequest[0].approvals[0].subscribers.length
    ).toEqual(2);

    const adminIds = pendingBSDARevisionRequest[0].approvals[0].subscribers.map(
      a => a.id
    );
    expect(adminIds.includes(user.id)).toBe(true);
    expect(adminIds.includes(user2.id)).toBe(true);
  });

  it("should not return non subscribers from pending companies", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const user2 = await userFactory();
    await associateUserToCompany(user2.id, company.orgId, "ADMIN", {
      notificationIsActiveRevisionRequest: false
    });
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret
      },
      transporterOpt: { transporterCompanySiret: companyOfSomeoneElse.siret }
    });

    const request = await prisma.bsdaRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    // When
    const pendingBSDARevisionRequest =
      await getPendingBSDARevisionRequestsWithSubscribers(2);

    // Then
    expect(pendingBSDARevisionRequest.length).toEqual(1);
    expect(pendingBSDARevisionRequest[0].id).toEqual(request.id);
    expect(
      (pendingBSDARevisionRequest[0] as BsdaRevisionRequest).bsdaId
    ).toEqual(bsda.id);
    expect(pendingBSDARevisionRequest[0].approvals.length).toEqual(1);
    expect(pendingBSDARevisionRequest[0].approvals[0].company.id).toEqual(
      company.id
    );
    expect(
      pendingBSDARevisionRequest[0].approvals[0].subscribers.length
    ).toEqual(1);
    expect(
      pendingBSDARevisionRequest[0].approvals[0].subscribers[0].id
    ).toEqual(user.id);
  });
});

describe("getPendingBSDDRevisionRequestsWithSubscribers", () => {
  afterEach(resetDatabase);

  it("should return empty array if DB is empty", async () => {
    // Given

    // When
    const pendingBSDRevisionRequest =
      await getPendingBSDDRevisionRequestsWithSubscribers(2);

    // Then
    expect(pendingBSDRevisionRequest.length).toEqual(0);
  });

  it("should return pending request and company subscribers to REVISION_REQUEST notification", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(
      "ADMIN",
      {},
      {},
      { notificationIsActiveRevisionRequest: true }
    );
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const request = await prisma.bsddRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    // When
    const pendingBSDRevisionRequest =
      await getPendingBSDDRevisionRequestsWithSubscribers(2);

    // Then
    expect(pendingBSDRevisionRequest.length).toEqual(1);
    expect(pendingBSDRevisionRequest[0].id).toEqual(request.id);
    expect(
      (pendingBSDRevisionRequest[0] as BsddRevisionRequestWithReadableId).bsdd
        .readableId
    ).toEqual(bsdd.readableId);
    expect(pendingBSDRevisionRequest[0].approvals.length).toEqual(1);
    expect(
      pendingBSDRevisionRequest[0].approvals[0].subscribers.length
    ).toEqual(1);
    expect(pendingBSDRevisionRequest[0].approvals[0].subscribers[0].id).toEqual(
      user.id
    );
    expect(pendingBSDRevisionRequest[0].approvals[0].company.id).toEqual(
      company.id
    );
  });

  it("should not return pending request and subscribers NOT xDaysAgo", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    // Should not be returned because 3 days ago
    await prisma.bsddRevisionRequest.create({
      data: {
        createdAt: THREE_DAYS_AGO,
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    const bsdd2 = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    // Should not be returned because 1 day ago
    await prisma.bsddRevisionRequest.create({
      data: {
        createdAt: ONE_DAY_AGO,
        bsddId: bsdd2.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    // When
    const pendingBSDRevisionRequest =
      await getPendingBSDDRevisionRequestsWithSubscribers(2);

    // Then
    expect(pendingBSDRevisionRequest.length).toEqual(0);
  });

  it("should not return non-pending requests", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    // Should not be returned because not pending
    await prisma.bsddRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        status: "ACCEPTED"
      }
    });

    // When
    const pendingBSDRevisionRequest =
      await getPendingBSDDRevisionRequestsWithSubscribers(2);

    // Then
    expect(pendingBSDRevisionRequest.length).toEqual(0);
  });

  it("should return multiple pending request and subsrribers", async () => {
    // Given

    // Request 1
    const { user, company } = await userWithCompanyFactory(
      "ADMIN",
      {},
      {},
      { notificationIsActiveRevisionRequest: true }
    );
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const request = await prisma.bsddRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    // Request 2
    const { user: user2, company: company2 } = await userWithCompanyFactory(
      "ADMIN",
      {},
      {},
      { notificationIsActiveRevisionRequest: true }
    );
    const { company: companyOfSomeoneElse2 } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsdd2 = await formFactory({
      ownerId: user2.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse2.siret }
    });

    const request2 = await prisma.bsddRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsddId: bsdd2.id,
        authoringCompanyId: companyOfSomeoneElse2.id,
        approvals: { create: { approverSiret: company2.siret! } },
        comment: ""
      }
    });

    // When
    const pendingBSDRevisionRequest =
      await getPendingBSDDRevisionRequestsWithSubscribers(2);

    // Then
    expect(pendingBSDRevisionRequest.length).toEqual(2);

    expect(pendingBSDRevisionRequest[0].id).toEqual(request.id);
    expect(
      (pendingBSDRevisionRequest[0] as BsddRevisionRequestWithReadableId).bsdd
        .readableId
    ).toEqual(bsdd.readableId);
    expect(pendingBSDRevisionRequest[0].approvals.length).toEqual(1);
    expect(
      pendingBSDRevisionRequest[0].approvals[0].subscribers.length
    ).toEqual(1);
    expect(pendingBSDRevisionRequest[0].approvals[0].subscribers[0].id).toEqual(
      user.id
    );
    expect(pendingBSDRevisionRequest[0].approvals[0].company.id).toEqual(
      company.id
    );

    expect(pendingBSDRevisionRequest[1].id).toEqual(request2.id);
    expect(
      (pendingBSDRevisionRequest[1] as BsddRevisionRequestWithReadableId).bsdd
        .readableId
    ).toEqual(bsdd2.readableId);
    expect(pendingBSDRevisionRequest[1].approvals.length).toEqual(1);
    expect(
      pendingBSDRevisionRequest[1].approvals[0].subscribers.length
    ).toEqual(1);
    expect(pendingBSDRevisionRequest[1].approvals[0].subscribers[0].id).toEqual(
      user2.id
    );
    expect(pendingBSDRevisionRequest[1].approvals[0].company.id).toEqual(
      company2.id
    );
  });

  it("should return all subscribers from pending companies", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory(
      "ADMIN",
      {},
      {},
      { notificationIsActiveRevisionRequest: true }
    );
    const user2 = await userFactory();
    await associateUserToCompany(user2.id, company.orgId, "ADMIN", {
      notificationIsActiveRevisionRequest: true
    });
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const request = await prisma.bsddRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    // When
    const pendingBSDRevisionRequest =
      await getPendingBSDDRevisionRequestsWithSubscribers(2);

    // Then
    expect(pendingBSDRevisionRequest.length).toEqual(1);
    expect(pendingBSDRevisionRequest[0].id).toEqual(request.id);
    expect(
      (pendingBSDRevisionRequest[0] as BsddRevisionRequestWithReadableId).bsdd
        .readableId
    ).toEqual(bsdd.readableId);
    expect(pendingBSDRevisionRequest[0].approvals.length).toEqual(1);
    expect(pendingBSDRevisionRequest[0].approvals[0].company.id).toEqual(
      company.id
    );
    expect(
      pendingBSDRevisionRequest[0].approvals[0].subscribers.length
    ).toEqual(2);

    const adminIds = pendingBSDRevisionRequest[0].approvals[0].subscribers.map(
      a => a.id
    );
    expect(adminIds.includes(user.id)).toBe(true);
    expect(adminIds.includes(user2.id)).toBe(true);
  });

  it("should not return non-subscribers from pending companies", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const user2 = await userFactory();
    await associateUserToCompany(user2.id, company.orgId, "ADMIN", {
      notificationIsActiveRevisionRequest: false
    });
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const request = await prisma.bsddRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    // When
    const pendingBSDRevisionRequest =
      await getPendingBSDDRevisionRequestsWithSubscribers(2);

    // Then
    expect(pendingBSDRevisionRequest.length).toEqual(1);
    expect(pendingBSDRevisionRequest[0].id).toEqual(request.id);
    expect(
      (pendingBSDRevisionRequest[0] as BsddRevisionRequestWithReadableId).bsdd
        .readableId
    ).toEqual(bsdd.readableId);
    expect(pendingBSDRevisionRequest[0].approvals.length).toEqual(1);
    expect(pendingBSDRevisionRequest[0].approvals[0].company.id).toEqual(
      company.id
    );
    expect(
      pendingBSDRevisionRequest[0].approvals[0].subscribers.length
    ).toEqual(1);
    expect(pendingBSDRevisionRequest[0].approvals[0].subscribers[0].id).toEqual(
      user.id
    );
  });
});

describe("getPendingBSDARIRevisionRequestsWithSubscribers", () => {
  afterEach(resetDatabase);

  it("should return empty array if DB is empty", async () => {
    const pendingBSDASRIRevisionRequest =
      await getPendingBSDASRIRevisionRequestsWithSubscribers(2);

    expect(pendingBSDASRIRevisionRequest.length).toEqual(0);
  });

  it("should return pending request and company subscribers to notification REVISION_REQUEST", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        transporterCompanySiret: companyOfSomeoneElse.siret
      }
    });

    const request = await prisma.bsdasriRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsdasriId: bsdasri.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    const pendingBSDARIRevisionRequest =
      await getPendingBSDASRIRevisionRequestsWithSubscribers(2);

    expect(pendingBSDARIRevisionRequest.length).toEqual(1);
    expect(pendingBSDARIRevisionRequest[0].id).toEqual(request.id);
    expect(
      (pendingBSDARIRevisionRequest[0] as BsdasriRevisionRequest).bsdasriId
    ).toEqual(bsdasri.id);
    expect(pendingBSDARIRevisionRequest[0].approvals.length).toEqual(1);
    expect(pendingBSDARIRevisionRequest[0].approvals[0].company.id).toEqual(
      company.id
    );
    expect(
      pendingBSDARIRevisionRequest[0].approvals[0].subscribers.length
    ).toEqual(1);
    expect(
      pendingBSDARIRevisionRequest[0].approvals[0].subscribers[0].id
    ).toEqual(user.id);
  });

  it("should not return pending request and company subscribers NOT xDaysAgo", async () => {
    const { company } = await userWithCompanyFactory("ADMIN");
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        transporterCompanySiret: companyOfSomeoneElse.siret
      }
    });

    // Should not be returned because 3 days ago
    await prisma.bsdasriRevisionRequest.create({
      data: {
        createdAt: THREE_DAYS_AGO,
        bsdasriId: bsdasri.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    const bsdasri2 = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        transporterCompanySiret: companyOfSomeoneElse.siret
      }
    });

    // Should not be returned because 1 day ago
    await prisma.bsdasriRevisionRequest.create({
      data: {
        createdAt: ONE_DAY_AGO,
        bsdasriId: bsdasri2.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    const pendingBSDASRIRevisionRequest =
      await getPendingBSDASRIRevisionRequestsWithSubscribers(2);

    expect(pendingBSDASRIRevisionRequest.length).toEqual(0);
  });

  it("should not return non-pending requests", async () => {
    const { company } = await userWithCompanyFactory("ADMIN");
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        transporterCompanySiret: companyOfSomeoneElse.siret
      }
    });

    // Should not be returned because not pending
    await prisma.bsdasriRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsdasriId: bsdasri.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        status: "ACCEPTED"
      }
    });

    const pendingBSDASRIRevisionRequest =
      await getPendingBSDASRIRevisionRequestsWithSubscribers(2);

    expect(pendingBSDASRIRevisionRequest.length).toEqual(0);
  });

  it("should return multiple pending request and company subscribers", async () => {
    // Request 1
    const { user, company } = await userWithCompanyFactory(
      "ADMIN",
      {},
      {},
      { notificationIsActiveRevisionRequest: true }
    );
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        transporterCompanySiret: companyOfSomeoneElse.siret
      }
    });

    const request = await prisma.bsdasriRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsdasriId: bsdasri.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    // Request 2
    const { user: user2, company: company2 } = await userWithCompanyFactory(
      "ADMIN",
      {},
      {},
      { notificationIsActiveRevisionRequest: true }
    );
    const { company: companyOfSomeoneElse2 } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsdasri2 = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        transporterCompanySiret: companyOfSomeoneElse.siret
      }
    });

    const request2 = await prisma.bsdasriRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsdasriId: bsdasri2.id,
        authoringCompanyId: companyOfSomeoneElse2.id,
        approvals: { create: { approverSiret: company2.siret! } },
        comment: ""
      }
    });

    const pendingBSDASRIRevisionRequest =
      await getPendingBSDASRIRevisionRequestsWithSubscribers(2);

    expect(pendingBSDASRIRevisionRequest.length).toEqual(2);

    expect(pendingBSDASRIRevisionRequest[0].id).toEqual(request.id);
    expect(
      (pendingBSDASRIRevisionRequest[0] as BsdasriRevisionRequest).bsdasriId
    ).toEqual(bsdasri.id);
    expect(pendingBSDASRIRevisionRequest[0].approvals.length).toEqual(1);
    expect(
      pendingBSDASRIRevisionRequest[0].approvals[0].subscribers.length
    ).toEqual(1);
    expect(
      pendingBSDASRIRevisionRequest[0].approvals[0].subscribers[0].id
    ).toEqual(user.id);
    expect(pendingBSDASRIRevisionRequest[0].approvals[0].company.id).toEqual(
      company.id
    );

    expect(pendingBSDASRIRevisionRequest[1].id).toEqual(request2.id);
    expect(
      (pendingBSDASRIRevisionRequest[1] as BsdasriRevisionRequest).bsdasriId
    ).toEqual(bsdasri2.id);
    expect(pendingBSDASRIRevisionRequest[1].approvals.length).toEqual(1);
    expect(
      pendingBSDASRIRevisionRequest[1].approvals[0].subscribers.length
    ).toEqual(1);
    expect(
      pendingBSDASRIRevisionRequest[1].approvals[0].subscribers[0].id
    ).toEqual(user2.id);
    expect(pendingBSDASRIRevisionRequest[1].approvals[0].company.id).toEqual(
      company2.id
    );
  });

  it("should return all subscribers from pending companies", async () => {
    const { user, company } = await userWithCompanyFactory(
      "ADMIN",
      {},
      {},
      { notificationIsActiveRevisionRequest: true }
    );
    const user2 = await userFactory();
    await associateUserToCompany(user2.id, company.orgId, "ADMIN", {
      notificationIsActiveRevisionRequest: true
    });
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        transporterCompanySiret: companyOfSomeoneElse.siret
      }
    });

    const request = await prisma.bsdasriRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsdasriId: bsdasri.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    const pendingBSDASRIevisionRequest =
      await getPendingBSDASRIRevisionRequestsWithSubscribers(2);

    expect(pendingBSDASRIevisionRequest.length).toEqual(1);
    expect(pendingBSDASRIevisionRequest[0].approvals.length).toEqual(1);
    expect(pendingBSDASRIevisionRequest[0].id).toEqual(request.id);
    expect(
      (pendingBSDASRIevisionRequest[0] as BsdasriRevisionRequest).bsdasriId
    ).toEqual(bsdasri.id);
    expect(pendingBSDASRIevisionRequest[0].approvals[0].company.id).toEqual(
      company.id
    );
    expect(
      pendingBSDASRIevisionRequest[0].approvals[0].subscribers.length
    ).toEqual(2);

    const adminIds =
      pendingBSDASRIevisionRequest[0].approvals[0].subscribers.map(a => a.id);
    expect(adminIds.includes(user.id)).toBe(true);
    expect(adminIds.includes(user2.id)).toBe(true);
  });

  it("should not return non-subscribers from pending companies", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const user2 = await userFactory();
    await associateUserToCompany(user2.id, company.orgId, "ADMIN", {
      notificationIsActiveRevisionRequest: false
    });
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret,
        transporterCompanySiret: companyOfSomeoneElse.siret
      }
    });

    const request = await prisma.bsdasriRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsdasriId: bsdasri.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    const pendingBSDASRIRevisionRequest =
      await getPendingBSDASRIRevisionRequestsWithSubscribers(2);

    expect(pendingBSDASRIRevisionRequest.length).toEqual(1);
    expect(pendingBSDASRIRevisionRequest[0].id).toEqual(request.id);
    expect(
      (pendingBSDASRIRevisionRequest[0] as BsdasriRevisionRequest).bsdasriId
    ).toEqual(bsdasri.id);
    expect(pendingBSDASRIRevisionRequest[0].approvals.length).toEqual(1);
    expect(pendingBSDASRIRevisionRequest[0].approvals[0].company.id).toEqual(
      company.id
    );
    expect(
      pendingBSDASRIRevisionRequest[0].approvals[0].subscribers.length
    ).toEqual(1);
    expect(
      pendingBSDASRIRevisionRequest[0].approvals[0].subscribers[0].id
    ).toEqual(user.id);
  });
});

describe("getRecentlyRegisteredProfesionals", () => {
  afterEach(resetDatabase);

  it("should return users who created companies who got verified x days ago", async () => {
    // Given

    // Should be returned
    const company0AndAdmin0 = await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: THREE_DAYS_AGO,
        verifiedAt: TWO_DAYS_AGO,
        companyTypes: ["COLLECTOR"]
      },
      {},
      { createdAt: THREE_DAYS_AGO } as any
    );
    const admin0 = company0AndAdmin0.user;

    // Should not be returned because company got verified 3 days ago
    await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: THREE_DAYS_AGO,
        verifiedAt: THREE_DAYS_AGO,
        companyTypes: ["COLLECTOR"]
      },
      {},
      { createdAt: THREE_DAYS_AGO } as any
    );

    // Should not be returned because company got verified 1 day ago
    await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: THREE_DAYS_AGO,
        verifiedAt: ONE_DAY_AGO,
        companyTypes: ["COLLECTOR"]
      },
      {},
      { createdAt: THREE_DAYS_AGO } as any
    );

    // Should not be returned because is company creator and company got verified 1 day ago
    await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: TWO_DAYS_AGO,
        verifiedAt: ONE_DAY_AGO,
        companyTypes: ["COLLECTOR"]
      },
      {},
      { createdAt: TWO_DAYS_AGO } as any
    );

    // When
    const profesionnals = await getRecentlyRegisteredProfesionals(2);

    // Then
    const expectedResult = [
      {
        id: admin0.id,
        name: admin0.name,
        email: admin0.email
      }
    ];

    const actualResult = profesionnals.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email
    }));

    expect(actualResult).toEqual(expectedResult);
  });

  it("should not return duplicates", async () => {
    // Given

    // Should be returned
    const company0 = await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: THREE_DAYS_AGO,
        verifiedAt: TWO_DAYS_AGO,
        companyTypes: ["COLLECTOR"]
      },
      {},
      { createdAt: THREE_DAYS_AGO } as any
    );
    const admin0 = company0.user;

    // Should be returned
    const company1 = await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: THREE_DAYS_AGO,
        verifiedAt: TWO_DAYS_AGO,
        companyTypes: ["COLLECTOR"]
      },
      {},
      { createdAt: THREE_DAYS_AGO } as any
    );
    const admin1 = company1.user;

    // Admin0 is in 2 elligible companies, but should be returned only once
    await associateUserToCompany(admin0.id, company1.company.orgId, "MEMBER", {
      createdAt: TWO_DAYS_AGO
    } as any);

    // When
    const profesionnals = await getRecentlyRegisteredProfesionals(2);

    // Then
    const expectedResult = [
      {
        id: admin0.id,
        name: admin0.name,
        email: admin0.email
      },
      {
        id: admin1.id,
        name: admin1.name,
        email: admin1.email
      }
    ].sort((a, b) => a.id.localeCompare(b.id));

    const actualResult = profesionnals
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    expect(actualResult).toEqual(expectedResult);
  });

  it("should not return users who created companies which didn't get verified", async () => {
    // Given

    // Should not be returned
    await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: THREE_DAYS_AGO,
        companyTypes: ["COLLECTOR"]
      },
      {},
      { createdAt: THREE_DAYS_AGO } as any
    );

    // Should not be returned
    await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: TWO_DAYS_AGO,
        companyTypes: ["COLLECTOR"]
      },
      {},
      { createdAt: TWO_DAYS_AGO } as any
    );

    // When
    const profesionnals = await getRecentlyRegisteredProfesionals(2);

    // Then
    expect(profesionnals).toEqual([]);
  });

  it("should return users who recently joined professional company (previously verified)", async () => {
    // Given

    // Should be returned
    const company0AndAdmin0 = await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: FOUR_DAYS_AGO,
        verifiedAt: FOUR_DAYS_AGO,
        companyTypes: ["COLLECTOR"]
      },
      {},
      { createdAt: FOUR_DAYS_AGO } as any
    );

    // Should be returned
    const company0user1 = await userFactory();
    await associateUserToCompany(
      company0user1.id,
      company0AndAdmin0.company.orgId,
      "MEMBER",
      {
        createdAt: TWO_DAYS_AGO
      } as any
    );

    // Should not be returned cause joined 3 days ago
    const company0user2 = await userFactory();
    await associateUserToCompany(
      company0user2.id,
      company0AndAdmin0.company.orgId,
      "MEMBER",
      {
        createdAt: THREE_DAYS_AGO
      } as any
    );

    // Should not be returned cause joined 1 day ago
    const company0user3 = await userFactory();
    await associateUserToCompany(
      company0user3.id,
      company0AndAdmin0.company.orgId,
      "MEMBER",
      {
        createdAt: ONE_DAY_AGO
      } as any
    );

    // When
    const profesionnals = await getRecentlyRegisteredProfesionals(2);

    // Then
    expect(profesionnals).toEqual([
      {
        id: company0user1.id,
        name: company0user1.name,
        email: company0user1.email
      }
    ]);
  });

  it("edge-case: company created, verified & association on the same day", async () => {
    // Given

    // Should be returned
    const company0AndAdmin0 = await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: TWO_DAYS_AGO,
        verifiedAt: TWO_DAYS_AGO,
        companyTypes: ["COLLECTOR"]
      },
      {},
      { createdAt: TWO_DAYS_AGO } as any
    );
    const admin0 = company0AndAdmin0.user;

    // Should be returned
    const company0user1 = await userFactory();
    await associateUserToCompany(
      company0user1.id,
      company0AndAdmin0.company.orgId,
      "MEMBER",
      {
        createdAt: TWO_DAYS_AGO
      } as any
    );

    // When
    const profesionnals = await getRecentlyRegisteredProfesionals(2);

    // Then
    const expectedResult = [
      {
        id: admin0.id,
        name: admin0.name,
        email: admin0.email
      },
      {
        id: company0user1.id,
        name: company0user1.name,
        email: company0user1.email
      }
    ].sort((a, b) => a.id.localeCompare(b.id));
    const actualResult = profesionnals.sort((a, b) => a.id.localeCompare(b.id));

    expect(actualResult).toEqual(expectedResult);
  });

  it("should not return users who recently joined non-professional company", async () => {
    // Given

    // Should not be returned because non-profesional
    const company0AndAdmin0 = await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: FOUR_DAYS_AGO,
        verifiedAt: FOUR_DAYS_AGO,
        companyTypes: ["PRODUCER"]
      },
      {},
      { createdAt: FOUR_DAYS_AGO } as any
    );

    // Should not be returned because non-profesional
    const company0user1 = await userFactory();
    await associateUserToCompany(
      company0user1.id,
      company0AndAdmin0.company.orgId,
      "MEMBER",
      {
        createdAt: TWO_DAYS_AGO
      } as any
    );

    // When
    const profesionnals = await getRecentlyRegisteredProfesionals(2);

    // Then
    expect(profesionnals).toEqual([]);
  });

  it("should not return creators from non-professional companies", async () => {
    // Given

    // Should not be returned because not professional
    await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: THREE_DAYS_AGO,
        verifiedAt: TWO_DAYS_AGO,
        companyTypes: ["PRODUCER"]
      },
      {},
      { createdAt: THREE_DAYS_AGO } as any
    );

    // When
    const profesionnals = await getRecentlyRegisteredProfesionals(2);

    // Then
    expect(profesionnals).toEqual([]);
  });

  it("should not return users from non-professional companies", async () => {
    // Given

    // Should not be returned because not professional
    const company0AndAdmin0 = await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: FOUR_DAYS_AGO,
        verifiedAt: FOUR_DAYS_AGO,
        companyTypes: ["PRODUCER"]
      },
      {},
      { createdAt: FOUR_DAYS_AGO } as any
    );

    // Should not be returned because belongs to non-profesional company
    const company0user1 = await userFactory();
    await associateUserToCompany(
      company0user1.id,
      company0AndAdmin0.company.orgId,
      "MEMBER",
      {
        createdAt: TWO_DAYS_AGO
      } as any
    );

    // When
    const profesionnals = await getRecentlyRegisteredProfesionals(2);

    // Then
    expect(profesionnals).toEqual([]);
  });
});

describe("getRecentlyRegisteredProducers", () => {
  afterEach(resetDatabase);

  it("should return users who recently joined non-profesional companies", async () => {
    // Given

    // Should be returned
    const company0AndAdmin0 = await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: FOUR_DAYS_AGO,
        companyTypes: ["PRODUCER"]
      },
      {},
      { createdAt: TWO_DAYS_AGO } as any
    );

    // Should be returned
    const company0user1 = await userFactory();
    await associateUserToCompany(
      company0user1.id,
      company0AndAdmin0.company.orgId,
      "MEMBER",
      {
        createdAt: TWO_DAYS_AGO
      } as any
    );

    // Should not be returned because three days ago
    const company1AndAdmin0 = await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: FOUR_DAYS_AGO,
        companyTypes: ["PRODUCER"]
      },
      {},
      { createdAt: THREE_DAYS_AGO } as any
    );

    // Should not be returned because one day ago
    const company1user1 = await userFactory();
    await associateUserToCompany(
      company1user1.id,
      company1AndAdmin0.company.orgId,
      "MEMBER",
      {
        createdAt: ONE_DAY_AGO
      } as any
    );

    // When
    const profesionnals = await getRecentlyRegisteredProducers(2);

    // Then
    const expectedResult = [
      {
        id: company0AndAdmin0.user.id,
        name: company0AndAdmin0.user.name,
        email: company0AndAdmin0.user.email
      },
      {
        id: company0user1.id,
        name: company0user1.name,
        email: company0user1.email
      }
    ].sort((a, b) => a.id.localeCompare(b.id));

    const actualResult = profesionnals
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    expect(actualResult).toEqual(expectedResult);
  });

  it("should not return duplicates", async () => {
    // Given

    // Should be returned
    const company0AndAdmin0 = await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: FOUR_DAYS_AGO,
        companyTypes: ["PRODUCER"]
      },
      {},
      { createdAt: TWO_DAYS_AGO } as any
    );
    const admin0 = company0AndAdmin0.user;

    // Should be returned
    const company1AndAdmin1 = await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: FOUR_DAYS_AGO,
        companyTypes: ["PRODUCER"]
      },
      {},
      { createdAt: TWO_DAYS_AGO } as any
    );
    const admin1 = company1AndAdmin1.user;

    // Should not be returned twice!
    await associateUserToCompany(
      admin0.id,
      company1AndAdmin1.company.orgId,
      "MEMBER",
      {
        createdAt: TWO_DAYS_AGO
      } as any
    );

    // When
    const profesionnals = await getRecentlyRegisteredProducers(2);

    // Then
    const expectedResult = [
      {
        id: admin0.id,
        name: admin0.name,
        email: admin0.email
      },
      {
        id: admin1.id,
        name: admin1.name,
        email: admin1.email
      }
    ].sort((a, b) => a.id.localeCompare(b.id));

    const actualResult = profesionnals
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    expect(actualResult).toEqual(expectedResult);
  });

  it("should not return users from profesional companies", async () => {
    // Given

    // Should not be returned
    const company0AndAdmin0 = await userWithCompanyFactory(
      "ADMIN",
      {
        createdAt: FOUR_DAYS_AGO,
        companyTypes: ["COLLECTOR"]
      },
      {},
      { createdAt: TWO_DAYS_AGO } as any
    );

    // Should not be returned
    const company0user1 = await userFactory();
    await associateUserToCompany(
      company0user1.id,
      company0AndAdmin0.company.orgId,
      "MEMBER",
      {
        createdAt: TWO_DAYS_AGO
      } as any
    );

    // When
    const profesionnals = await getRecentlyRegisteredProducers(2);

    // Then
    expect(profesionnals).toEqual([]);
  });
});

describe("addPendingApprovalsCompanyAdmins", () => {
  afterEach(resetDatabase);

  it("BUG - should not crash if company has been deleted", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const user2 = await userFactory();
    await associateUserToCompany(user2.id, company.orgId, "MEMBER");
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const request = await prisma.bsddRevisionRequest.create({
      data: {
        createdAt: TWO_DAYS_AGO,
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    // Then DELETE company
    const { mutate } = makeClient(user);
    await mutate<Pick<Mutation, "deleteCompany">, MutationDeleteCompanyArgs>(
      DELETE_COMPANY,
      {
        variables: { id: company.id }
      }
    );

    // When
    const requestsWithApprovals = await prisma.bsddRevisionRequest.findMany({
      where: {
        createdAt: { gte: THREE_DAYS_AGO, lt: ONE_DAY_AGO },
        status: "PENDING"
      },
      include: { approvals: true, bsdd: { select: { readableId: true } } }
    });

    const wrappedRequests = await addPendingApprovalsCompanySubscribers(
      requestsWithApprovals
    );

    // Then
    expect(requestsWithApprovals.length).toBe(1);
    expect(requestsWithApprovals[0].id).toBe(request.id);

    expect(wrappedRequests.length).toBe(1);
    expect(wrappedRequests[0].id).toBe(request.id);
    expect(wrappedRequests[0].approvals.length).toBe(0);
  });
});

describe("getExpiringRegistryDelegationWarningMailPayloads", () => {
  afterEach(resetDatabase);

  it("should return nothing if no expiring delegation", async () => {
    // Given

    // When
    const mails = await getExpiringRegistryDelegationWarningMailPayloads();

    // Then
    expect(mails.length).toBe(0);
  });

  it("should return a warning email to expired delegation's involved users", async () => {
    // Given
    const {
      delegation,
      delegatorUser,
      delegateUser,
      delegatorCompany,
      delegateCompany
    } = await registryDelegationFactory({
      startDate: YESTERDAY,
      endDate: NOW_PLUS_SEVEN_DAYS
    });

    // When
    const mails = await getExpiringRegistryDelegationWarningMailPayloads();

    // Then
    expect(mails.length).toBe(1);
    const sortFn = (a, b) => a.email.localeCompare(b.email);
    expect(mails[0].to?.sort(sortFn)).toMatchObject(
      [
        { email: delegatorUser.email, name: delegatorUser.name },
        { email: delegateUser.email, name: delegateUser.name }
      ].sort(sortFn)
    );
    expect(mails[0].subject).toBe(
      `Expiration prochaine de la délégation entre l'établissement ${delegatorCompany.orgId} et l'établissement ${delegateCompany.orgId}`
    );
    expect(mails[0].body).toBe(`<p>
  La plateforme Trackdéchets vous informe que la délégation accordée par
  l'établissement ${delegatorCompany.name} (${
      delegatorCompany.orgId
    }) à l'établissement
  ${delegateCompany.name} (${
      delegateCompany.orgId
    }), effective depuis le ${toddMMYYYY(delegation.startDate).replace(
      /\//g,
      "&#x2F;"
    )},
  arrivera à expiration dans 7 jours, soit le ${toddMMYYYY(
    delegation.endDate!
  ).replace(/\//g, "&#x2F;")}.
</p>

<p>
  Pour en savoir plus sur les délégations et découvrir comment prolonger cette
  période, nous vous invitons à consulter cet
  <a
    href="https://faq.trackdechets.fr/inscription-et-gestion-de-compte/gerer-son-compte/modifier-les-informations-de-son-compte#visualiser-lensemble-des-collaborateurs-ayant-acces-a-mon-etablissement"
  >
    article de notre FAQ </a
  >.
</p>
`);
  });

  it("should send a warning email to expired delegation's involved users - multiple delegations involved", async () => {
    // Given
    const {
      delegation: delegation1,
      delegatorUser: delegatorUser1,
      delegateUser: delegateUser1,
      delegatorCompany: delegatorCompany1,
      delegateCompany: delegateCompany1
    } = await registryDelegationFactory({
      startDate: YESTERDAY,
      endDate: NOW_PLUS_SEVEN_DAYS
    });

    const {
      delegation: delegation2,
      delegatorUser: delegatorUser2,
      delegateUser: delegateUser2,
      delegatorCompany: delegatorCompany2,
      delegateCompany: delegateCompany2
    } = await registryDelegationFactory({
      startDate: YESTERDAY,
      endDate: NOW_PLUS_SEVEN_DAYS
    });

    // When
    const mails = await getExpiringRegistryDelegationWarningMailPayloads();

    // Then
    expect(mails.length).toBe(2);
    const sortFn = (a, b) => a.email.localeCompare(b.email);

    // Mail 1
    expect(mails[0].to?.sort(sortFn)).toMatchObject(
      [
        { email: delegatorUser1.email, name: delegatorUser1.name },
        { email: delegateUser1.email, name: delegateUser1.name }
      ].sort(sortFn)
    );
    expect(mails[0].subject).toBe(
      `Expiration prochaine de la délégation entre l'établissement ${delegatorCompany1.orgId} et l'établissement ${delegateCompany1.orgId}`
    );
    expect(mails[0].body).toBe(`<p>
  La plateforme Trackdéchets vous informe que la délégation accordée par
  l'établissement ${delegatorCompany1.name} (${
      delegatorCompany1.orgId
    }) à l'établissement
  ${delegateCompany1.name} (${
      delegateCompany1.orgId
    }), effective depuis le ${toddMMYYYY(delegation1.startDate).replace(
      /\//g,
      "&#x2F;"
    )},
  arrivera à expiration dans 7 jours, soit le ${toddMMYYYY(
    delegation1.endDate!
  ).replace(/\//g, "&#x2F;")}.
</p>

<p>
  Pour en savoir plus sur les délégations et découvrir comment prolonger cette
  période, nous vous invitons à consulter cet
  <a
    href="https://faq.trackdechets.fr/inscription-et-gestion-de-compte/gerer-son-compte/modifier-les-informations-de-son-compte#visualiser-lensemble-des-collaborateurs-ayant-acces-a-mon-etablissement"
  >
    article de notre FAQ </a
  >.
</p>
`);

    // Mail 2
    expect(mails[1].to?.sort(sortFn)).toMatchObject(
      [
        { email: delegatorUser2.email, name: delegatorUser2.name },
        { email: delegateUser2.email, name: delegateUser2.name }
      ].sort(sortFn)
    );
    expect(mails[1].subject).toBe(
      `Expiration prochaine de la délégation entre l'établissement ${delegatorCompany2.orgId} et l'établissement ${delegateCompany2.orgId}`
    );
    expect(mails[1].body).toBe(`<p>
  La plateforme Trackdéchets vous informe que la délégation accordée par
  l'établissement ${delegatorCompany2.name} (${
      delegatorCompany2.orgId
    }) à l'établissement
  ${delegateCompany2.name} (${
      delegateCompany2.orgId
    }), effective depuis le ${toddMMYYYY(delegation2.startDate).replace(
      /\//g,
      "&#x2F;"
    )},
  arrivera à expiration dans 7 jours, soit le ${toddMMYYYY(
    delegation2.endDate!
  ).replace(/\//g, "&#x2F;")}.
</p>

<p>
  Pour en savoir plus sur les délégations et découvrir comment prolonger cette
  période, nous vous invitons à consulter cet
  <a
    href="https://faq.trackdechets.fr/inscription-et-gestion-de-compte/gerer-son-compte/modifier-les-informations-de-son-compte#visualiser-lensemble-des-collaborateurs-ayant-acces-a-mon-etablissement"
  >
    article de notre FAQ </a
  >.
</p>
`);
  });
});
