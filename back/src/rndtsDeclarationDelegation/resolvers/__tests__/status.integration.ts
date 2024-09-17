import { Prisma } from "@prisma/client";
import { nowPlusXHours } from "../../../utils";
import { rndtsDeclarationDelegationFactory } from "../../__tests__/factories";
import { getDelegation } from "../queries/__tests__/rndtsDeclarationDelegation.integration";
import { RndtsDeclarationDelegationStatus } from "../../../generated/graphql/types";

describe("status", () => {
  it.each([
    // CLOSED
    [
      { isRevoked: true, startDate: nowPlusXHours(-2) },
      "CLOSED" as RndtsDeclarationDelegationStatus
    ],
    [
      { isRevoked: true, startDate: nowPlusXHours(2) },
      "CLOSED" as RndtsDeclarationDelegationStatus
    ],
    [
      {
        isRevoked: true,
        startDate: nowPlusXHours(2),
        endDate: nowPlusXHours(3)
      },
      "CLOSED" as RndtsDeclarationDelegationStatus
    ],
    [
      {
        isRevoked: true,
        startDate: nowPlusXHours(-4),
        endDate: nowPlusXHours(-3)
      },
      "CLOSED" as RndtsDeclarationDelegationStatus
    ],
    [
      {
        isRevoked: false,
        startDate: nowPlusXHours(-4),
        endDate: nowPlusXHours(-3)
      },
      "CLOSED" as RndtsDeclarationDelegationStatus
    ],
    // INCOMING
    [
      { startDate: nowPlusXHours(2) },
      "INCOMING" as RndtsDeclarationDelegationStatus
    ],
    [
      { startDate: nowPlusXHours(2), endDate: nowPlusXHours(3) },
      "INCOMING" as RndtsDeclarationDelegationStatus
    ],
    // ONGOING
    [
      { startDate: nowPlusXHours(-1) },
      "ONGOING" as RndtsDeclarationDelegationStatus
    ],
    [
      { startDate: nowPlusXHours(-1), endDate: nowPlusXHours(3) },
      "ONGOING" as RndtsDeclarationDelegationStatus
    ]
  ])(
    "delegation = %p, should return status %p",
    async (
      delegationOpt: Partial<Prisma.RndtsDeclarationDelegationCreateInput>,
      status: RndtsDeclarationDelegationStatus
    ) => {
      // Given
      const { delegation, delegateUser } =
        await rndtsDeclarationDelegationFactory(delegationOpt);

      // When
      const { errors, data } = await getDelegation(delegateUser, delegation.id);

      // Then
      expect(errors).toBeUndefined();
      expect(data.rndtsDeclarationDelegation.status).toBe(status);
    }
  );
});
