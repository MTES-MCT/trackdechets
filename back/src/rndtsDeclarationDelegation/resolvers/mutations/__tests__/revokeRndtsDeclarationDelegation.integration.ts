import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { User } from "@prisma/client";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { rndtsDeclarationDelegationFactory } from "../../../__tests__/factories";
import { userFactory, userInCompany } from "../../../../__tests__/factories";

const REVOKE_RNDTS_DECLARATION_DELEGATION = gql`
  mutation revokeRndtsDeclarationDelegation($delegationId: ID!) {
    revokeRndtsDeclarationDelegation(delegationId: $delegationId) {
      id
      isRevoked
      status
      delegate {
        id
      }
    }
  }
`;

const revokeDelegation = async (user: User | null, delegationId: string) => {
  const { mutate } = makeClient(user);
  const { errors, data } = await mutate<
    Pick<Mutation, "revokeRndtsDeclarationDelegation">
  >(REVOKE_RNDTS_DECLARATION_DELEGATION, {
    variables: {
      delegationId
    }
  });

  const delegation = await prisma.rndtsDeclarationDelegation.findFirst({
    where: { id: delegationId }
  });

  return { data, errors, delegation };
};

describe("mutation revokeRndtsDeclarationDelegation", () => {
  afterAll(resetDatabase);

  describe("successful use-cases", () => {
    it("should revoke delegation", async () => {
      // Given
      const { delegation, delegatorUser } =
        await rndtsDeclarationDelegationFactory();

      // When
      const {
        errors,
        data,
        delegation: updatedDelegation
      } = await revokeDelegation(delegatorUser, delegation.id);

      // Then
      expect(errors).toBeUndefined();
      expect(data.revokeRndtsDeclarationDelegation.isRevoked).toBeTruthy();
      expect(data.revokeRndtsDeclarationDelegation.status).toBe("CLOSED");
      expect(updatedDelegation?.isRevoked).toBeTruthy();
    });

    it("delegator can revoke delegation", async () => {
      // Given
      const { delegation, delegatorUser } =
        await rndtsDeclarationDelegationFactory();

      // When
      const {
        errors,
        data,
        delegation: updatedDelegation
      } = await revokeDelegation(delegatorUser, delegation.id);

      // Then
      expect(errors).toBeUndefined();
      expect(data.revokeRndtsDeclarationDelegation.isRevoked).toBeTruthy();
      expect(data.revokeRndtsDeclarationDelegation.status).toBe("CLOSED");
      expect(updatedDelegation?.isRevoked).toBeTruthy();
    });

    it("delegate can revoke delegation", async () => {
      // Given
      const { delegation, delegateUser } =
        await rndtsDeclarationDelegationFactory();

      // When
      const {
        errors,
        data,
        delegation: updatedDelegation
      } = await revokeDelegation(delegateUser, delegation.id);

      // Then
      expect(errors).toBeUndefined();
      expect(data.revokeRndtsDeclarationDelegation.isRevoked).toBeTruthy();
      expect(data.revokeRndtsDeclarationDelegation.status).toBe("CLOSED");
      expect(updatedDelegation?.isRevoked).toBeTruthy();
    });
  });

  describe("authentication & roles", () => {
    it("user must be authenticated", async () => {
      // Given
      const { delegation } = await rndtsDeclarationDelegationFactory();

      // When
      const { errors } = await revokeDelegation(null, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Vous n'êtes pas connecté.");
    });

    it("user must belong to one of the companies", async () => {
      // Given
      const { delegation } = await rndtsDeclarationDelegationFactory();
      const user = await userFactory();

      // When
      const { errors } = await revokeDelegation(user, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous devez faire partie de l'entreprise délégante ou délégataire d'une délégation pour pouvoir la révoquer."
      );
    });

    it("user must be admin", async () => {
      // Given
      const { delegation, delegateCompany } =
        await rndtsDeclarationDelegationFactory();
      const user = await userInCompany("MEMBER", delegateCompany.id);

      // When
      const { errors } = await revokeDelegation(user, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous devez être admin pour pouvoir révoquer une délégation."
      );
    });
  });

  describe("async validation", () => {
    it("should throw if delegation does not exist", async () => {
      // Given
      const user = await userFactory();

      // When
      const { errors } = await revokeDelegation(
        user,
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
