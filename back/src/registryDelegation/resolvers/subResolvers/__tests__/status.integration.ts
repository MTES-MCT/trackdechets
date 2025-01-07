import { Prisma } from "@prisma/client";
import { nowPlusXHours } from "../../../../utils";
import { registryDelegationFactory } from "../../../__tests__/factories";
import { getDelegation } from "../../queries/__tests__/registryDelegation.integration";
import type { RegistryDelegationStatus } from "@td/codegen-back";

describe("status", () => {
  it.each([
    // REVOKED
    [
      { revokedBy: "someuserid", startDate: nowPlusXHours(-2) },
      "REVOKED" as RegistryDelegationStatus
    ],
    [
      { revokedBy: "someuserid", startDate: nowPlusXHours(2) },
      "REVOKED" as RegistryDelegationStatus
    ],
    [
      {
        revokedBy: "someuserid",
        startDate: nowPlusXHours(2),
        endDate: nowPlusXHours(3)
      },
      "REVOKED" as RegistryDelegationStatus
    ],
    [
      {
        revokedBy: "someuserid",
        startDate: nowPlusXHours(-4),
        endDate: nowPlusXHours(-3)
      },
      "REVOKED" as RegistryDelegationStatus
    ],
    // CANCELLED
    [
      { cancelledBy: "someuserid", startDate: nowPlusXHours(-2) },
      "CANCELLED" as RegistryDelegationStatus
    ],
    [
      { cancelledBy: "someuserid", startDate: nowPlusXHours(2) },
      "CANCELLED" as RegistryDelegationStatus
    ],
    [
      {
        cancelledBy: "someuserid",
        startDate: nowPlusXHours(2),
        endDate: nowPlusXHours(3)
      },
      "CANCELLED" as RegistryDelegationStatus
    ],
    [
      {
        cancelledBy: "someuserid",
        startDate: nowPlusXHours(-4),
        endDate: nowPlusXHours(-3)
      },
      "CANCELLED" as RegistryDelegationStatus
    ],
    // EXPIRED
    [
      {
        startDate: nowPlusXHours(-4),
        endDate: nowPlusXHours(-3)
      },
      "EXPIRED" as RegistryDelegationStatus
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
