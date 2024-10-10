import { Prisma } from "@prisma/client";
import { nowPlusXHours } from "../../../utils";
import { registryDelegationFactory } from "../../__tests__/factories";
import { getDelegation } from "../queries/__tests__/registryDelegation.integration";
import { RegistryDelegationStatus } from "../../../generated/graphql/types";

describe("status", () => {
  it.each([
    // CLOSED
    [
      { isRevoked: true, startDate: nowPlusXHours(-2) },
      "CLOSED" as RegistryDelegationStatus
    ],
    [
      { isRevoked: true, startDate: nowPlusXHours(2) },
      "CLOSED" as RegistryDelegationStatus
    ],
    [
      {
        isRevoked: true,
        startDate: nowPlusXHours(2),
        endDate: nowPlusXHours(3)
      },
      "CLOSED" as RegistryDelegationStatus
    ],
    [
      {
        isRevoked: true,
        startDate: nowPlusXHours(-4),
        endDate: nowPlusXHours(-3)
      },
      "CLOSED" as RegistryDelegationStatus
    ],
    [
      {
        isRevoked: false,
        startDate: nowPlusXHours(-4),
        endDate: nowPlusXHours(-3)
      },
      "CLOSED" as RegistryDelegationStatus
    ],
    // INCOMING
    [{ startDate: nowPlusXHours(2) }, "INCOMING" as RegistryDelegationStatus],
    [
      { startDate: nowPlusXHours(2), endDate: nowPlusXHours(3) },
      "INCOMING" as RegistryDelegationStatus
    ],
    // ONGOING
    [{ startDate: nowPlusXHours(-1) }, "ONGOING" as RegistryDelegationStatus],
    [
      { startDate: nowPlusXHours(-1), endDate: nowPlusXHours(3) },
      "ONGOING" as RegistryDelegationStatus
    ]
  ])(
    "delegation = %p, should return status %p",
    async (
      delegationOpt: Partial<Prisma.RegistryDelegationCreateInput>,
      status: RegistryDelegationStatus
    ) => {
      // Given
      const { delegation, delegateUser } = await registryDelegationFactory(
        delegationOpt
      );

      // When
      const { errors, data } = await getDelegation(delegateUser, delegation.id);

      // Then
      expect(errors).toBeUndefined();
      expect(data.registryDelegation.status).toBe(status);
    }
  );
});
