import {
  BsdaRevisionRequest,
  MembershipRequestStatus,
  UserRole
} from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import {
  addUserToCompany,
  companyAssociatedToExistingUserFactory,
  companyFactory,
  createMembershipRequest,
  formFactory,
  userFactory,
  userWithCompanyFactory
} from "../../__tests__/factories";
import {
  BsddRevisionRequestWithReadableId,
  getActiveUsersWithPendingMembershipRequests,
  getPendingBSDARevisionRequestsWithAdmins,
  getPendingBSDDRevisionRequestsWithAdmins,
  getPendingMembershipRequestsAndAssociatedAdmins,
  getRecentlyRegisteredUsersWithNoCompanyNorMembershipRequest,
  xDaysAgo
} from "../onboarding.helpers";
import prisma from "../../prisma";
import { bsdaFactory } from "../../bsda/__tests__/factories";

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
        approvals: { create: { approverSiret: company.siret } },
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
        approvals: { create: { approverSiret: company.siret } },
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
        approvals: { create: { approverSiret: company.siret } },
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
        approvals: { create: { approverSiret: company.siret } },
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
        approvals: { create: { approverSiret: company.siret } },
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
        approvals: { create: { approverSiret: company2.siret } },
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
    await addUserToCompany(user2, company, "ADMIN");
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
        approvals: { create: { approverSiret: company.siret } },
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
    await addUserToCompany(user2, company, "MEMBER");
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
        approvals: { create: { approverSiret: company.siret } },
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
        approvals: { create: { approverSiret: company.siret } },
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
        approvals: { create: { approverSiret: company.siret } },
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
        approvals: { create: { approverSiret: company.siret } },
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
        approvals: { create: { approverSiret: company.siret } },
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
        approvals: { create: { approverSiret: company.siret } },
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
        approvals: { create: { approverSiret: company2.siret } },
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
    await addUserToCompany(user2, company, "ADMIN");
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
        approvals: { create: { approverSiret: company.siret } },
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
    await addUserToCompany(user2, company, "MEMBER");
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
        approvals: { create: { approverSiret: company.siret } },
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

  // TODO: return only PENDING approvals
});
