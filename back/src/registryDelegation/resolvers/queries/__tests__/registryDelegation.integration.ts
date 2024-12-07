import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { registryDelegationFactory } from "../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type { Query } from "@td/codegen-back";
import { User } from "@prisma/client";
import { userFactory } from "../../../../__tests__/factories";

const REGISTRY_DELEGATION = gql`
  query registryDelegation($delegationId: ID!) {
    registryDelegation(delegationId: $delegationId) {
      id
      createdAt
      updatedAt
      delegate {
        orgId
      }
      delegator {
        orgId
      }
      startDate
      endDate
      comment
      status
    }
  }
`;

export const getDelegation = async (
  user: User | null,
  delegationId: string
) => {
  const { query } = makeClient(user);
  return query<Pick<Query, "registryDelegation">>(REGISTRY_DELEGATION, {
    variables: {
      delegationId
    }
  });
};

describe("query registryDelegation", () => {
  afterAll(resetDatabase);

  describe("successful use-cases", () => {
    it("should return delegation", async () => {
      // Given
      const { delegation, delegatorUser, delegateCompany, delegatorCompany } =
        await registryDelegationFactory();

      // When
      const { errors, data } = await getDelegation(
        delegatorUser,
        delegation.id
      );

      // Then
      expect(errors).toBeUndefined();
      expect(data.registryDelegation.id).toBe(delegation.id);
      expect(data.registryDelegation.delegate.orgId).toBe(
        delegateCompany.orgId
      );
      expect(data.registryDelegation.delegator.orgId).toBe(
        delegatorCompany.orgId
      );
    });
  });

  describe("authentication & roles", () => {
    it("user must be authenticated", async () => {
      // Given
      const { delegation } = await registryDelegationFactory();

      // When
      const { errors } = await getDelegation(null, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Vous n'êtes pas connecté.");
    });

    it("user must belong to delegate or delegator company", async () => {
      // Given
      const { delegation } = await registryDelegationFactory();
      const user = await userFactory();

      // When
      const { errors } = await getDelegation(user, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous devez faire partie de l'entreprise délégante ou délégataire d'une délégation pour y avoir accès."
      );
    });
  });

  describe("async validation", () => {
    it("should throw if delegation id does not exist", async () => {
      // Given
      const { delegatorUser } = await registryDelegationFactory();

      // When
      const { errors } = await getDelegation(
        delegatorUser,
        "cxxxxxxxxxxxxxxxxxxxxxxxx"
      );

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "La demande de délégation cxxxxxxxxxxxxxxxxxxxxxxxx n'existe pas."
      );
    });
  });
});
