import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { User } from "@prisma/client";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { rndtsDeclarationDelegationFactory } from "../../../__tests__/factories";

const REVOKE_RNDTS_DECLARATION_DELEGATION = gql`
  mutation revokeRndtsDeclarationDelegation($delegationId: ID!) {
    revokeRndtsDeclarationDelegation(delegationId: $delegationId) {
      id
      isRevoked
      status
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
  });
});
