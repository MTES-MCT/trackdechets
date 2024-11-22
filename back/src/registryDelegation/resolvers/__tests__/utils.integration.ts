import { prisma } from "@td/prisma";
import { resetDatabase } from "../../../../integration-tests/helper";
import {
  userInCompany,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import { endOfDay, inXDays, todayAtMidnight, xDaysAgo } from "../../../utils";
import { registryDelegationFactory } from "../../__tests__/factories";
import {
  getDelegationNotifiableUsers,
  getRegistryDelegationsExpiringInDays
} from "../utils";

const NOW = todayAtMidnight();
const TOMORROW = inXDays(NOW, 1);
const YESTERDAY = xDaysAgo(NOW, 1);
const HUNDRED_DAYS_AGO = xDaysAgo(NOW, 100);
const NOW_PLUS_THREE_DAYS = endOfDay(inXDays(NOW, 3));
const NOW_PLUS_SEVEN_DAYS = endOfDay(inXDays(NOW, 7));
const NOW_PLUS_EIGHT_DAYS = endOfDay(inXDays(NOW, 8));
const NOW_PLUS_TEN_DAYS = endOfDay(inXDays(NOW, 10));

const EXPIRING_DELEGATIONS = [
  // Started yesterday, ends in 7 days
  { startDate: YESTERDAY, endDate: NOW_PLUS_SEVEN_DAYS },
  // Started long ago, ends in 7 days
  { startDate: HUNDRED_DAYS_AGO, endDate: NOW_PLUS_SEVEN_DAYS }
];

const NON_EXPIRING_DELEGATIONS = [
  // Does not expire in 7 days, expires before
  { startDate: YESTERDAY, endDate: NOW_PLUS_THREE_DAYS },
  // Does not expire in 7 days, expires after
  { startDate: YESTERDAY, endDate: NOW_PLUS_EIGHT_DAYS },
  // Expires in 7 days BUT started today
  { startDate: NOW, endDate: NOW_PLUS_SEVEN_DAYS },
  // Expires in 7 days BUT starts tomorrow
  { startDate: TOMORROW, endDate: NOW_PLUS_SEVEN_DAYS },
  // Is cancelled
  {
    startDate: YESTERDAY,
    endDate: NOW_PLUS_SEVEN_DAYS,
    cancelledBy: "Cancellor ID"
  },
  // Is revoked
  {
    startDate: YESTERDAY,
    endDate: NOW_PLUS_SEVEN_DAYS,
    revokedBy: "Revocator ID"
  },
  // Never expires
  { startDate: YESTERDAY, endDate: null },
  // Starts in more than 7 days
  { startDate: NOW_PLUS_EIGHT_DAYS, endDate: NOW_PLUS_TEN_DAYS }
];

describe("getRegistryDelegationsExpiringInDays", () => {
  afterEach(resetDatabase);

  it.each(EXPIRING_DELEGATIONS)(
    "should return expiring delegation (opt: %p)",
    async opt => {
      // Given
      const { delegation } = await registryDelegationFactory(opt);

      // When
      const delegations = await getRegistryDelegationsExpiringInDays(7);

      // Then
      expect(delegations.length).toBe(1);
      expect(delegations[0].id).toBe(delegation.id);
    }
  );

  it.each(NON_EXPIRING_DELEGATIONS)(
    "should *not* return delegation (opt: %p)",
    async opt => {
      // Given
      await registryDelegationFactory(opt);

      // When
      const delegations = await getRegistryDelegationsExpiringInDays(7);

      // Then
      expect(delegations.length).toBe(0);
    }
  );

  it("test with multiple expired / non expired delegations", async () => {
    // Given
    for (const delegation of [
      ...EXPIRING_DELEGATIONS,
      ...NON_EXPIRING_DELEGATIONS
    ]) {
      await registryDelegationFactory(delegation);
    }

    // When
    const delegations = await getRegistryDelegationsExpiringInDays(7);

    // Then
    expect(delegations.length).toBe(2);
  });
});

describe("getDelegationNotifiableUsers", () => {
  const setNotificationIsActiveRegistryDelegation = async (
    userId: string,
    isActive: boolean
  ) => {
    await prisma.companyAssociation.updateMany({
      where: { userId: userId },
      data: { notificationIsActiveRegistryDelegation: isActive }
    });
  };

  it("should return notifiable users involved in the delegation", async () => {
    // Given

    // Delegator company
    const { user: delegatorAdmin, company: delegator } =
      await userWithCompanyFactory();
    const delegatorAdmin2 = await userInCompany("ADMIN", delegator.id);
    await setNotificationIsActiveRegistryDelegation(delegatorAdmin2.id, false);
    const delegatorAdmin3 = await userInCompany("ADMIN", delegator.id);
    await userInCompany("MEMBER", delegator.id);

    // Delegate company
    const { user: delegateAdmin, company: delegate } =
      await userWithCompanyFactory();
    const delegateAdmin2 = await userInCompany("ADMIN", delegate.id);
    await setNotificationIsActiveRegistryDelegation(delegateAdmin2.id, false);
    const delegateAdmin3 = await userInCompany("ADMIN", delegate.id);
    await userInCompany("MEMBER", delegate.id);

    const { delegation } = await registryDelegationFactory({
      delegate: { connect: { id: delegate.id } },
      delegator: { connect: { id: delegator.id } }
    });

    // When
    const companyAssociations = await getDelegationNotifiableUsers(delegation);

    // Then
    expect(companyAssociations.map(c => c.userId)).toMatchObject([
      delegatorAdmin.id,
      delegatorAdmin3.id,
      delegateAdmin.id,
      delegateAdmin3.id
    ]);
  });
});
