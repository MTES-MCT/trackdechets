import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { User } from "@prisma/client";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { registryDelegationFactory } from "../../../__tests__/factories";
import { userFactory, userInCompany } from "../../../../__tests__/factories";
import { getStream } from "../../../../activity-events/data";

const CANCEL_REGISTRY_DELEGATION = gql`
  mutation cancelRegistryDelegation($delegationId: ID!) {
    cancelRegistryDelegation(delegationId: $delegationId) {
      id
      status
      delegate {
        orgId
      }
    }
  }
`;

const cancelDelegation = async (user: User | null, delegationId: string) => {
  const { mutate } = makeClient(user);
  const { errors, data } = await mutate<
    Pick<Mutation, "cancelRegistryDelegation">
  >(CANCEL_REGISTRY_DELEGATION, {
    variables: {
      delegationId
    }
  });

  const delegation = await prisma.registryDelegation.findFirst({
    where: { id: delegationId }
  });

  return { data, errors, delegation };
};

describe("mutation cancelRegistryDelegation", () => {
  afterAll(resetDatabase);

  describe("successful use-cases", () => {
    it("should cancel delegation", async () => {
      // Given
      const { delegation, delegateUser, delegateCompany } =
        await registryDelegationFactory();

      // When
      const {
        errors,
        data,
        delegation: updatedDelegation
      } = await cancelDelegation(delegateUser, delegation.id);

      // Then
      expect(errors).toBeUndefined();
      expect(data.cancelRegistryDelegation.status).toBe("CANCELLED");
      expect(data.cancelRegistryDelegation.delegate.orgId).toBe(
        delegateCompany.orgId
      );
      expect(updatedDelegation?.cancelledBy).toBe(delegateUser.id);

      // Should create an event
      const eventsAfterCreate = await getStream(delegation!.id);
      expect(eventsAfterCreate.length).toBe(1);
      expect(eventsAfterCreate[0]).toMatchObject({
        type: "RegistryDelegationUpdated",
        actor: delegateUser.id,
        streamId: delegation!.id
      });
    });

    it("delegate can cancel delegation", async () => {
      // Given
      const { delegation, delegateUser, delegateCompany } =
        await registryDelegationFactory();

      // When
      const {
        errors,
        data,
        delegation: updatedDelegation
      } = await cancelDelegation(delegateUser, delegation.id);

      // Then
      expect(errors).toBeUndefined();
      expect(data.cancelRegistryDelegation.status).toBe("CANCELLED");
      expect(data.cancelRegistryDelegation.delegate.orgId).toBe(
        delegateCompany.orgId
      );
      expect(updatedDelegation?.cancelledBy).toBe(delegateUser.id);

      // Should create an event
      const eventsAfterCreate = await getStream(delegation!.id);
      expect(eventsAfterCreate.length).toBe(1);
      expect(eventsAfterCreate[0]).toMatchObject({
        type: "RegistryDelegationUpdated",
        actor: delegateUser.id,
        streamId: delegation!.id
      });
    });
  });

  describe("authentication & roles", () => {
    it("user must be authenticated", async () => {
      // Given
      const { delegation } = await registryDelegationFactory();

      // When
      const { errors } = await cancelDelegation(null, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Vous n'êtes pas connecté.");
    });

    it("user must belong to the delegate company", async () => {
      // Given
      const { delegation } = await registryDelegationFactory();
      const user = await userFactory();

      // When
      const { errors } = await cancelDelegation(user, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous devez faire partie de l'entreprise délégataire d'une délégation pour pouvoir l'annuler."
      );
    });

    it("user must be admin", async () => {
      // Given
      const { delegation, delegateCompany } = await registryDelegationFactory();
      const user = await userInCompany("MEMBER", delegateCompany.id);

      // When
      const { errors } = await cancelDelegation(user, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous n'avez pas les permissions suffisantes pour pouvoir annuler une délégation."
      );
    });

    it("delegator can NOT cancel delegation", async () => {
      // Given
      const { delegation, delegatorUser } = await registryDelegationFactory();

      // When
      const { errors } = await cancelDelegation(delegatorUser, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous devez faire partie de l'entreprise délégataire d'une délégation pour pouvoir l'annuler."
      );
    });
  });

  describe("async validation", () => {
    it("should throw if delegation does not exist", async () => {
      // Given
      const user = await userFactory();

      // When
      const { errors } = await cancelDelegation(
        user,
        "cxxxxxxxxxxxxxxxxxxxxxxxx"
      );

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "La demande de délégation cxxxxxxxxxxxxxxxxxxxxxxxx n'existe pas."
      );
    });

    it("cannot cancel an already cancelled delegation", async () => {
      // Given
      const { delegation, delegateUser } = await registryDelegationFactory({
        cancelledBy: "someuserid"
      });

      // When
      const { errors } = await cancelDelegation(delegateUser, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Cette délégation a déjà été annulée.");
    });

    it("cannot cancel a revoked delegation", async () => {
      // Given
      const { delegation, delegateUser } = await registryDelegationFactory({
        revokedBy: "someuserid"
      });

      // When
      const { errors } = await cancelDelegation(delegateUser, delegation.id);

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Cette délégation a été révoquée.");
    });
  });
});
