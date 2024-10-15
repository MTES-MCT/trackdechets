import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { User } from "@prisma/client";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { registryDelegationFactory } from "../../../__tests__/factories";
import { userFactory, userInCompany } from "../../../../__tests__/factories";
import { getStream } from "../../../../activity-events/data";

const REVOKE_REGISTRY_DELEGATION = gql`
  mutation revokeRegistryDelegation($delegationId: ID!) {
    revokeRegistryDelegation(delegationId: $delegationId) {
      id
      status
      delegate {
        orgId
      }
      revokedBy
    }
  }
`;

const revokeDelegation = async (user: User | null, delegationId: string) => {
  const { mutate } = makeClient(user);
  const { errors, data } = await mutate<
    Pick<Mutation, "revokeRegistryDelegation">
  >(REVOKE_REGISTRY_DELEGATION, {
    variables: {
      delegationId
    }
  });

  const delegation = await prisma.registryDelegation.findFirst({
    where: { id: delegationId }
  });

  return { data, errors, delegation };
};

describe("mutation revokeRegistryDelegation", () => {
  afterAll(resetDatabase);

  describe("successful use-cases", () => {
    it("should revoke delegation", async () => {
      // Given
      const { delegation, delegatorUser, delegateCompany } =
        await registryDelegationFactory();

      // When
      const {
        errors,
        data,
        delegation: updatedDelegation
      } = await revokeDelegation(delegatorUser, delegation.id);

      // Then
      expect(errors).toBeUndefined();
      expect(data.revokeRegistryDelegation.revokedBy).toBe(delegatorUser.id);
      expect(data.revokeRegistryDelegation.status).toBe("REVOKED");
      expect(data.revokeRegistryDelegation.delegate.orgId).toBe(
        delegateCompany.orgId
      );
      expect(updatedDelegation?.revokedBy).toBe(delegatorUser.id);

      // Should create an event
      const eventsAfterCreate = await getStream(delegation!.id);
      expect(eventsAfterCreate.length).toBe(1);
      expect(eventsAfterCreate[0]).toMatchObject({
        type: "RegistryDelegationUpdated",
        actor: delegatorUser.id,
        streamId: delegation!.id
      });
    });

    it("delegator can revoke delegation", async () => {
      // Given
      const { delegation, delegatorUser } = await registryDelegationFactory();

      // When
      const {
        errors,
        data,
        delegation: updatedDelegation
      } = await revokeDelegation(delegatorUser, delegation.id);

      // Then
      expect(errors).toBeUndefined();
      expect(data.revokeRegistryDelegation.revokedBy).toBe(delegatorUser.id);
      expect(data.revokeRegistryDelegation.status).toBe("REVOKED");
      expect(updatedDelegation?.revokedBy).toBe(delegatorUser.id);
    });
  });

  describe("authentication & roles", () => {
    it("user must be authenticated", async () => {
      // Given
      const { delegation } = await registryDelegationFactory();

      // When
      const { errors } = await revokeDelegation(null, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Vous n'êtes pas connecté.");
    });

    it("user must belong to the delegator company", async () => {
      // Given
      const { delegation } = await registryDelegationFactory();
      const user = await userFactory();

      // When
      const { errors } = await revokeDelegation(user, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous devez faire partie de l'entreprise délégante d'une délégation pour pouvoir la révoquer."
      );
    });

    it("user must be admin", async () => {
      // Given
      const { delegation, delegatorCompany } =
        await registryDelegationFactory();
      const user = await userInCompany("MEMBER", delegatorCompany.id);

      // When
      const { errors } = await revokeDelegation(user, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous n'avez pas les permissions suffisantes pour pouvoir révoquer une délégation."
      );
    });

    it("delegate can NOT revoke delegation", async () => {
      // Given
      const { delegation, delegateUser } = await registryDelegationFactory();

      // When
      const { errors } = await revokeDelegation(delegateUser, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous devez faire partie de l'entreprise délégante d'une délégation pour pouvoir la révoquer."
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

    it("cannot revoke an already revoked delegation", async () => {
      // Given
      const { delegation, delegatorUser } = await registryDelegationFactory({
        revokedBy: "someuserid"
      });

      // When
      const { errors } = await revokeDelegation(delegatorUser, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Cette délégation a déjà été révoquée.");
    });

    it("cannot revoke a cancelled delegation", async () => {
      // Given
      const { delegation, delegatorUser } = await registryDelegationFactory({
        cancelledBy: "someuserid"
      });

      // When
      const { errors } = await revokeDelegation(delegatorUser, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Cette délégation a été annulée.");
    });
  });
});
