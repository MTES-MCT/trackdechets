import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { rndtsDeclarationDelegationFactory } from "../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Query } from "../../../../generated/graphql/types";
import { User } from "@prisma/client";
import { userFactory } from "../../../../__tests__/factories";

const RNDTS_DECLARATION_DELEGATION = gql`
  query rndtsDeclarationDelegation($id: ID) {
    rndtsDeclarationDelegation(id: $id) {
      id
      createdAt
      updatedAt
      delegateOrgId
      delegatorOrgId
      validityStartDate
      validityEndDate
      comment
      isAccepted
      isActive
    }
  }
`;

export const getDelegation = async (user: User | null, id: string) => {
  const { query } = makeClient(user);
  return query<Pick<Query, "rndtsDeclarationDelegation">>(
    RNDTS_DECLARATION_DELEGATION,
    {
      variables: {
        id
      }
    }
  );
};

describe("query rndtsDeclarationDelegation", () => {
  afterAll(resetDatabase);

  describe("successful use-cases", () => {
    it("should return delegation", async () => {
      // Given
      const { delegation, delegatorUser } =
        await rndtsDeclarationDelegationFactory();

      // When
      const { errors, data } = await getDelegation(
        delegatorUser,
        delegation.id
      );

      // Then
      expect(errors).toBeUndefined();
      expect(data.rndtsDeclarationDelegation.id).toBe(delegation.id);
    });
  });

  describe("authentication & roles", () => {
    it("user must be authenticated", async () => {
      // Given
      const { delegation } = await rndtsDeclarationDelegationFactory();

      // When
      const { errors } = await getDelegation(null, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Vous n'êtes pas connecté.");
    });

    it("user must belong to delegate or delegator company", async () => {
      // Given
      const { delegation } = await rndtsDeclarationDelegationFactory();
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
      const { delegatorUser } = await rndtsDeclarationDelegationFactory();

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
