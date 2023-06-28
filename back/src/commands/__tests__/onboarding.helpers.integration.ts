import {
  BsdaRevisionRequest,
  MembershipRequestStatus,
  UserRole
} from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import {
  companyAssociatedToExistingUserFactory,
  companyFactory,
  createMembershipRequest,
  formFactory,
  userFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import {
  BsddRevisionRequestWithReadableId,
  addPendingApprovalsCompanyAdmins,
  getActiveUsersWithPendingMembershipRequests,
  getPendingBSDARevisionRequestsWithAdmins,
  getPendingBSDDRevisionRequestsWithAdmins,
  getPendingMembershipRequestsAndAssociatedAdmins,
  getRecentlyRegisteredProducers,
  getRecentlyRegisteredProfesionals,
  getRecentlyRegisteredUsersWithNoCompanyNorMembershipRequest,
  xDaysAgo
} from "../onboarding.helpers";
import prisma from "../../prisma";
import { bsdaFactory } from "../../bsda/__tests__/factories";
import { associateUserToCompany } from "../../users/database";
import {
  Mutation,
  MutationDeleteCompanyArgs
} from "../../generated/graphql/types";
import { DELETE_COMPANY } from "../../companies/resolvers/mutations/__tests__/deleteCompany.integration";
import makeClient from "../../__tests__/testClient";

const TODAY = new Date();
const ONE_DAY_AGO = xDaysAgo(TODAY, 1);
const TWO_DAYS_AGO = xDaysAgo(TODAY, 2);
const THREE_DAYS_AGO = xDaysAgo(TODAY, 3);
const FOUR_DAYS_AGO = xDaysAgo(TODAY, 4);

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

describe("getPendingMembershipRequestsAndAssociatedAdmins", () => {
  afterEach(resetDatabase);

  it("should return pending membership requests created X days ago with all associated company admins", async () => {
    const user0 = await userFactory();
    const user1 = await userFactory();
    const user2 = await userFactory();
    const user3 = await userFactory({ isActive: false });

    const companyAndAdmin0 = await userWithCompanyFactory("ADMIN");
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

    const requests = await getPendingMembershipRequestsAndAssociatedAdmins(3);

    expect(requests.length).toEqual(1);

    const expectedResult = [
      {
        requestId: request0.id,
        email: user0.email,
        orgId: companyAndAdmin0.company.orgId,
        adminIds: [companyAndAdmin0.user.id]
      }
    ];

    const actualResult = requests.map(r => ({
      requestId: r.id,
      email: r.user.email,
      orgId: r.company.orgId,
      adminIds: r.company.companyAssociations.map(a => a.user.id).sort()
    }));

    expect(expectedResult).toEqual(actualResult);
  });

  it("should return ALL active admins from request's company", async () => {
    const user0 = await userFactory();

    // Should be returned
    const companyAndAdmin0 = await userWithCompanyFactory("ADMIN");

    // Should be returned
    const admin1 = await userFactory({
      companyAssociations: {
        create: {
          company: { connect: { id: companyAndAdmin0.company.id } },
          role: "ADMIN"
        }
      }
    });

    // Should not be returned, because unactive
    await userFactory({
      isActive: false,
      companyAssociations: {
        create: {
          company: { connect: { id: companyAndAdmin0.company.id } },
          role: "ADMIN"
        }
      }
    });

    // Should be returned, along with both admins
    const request0 = await createMembershipRequest(
      user0,
      companyAndAdmin0.company,
      {
        createdAt: THREE_DAYS_AGO,
        status: MembershipRequestStatus.PENDING
      }
    );

    const requests = await getPendingMembershipRequestsAndAssociatedAdmins(3);

    expect(requests.length).toEqual(1);

    const expectedResult = [
      {
        requestId: request0.id,
        email: user0.email,
        orgId: companyAndAdmin0.company.orgId,
        adminIds: [companyAndAdmin0.user.id, admin1.id].sort()
      }
    ];

    const actualResult = requests.map(r => ({
      requestId: r.id,
      email: r.user.email,
      orgId: r.company.orgId,
      adminIds: r.company.companyAssociations.map(a => a.user.id).sort()
    }));

    expect(expectedResult).toEqual(actualResult);
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

    const requests = await getPendingMembershipRequestsAndAssociatedAdmins(3);

    expect(requests.length).toEqual(2);

    const expectedResult = [
      {
        requestId: request0.id,
        email: user0.email,
        orgId: companyAndAdmin0.company.orgId,
        adminIds: [companyAndAdmin0.user.id]
      },
      {
        requestId: request1.id,
        email: user0.email,
        orgId: companyAndAdmin1.company.orgId,
        adminIds: [companyAndAdmin1.user.id]
      }
    ].sort();

    const actualResult = requests
      .map(r => ({
        requestId: r.id,
        email: r.user.email,
        orgId: r.company.orgId,
        adminIds: r.company.companyAssociations.map(a => a.user.id).sort()
      }))
      .sort();

    expect(expectedResult).toEqual(actualResult);
  });
});

describe("getPendingBSDARevisionRequestsWithAdmins", () => {
  afterEach(resetDatabase);

  it("should return empty array if DB is empty", async () => {
    // Given

    // When
    const pendingBSDARevisionRequest =
      await getPendingBSDARevisionRequestsWithAdmins(2);

    // Then
    expect(pendingBSDARevisionRequest.length).toEqual(0);
  });

  it("should return pending request and company admins", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        transporterCompanySiret: companyOfSomeoneElse.siret
      }
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
      await getPendingBSDARevisionRequestsWithAdmins(2);

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
    expect(pendingBSDARevisionRequest[0].approvals[0].admins.length).toEqual(1);
    expect(pendingBSDARevisionRequest[0].approvals[0].admins[0].id).toEqual(
      user.id
    );
  });

  it("should not return pending request and company admins NOT xDaysAgo", async () => {
    // Given
    const { company } = await userWithCompanyFactory("ADMIN");
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        transporterCompanySiret: companyOfSomeoneElse.siret
      }
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
        emitterCompanySiret: company.siret,
        transporterCompanySiret: companyOfSomeoneElse.siret
      }
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
      await getPendingBSDARevisionRequestsWithAdmins(2);

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
        emitterCompanySiret: company.siret,
        transporterCompanySiret: companyOfSomeoneElse.siret
      }
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
      await getPendingBSDARevisionRequestsWithAdmins(2);

    // Then
    expect(pendingBSDARevisionRequest.length).toEqual(0);
  });

  it("should return multiple pending request and company admins", async () => {
    // Given

    // Request 1
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        transporterCompanySiret: companyOfSomeoneElse.siret
      }
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
      "ADMIN"
    );
    const { company: companyOfSomeoneElse2 } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsda2 = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        transporterCompanySiret: companyOfSomeoneElse.siret
      }
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
      await getPendingBSDARevisionRequestsWithAdmins(2);

    // Then
    expect(pendingBSDARevisionRequest.length).toEqual(2);

    expect(pendingBSDARevisionRequest[0].id).toEqual(request.id);
    expect(
      (pendingBSDARevisionRequest[0] as BsdaRevisionRequest).bsdaId
    ).toEqual(bsda.id);
    expect(pendingBSDARevisionRequest[0].approvals.length).toEqual(1);
    expect(pendingBSDARevisionRequest[0].approvals[0].admins.length).toEqual(1);
    expect(pendingBSDARevisionRequest[0].approvals[0].admins[0].id).toEqual(
      user.id
    );
    expect(pendingBSDARevisionRequest[0].approvals[0].company.id).toEqual(
      company.id
    );

    expect(pendingBSDARevisionRequest[1].id).toEqual(request2.id);
    expect(
      (pendingBSDARevisionRequest[1] as BsdaRevisionRequest).bsdaId
    ).toEqual(bsda2.id);
    expect(pendingBSDARevisionRequest[1].approvals.length).toEqual(1);
    expect(pendingBSDARevisionRequest[1].approvals[0].admins.length).toEqual(1);
    expect(pendingBSDARevisionRequest[1].approvals[0].admins[0].id).toEqual(
      user2.id
    );
    expect(pendingBSDARevisionRequest[1].approvals[0].company.id).toEqual(
      company2.id
    );
  });

  it("should return all admins from pending companies", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const user2 = await userFactory();
    await associateUserToCompany(user2.id, company.orgId, "ADMIN");
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        transporterCompanySiret: companyOfSomeoneElse.siret
      }
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
      await getPendingBSDARevisionRequestsWithAdmins(2);

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
    expect(pendingBSDARevisionRequest[0].approvals[0].admins.length).toEqual(2);

    const adminIds = pendingBSDARevisionRequest[0].approvals[0].admins.map(
      a => a.id
    );
    expect(adminIds.includes(user.id)).toBe(true);
    expect(adminIds.includes(user2.id)).toBe(true);
  });

  it("should not return non-admins from pending companies", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const user2 = await userFactory();
    await associateUserToCompany(user2.id, company.orgId, "MEMBER");
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: company.siret,
        transporterCompanySiret: companyOfSomeoneElse.siret
      }
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
      await getPendingBSDARevisionRequestsWithAdmins(2);

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
    expect(pendingBSDARevisionRequest[0].approvals[0].admins.length).toEqual(1);
    expect(pendingBSDARevisionRequest[0].approvals[0].admins[0].id).toEqual(
      user.id
    );
  });
});

