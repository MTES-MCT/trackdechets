import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { User } from "@td/prisma";
import makeClient from "../../../../__tests__/testClient";
import type { Query, QueryRegistryDelegationsArgs } from "@td/codegen-back";
import {
  registryDelegationFactory,
  registryDelegationFactoryWithExistingCompanies
} from "../../../__tests__/factories";
import { prisma } from "@td/prisma";

const REGISTRY_DELEGATIONS = gql`
  query registryDelegations(
    $skip: Int
    $first: Int
    $where: RegistryDelegationWhere
  ) {
    registryDelegations(skip: $skip, first: $first, where: $where) {
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
          status
        }
      }
    }
  }
`;

export const getDelegations = async (
  user: User | null,
  paginationArgs: Partial<QueryRegistryDelegationsArgs>
) => {
  const { query } = makeClient(user);
  return query<Pick<Query, "registryDelegations">>(REGISTRY_DELEGATIONS, {
    variables: {
      ...paginationArgs
    }
  });
};

describe("query registryDelegations", () => {
  afterAll(resetDatabase);

  describe("successful use-cases", () => {
    it("should return delegations", async () => {
      // Given
      const { delegation, delegatorUser, delegatorCompany, delegateCompany } =
        await registryDelegationFactory();

      // When
      const { errors, data } = await getDelegations(delegatorUser, {
        where: { delegatorOrgId: delegatorCompany.orgId }
      });

      // Then
      expect(errors).toBeUndefined();
      expect(data.registryDelegations.totalCount).toBe(1);
      expect(data.registryDelegations.edges[0].node.id).toBe(delegation.id);
      expect(data.registryDelegations.edges[0].node.delegate.orgId).toBe(
        delegateCompany.orgId
      );
      expect(data.registryDelegations.edges[0].node.delegator.orgId).toBe(
        delegatorCompany.orgId
      );
    });

    it("user can query as delegate", async () => {
      // Given
      const { delegation, delegateUser, delegateCompany } =
        await registryDelegationFactory();

      // When
      const { errors, data } = await getDelegations(delegateUser, {
        where: { delegateOrgId: delegateCompany.orgId }
      });

      // Then
      expect(errors).toBeUndefined();
      expect(data.registryDelegations.totalCount).toBe(1);
      expect(data.registryDelegations.edges[0].node.id).toBe(delegation.id);
    });

    it("user can query as delegator", async () => {
      // Given
      const { delegation, delegatorUser, delegatorCompany } =
        await registryDelegationFactory();

      // When
      const { errors, data } = await getDelegations(delegatorUser, {
        where: { delegatorOrgId: delegatorCompany.orgId }
      });

      // Then
      expect(errors).toBeUndefined();
      expect(data.registryDelegations.totalCount).toBe(1);
      expect(data.registryDelegations.edges[0].node.id).toBe(delegation.id);
    });
  });

  describe("authentication & roles", () => {
    it("user must be authenticated", async () => {
      // Given
      const { delegatorCompany } = await registryDelegationFactory();

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
        await registryDelegationFactory();

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
        await registryDelegationFactory();

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
      const { delegateUser } = await registryDelegationFactory();

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
      const { delegatorUser } = await registryDelegationFactory();

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
    } = await registryDelegationFactory();
    const delegation2 = await registryDelegationFactoryWithExistingCompanies(
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
    expect(data1.registryDelegations.totalCount).toBe(2);
    expect(data1.registryDelegations.edges[0].node.id).toBe(delegation2.id);
    expect(data1.registryDelegations.edges[1].node.id).toBe(delegation1.id);

    // When: update delegation 2
    await prisma.registryDelegation.update({
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
    expect(data2.registryDelegations.totalCount).toBe(2);
    expect(data2.registryDelegations.edges[0].node.id).toBe(delegation1.id);
    expect(data2.registryDelegations.edges[1].node.id).toBe(delegation2.id);
  });

  it("should return paginated results", async () => {
    // Given
    const { delegation, delegatorUser, delegatorCompany, delegateCompany } =
      await registryDelegationFactory();
    const delegation2 = await registryDelegationFactoryWithExistingCompanies(
      delegateCompany,
      delegatorCompany
    );
    const delegation3 = await registryDelegationFactoryWithExistingCompanies(
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
    expect(data1.registryDelegations.totalCount).toBe(3);
    expect(data1.registryDelegations.edges.length).toBe(2);
    expect(data1.registryDelegations.edges[0].node.id).toBe(delegation3.id);
    expect(data1.registryDelegations.edges[1].node.id).toBe(delegation2.id);

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
    expect(data2.registryDelegations.totalCount).toBe(3);
    expect(data2.registryDelegations.edges.length).toBe(1);
    expect(data2.registryDelegations.edges[0].node.id).toBe(delegation.id);
  });
});
