import { MembershipRequestStatus, UserRole } from "@prisma/client";
import { resetDatabase } from "../../../integration-tests/helper";
import {
  companyAssociatedToExistingUserFactory,
  companyFactory,
  createMembershipRequest,
  userFactory
} from "../../__tests__/factories";
import {
  getActiveUsersWithPendingMembershipRequests,
  getRecentlyRegisteredUsersWithNoCompanyNorMembershipRequest,
  xDaysAgo
} from "../onboarding.helpers";

const TODAY = new Date();
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
