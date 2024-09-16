import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { User } from "@prisma/client";
import makeClient from "../../../../__tests__/testClient";
import {
  Query,
  QueryRndtsDeclarationDelegationsArgs
} from "../../../../generated/graphql/types";
import {
  rndtsDeclarationDelegationFactory,
  rndtsDeclarationDelegationFactoryWithExistingCompanies
} from "../../../__tests__/factories";
import { prisma } from "@td/prisma";

const RNDTS_DECLARATION_DELEGATIONS = gql`
  query rndtsDeclarationDelegations(
    $after: ID
    $first: Int
    $where: RndtsDeclarationDelegationWhere
  ) {
    rndtsDeclarationDelegations(after: $after, first: $first, where: $where) {
      totalCount
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      edges {
        node {
          id
          createdAt
          updatedAt
          delegate {
            id
            orgId
          }
          delegator {
            id
            orgId
          }
          startDate
          endDate
          comment
          isRevoked
          status
        }
      }
    }
  }
`;

export const getDelegations = async (
  user: User | null,
  paginationArgs: Partial<QueryRndtsDeclarationDelegationsArgs>
) => {
  const { query } = makeClient(user);
  return query<Pick<Query, "rndtsDeclarationDelegations">>(
    RNDTS_DECLARATION_DELEGATIONS,
    {
      variables: {
        ...paginationArgs
      }
    }
  );
};

describe("query rndtsDeclarationDelegations", () => {
  afterAll(resetDatabase);

  describe("successful use-cases", () => {
    it("should return delegations", async () => {
      // Given
      const { delegation, delegatorUser, delegatorCompany } =
        await rndtsDeclarationDelegationFactory();

      // When
      const { errors, data } = await getDelegations(delegatorUser, {
        where: { delegatorId: delegatorCompany.id }
      });

      // Then
      expect(errors).toBeUndefined();
      expect(data.rndtsDeclarationDelegations.totalCount).toBe(1);
      expect(data.rndtsDeclarationDelegations.edges[0].node.id).toBe(
        delegation.id
      );
    });

    it("user can query as delegate", async () => {
      // Given
      const { delegation, delegateUser, delegateCompany } =
        await rndtsDeclarationDelegationFactory();

      // When
      const { errors, data } = await getDelegations(delegateUser, {
        where: { delegateId: delegateCompany.id }
      });

      // Then
      expect(errors).toBeUndefined();
      expect(data.rndtsDeclarationDelegations.totalCount).toBe(1);
      expect(data.rndtsDeclarationDelegations.edges[0].node.id).toBe(
        delegation.id
      );
    });

    it("user can query as delegator", async () => {
      // Given
      const { delegation, delegatorUser, delegatorCompany } =
        await rndtsDeclarationDelegationFactory();

      // When
      const { errors, data } = await getDelegations(delegatorUser, {
        where: { delegatorId: delegatorCompany.id }
      });

      // Then
      expect(errors).toBeUndefined();
      expect(data.rndtsDeclarationDelegations.totalCount).toBe(1);
      expect(data.rndtsDeclarationDelegations.edges[0].node.id).toBe(
        delegation.id
      );
    });
  });

  describe("authentication & roles", () => {
    it("user must be authenticated", async () => {
      // Given
      const { delegatorCompany } = await rndtsDeclarationDelegationFactory();

      // When
      const { errors } = await getDelegations(null, {
        where: { delegatorId: delegatorCompany.id }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe("Vous n'êtes pas connecté.");
    });

    it("user must belong to delegate company", async () => {
      // Given
      const { delegateCompany, delegatorUser } =
        await rndtsDeclarationDelegationFactory();

      // When
      const { errors } = await getDelegations(delegatorUser, {
        where: { delegateId: delegateCompany.id }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        `L'entreprise ${delegateCompany.id} n'existe pas ou l'utilisateur n'en fait pas partie`
      );
    });

    it("user must belong to delegator company", async () => {
      // Given
      const { delegatorCompany, delegateUser } =
        await rndtsDeclarationDelegationFactory();

      // When
      const { errors } = await getDelegations(delegateUser, {
        where: { delegateId: delegatorCompany.id }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        `L'entreprise ${delegatorCompany.id} n'existe pas ou l'utilisateur n'en fait pas partie`
      );
    });
  });

  describe("async validation", () => {
    it("should throw if delegate company does not exist", async () => {
      // Given
      const { delegateUser } = await rndtsDeclarationDelegationFactory();

      // When
      const { errors } = await getDelegations(delegateUser, {
        where: { delegateId: "cl81ooom5138122w9sbznzdkg" }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        `L'entreprise cl81ooom5138122w9sbznzdkg n'existe pas ou l'utilisateur n'en fait pas partie`
      );
    });

    it("should throw if delegator company does not exist", async () => {
      // Given
      const { delegatorUser } = await rndtsDeclarationDelegationFactory();

      // When
      const { errors } = await getDelegations(delegatorUser, {
        where: { delegatorId: "cl81ooom5138122w9sbznzdkg" }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        `L'entreprise cl81ooom5138122w9sbznzdkg n'existe pas ou l'utilisateur n'en fait pas partie`
      );
    });
  });

  it("should be sorted by updatedAt", async () => {
    // Given
    const {
      delegation: delegation1,
      delegatorUser,
      delegateCompany,
      delegatorCompany
    } = await rndtsDeclarationDelegationFactory();
    const delegation2 =
      await rndtsDeclarationDelegationFactoryWithExistingCompanies(
        delegateCompany,
        delegatorCompany
      );

    // When
    const { errors: errors1, data: data1 } = await getDelegations(
      delegatorUser,
      {
        where: { delegatorId: delegatorCompany.id }
      }
    );

    // Then
    expect(errors1).toBeUndefined();
    expect(data1.rndtsDeclarationDelegations.totalCount).toBe(2);
    expect(data1.rndtsDeclarationDelegations.edges[0].node.id).toBe(
      delegation2.id
    );
    expect(data1.rndtsDeclarationDelegations.edges[1].node.id).toBe(
      delegation1.id
    );

    // When: update delegation 2
    await prisma.rndtsDeclarationDelegation.update({
      where: { id: delegation1.id },
      data: { comment: "test" }
    });
    const { errors: errors2, data: data2 } = await getDelegations(
      delegatorUser,
      {
        where: { delegatorId: delegatorCompany.id }
      }
    );

    // Then
    expect(errors2).toBeUndefined();
    expect(data2.rndtsDeclarationDelegations.totalCount).toBe(2);
    expect(data2.rndtsDeclarationDelegations.edges[0].node.id).toBe(
      delegation1.id
    );
    expect(data2.rndtsDeclarationDelegations.edges[1].node.id).toBe(
      delegation2.id
    );
  });
});
