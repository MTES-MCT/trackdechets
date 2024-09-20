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
    $skip: Int
    $first: Int
    $where: RndtsDeclarationDelegationWhere
  ) {
    rndtsDeclarationDelegations(skip: $skip, first: $first, where: $where) {
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
            orgId
          }
          delegator {
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
      const { delegation, delegatorUser, delegatorCompany, delegateCompany } =
        await rndtsDeclarationDelegationFactory();

      // When
      const { errors, data } = await getDelegations(delegatorUser, {
        where: { delegatorOrgId: delegatorCompany.orgId }
      });

      // Then
      expect(errors).toBeUndefined();
      expect(data.rndtsDeclarationDelegations.totalCount).toBe(1);
      expect(data.rndtsDeclarationDelegations.edges[0].node.id).toBe(
        delegation.id
      );
      expect(
        data.rndtsDeclarationDelegations.edges[0].node.delegate.orgId
      ).toBe(delegateCompany.orgId);
      expect(
        data.rndtsDeclarationDelegations.edges[0].node.delegator.orgId
      ).toBe(delegatorCompany.orgId);
    });

    it("user can query as delegate", async () => {
      // Given
      const { delegation, delegateUser, delegateCompany } =
        await rndtsDeclarationDelegationFactory();

      // When
      const { errors, data } = await getDelegations(delegateUser, {
        where: { delegateOrgId: delegateCompany.orgId }
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
        where: { delegatorOrgId: delegatorCompany.orgId }
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
        where: { delegatorOrgId: delegatorCompany.orgId }
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
        where: { delegateOrgId: delegateCompany.orgId }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        `L'utilisateur ne fait pas partie de l'entreprise ${delegateCompany.orgId}.`
      );
    });

    it("user must belong to delegator company", async () => {
      // Given
      const { delegatorCompany, delegateUser } =
        await rndtsDeclarationDelegationFactory();

      // When
      const { errors } = await getDelegations(delegateUser, {
        where: { delegateOrgId: delegatorCompany.orgId }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        `L'utilisateur ne fait pas partie de l'entreprise ${delegatorCompany.orgId}.`
      );
    });
  });

  describe("async validation", () => {
    it("should throw if delegate company does not exist", async () => {
      // Given
      const { delegateUser } = await rndtsDeclarationDelegationFactory();

      // When
      const { errors } = await getDelegations(delegateUser, {
        where: { delegateOrgId: "39070205800012" }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        `L'entreprise 39070205800012 n'existe pas.`
      );
    });

    it("should throw if delegator company does not exist", async () => {
      // Given
      const { delegatorUser } = await rndtsDeclarationDelegationFactory();

      // When
      const { errors } = await getDelegations(delegatorUser, {
        where: { delegateOrgId: "39070205800012" }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        `L'entreprise 39070205800012 n'existe pas.`
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
        where: { delegatorOrgId: delegatorCompany.orgId }
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
        where: { delegatorOrgId: delegatorCompany.orgId }
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

  it("should return paginated results", async () => {
    // Given
    const { delegation, delegatorUser, delegatorCompany, delegateCompany } =
      await rndtsDeclarationDelegationFactory();
    const delegation2 =
      await rndtsDeclarationDelegationFactoryWithExistingCompanies(
        delegateCompany,
        delegatorCompany
      );
    const delegation3 =
      await rndtsDeclarationDelegationFactoryWithExistingCompanies(
        delegateCompany,
        delegatorCompany
      );

    // When (1st page)
    const { errors: errors1, data: data1 } = await getDelegations(
      delegatorUser,
      {
        where: { delegatorOrgId: delegatorCompany.orgId },
        first: 2,
        skip: 0
      }
    );

    // Then
    expect(errors1).toBeUndefined();
    expect(data1.rndtsDeclarationDelegations.totalCount).toBe(3);
    expect(data1.rndtsDeclarationDelegations.edges.length).toBe(2);
    expect(data1.rndtsDeclarationDelegations.edges[0].node.id).toBe(
      delegation3.id
    );
    expect(data1.rndtsDeclarationDelegations.edges[1].node.id).toBe(
      delegation2.id
    );

    // When (second page)
    const { errors: errors2, data: data2 } = await getDelegations(
      delegatorUser,
      {
        where: { delegatorOrgId: delegatorCompany.orgId },
        first: 2,
        skip: 2
      }
    );

    // Then
    expect(errors2).toBeUndefined();
    expect(data2.rndtsDeclarationDelegations.totalCount).toBe(3);
    expect(data2.rndtsDeclarationDelegations.edges.length).toBe(1);
    expect(data2.rndtsDeclarationDelegations.edges[0].node.id).toBe(
      delegation.id
    );
  });
});