describe("getPendingBSDDRevisionRequestsWithAdmins", () => {
  afterEach(resetDatabase);

  it("should return empty array if DB is empty", async () => {
    // Given

    // When
    const pendingBSDRevisionRequest =
      await getPendingBSDDRevisionRequestsWithAdmins(2);

    // Then
    expect(pendingBSDRevisionRequest.length).toEqual(0);
  });

  it("should return pending request and company admins", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN");
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
      await getPendingBSDDRevisionRequestsWithAdmins(2);

    // Then
    expect(pendingBSDRevisionRequest.length).toEqual(1);
    expect(pendingBSDRevisionRequest[0].id).toEqual(request.id);
    expect(
      (pendingBSDRevisionRequest[0] as BsddRevisionRequestWithReadableId).bsdd
        .readableId
    ).toEqual(bsdd.readableId);
    expect(pendingBSDRevisionRequest[0].approvals.length).toEqual(1);
    expect(pendingBSDRevisionRequest[0].approvals[0].admins.length).toEqual(1);
    expect(pendingBSDRevisionRequest[0].approvals[0].admins[0].id).toEqual(
      user.id
    );
    expect(pendingBSDRevisionRequest[0].approvals[0].company.id).toEqual(
      company.id
    );
  });

  it("should not return pending request and company admins NOT xDaysAgo", async () => {
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
      await getPendingBSDDRevisionRequestsWithAdmins(2);

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
      await getPendingBSDDRevisionRequestsWithAdmins(2);

    // Then
    expect(pendingBSDRevisionRequest.length).toEqual(0);
  });

  it("should return multiple pending request and company admins", async () => {
    // Given

    // Request 1
    const { user, company } = await userWithCompanyFactory("ADMIN");
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
      "ADMIN"
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
      await getPendingBSDDRevisionRequestsWithAdmins(2);

    // Then
    expect(pendingBSDRevisionRequest.length).toEqual(2);

    expect(pendingBSDRevisionRequest[0].id).toEqual(request.id);
    expect(
      (pendingBSDRevisionRequest[0] as BsddRevisionRequestWithReadableId).bsdd
        .readableId
    ).toEqual(bsdd.readableId);
    expect(pendingBSDRevisionRequest[0].approvals.length).toEqual(1);
    expect(pendingBSDRevisionRequest[0].approvals[0].admins.length).toEqual(1);
    expect(pendingBSDRevisionRequest[0].approvals[0].admins[0].id).toEqual(
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
    expect(pendingBSDRevisionRequest[1].approvals[0].admins.length).toEqual(1);
    expect(pendingBSDRevisionRequest[1].approvals[0].admins[0].id).toEqual(
      user2.id
    );
    expect(pendingBSDRevisionRequest[1].approvals[0].company.id).toEqual(
      company2.id
    );
  });

  it("should return all admins from pending companies", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const user2 = await userFactory();
    await associateUserToCompany(user2.id, company.orgId, "ADMIN");
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
      await getPendingBSDDRevisionRequestsWithAdmins(2);

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
    expect(pendingBSDRevisionRequest[0].approvals[0].admins.length).toEqual(2);

    const adminIds = pendingBSDRevisionRequest[0].approvals[0].admins.map(
      a => a.id
    );
    expect(adminIds.includes(user.id)).toBe(true);
    expect(adminIds.includes(user2.id)).toBe(true);
  });

  it("should not return non-admins from pending companies", async () => {
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

    // When
    const pendingBSDRevisionRequest =
      await getPendingBSDDRevisionRequestsWithAdmins(2);

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
    expect(pendingBSDRevisionRequest[0].approvals[0].admins.length).toEqual(1);
    expect(pendingBSDRevisionRequest[0].approvals[0].admins[0].id).toEqual(
      user.id
    );
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

    const wrappedRequests = await addPendingApprovalsCompanyAdmins(
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
