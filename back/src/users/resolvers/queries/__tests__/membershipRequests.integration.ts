import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { User } from "@td/prisma";
import makeClient from "../../../../__tests__/testClient";
import type { Query, QueryMembershipRequestArgs } from "@td/codegen-back";
import {
  userFactory,
  userWithCompanyFactory,
  createMembershipRequest,
  companyAssociatedToExistingUserFactory,
  siretify
} from "../../../../__tests__/factories";

const MEMBERSHIP_REQUESTS = gql`
  query membershipRequests(
    $skip: Int
    $first: Int
    $where: MembershipRequestsWhere
  ) {
    membershipRequests(skip: $skip, first: $first, where: $where) {
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
          email
          name
          status
          createdAt
        }
      }
    }
  }
`;

export const getMembershipRequests = async (
  user: User | null,
  paginationArgs: Partial<QueryMembershipRequestArgs>
) => {
  const { query } = makeClient(user);
  return query<Pick<Query, "membershipRequests">>(MEMBERSHIP_REQUESTS, {
    variables: {
      ...paginationArgs
    }
  });
};

describe("membershipRequests", () => {
  afterAll(resetDatabase);

  it("user should be authenticaed", async () => {
    // Given
    const { company } = await userWithCompanyFactory();

    // When
    const { errors } = await getMembershipRequests(null, {
      where: { id: company.id }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe("Vous n'êtes pas connecté.");
  });

  it("should return a list of membership requests - using the company ID", async () => {
    // Given
    const { company, user: admin } = await userWithCompanyFactory();

    const user = await userFactory();
    const request = await createMembershipRequest(user, company);

    // When
    const { errors, data } = await getMembershipRequests(admin, {
      where: { id: company.id }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data?.membershipRequests.totalCount).toEqual(1);
    expect(data.membershipRequests.edges[0].node.id).toEqual(request.id);
    expect(data.membershipRequests.edges[0].node.createdAt).toEqual(
      request.createdAt.toISOString()
    );
    expect(data.membershipRequests.edges[0].node.status).toEqual(
      request.status
    );
    expect(data.membershipRequests.edges[0].node.name).toEqual(user.name);
    expect(data.membershipRequests.edges[0].node.email).toEqual(user.email);
  });

  it("should return a list of membership requests - using the company orgId", async () => {
    // Given
    const { company, user: admin } = await userWithCompanyFactory();

    const user = await userFactory();
    const request = await createMembershipRequest(user, company);

    // When
    const { errors, data } = await getMembershipRequests(admin, {
      where: { orgId: company.orgId }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data?.membershipRequests.totalCount).toEqual(1);
    expect(data.membershipRequests.edges[0].node.id).toEqual(request.id);
    expect(data.membershipRequests.edges[0].node.createdAt).toEqual(
      request.createdAt.toISOString()
    );
    expect(data.membershipRequests.edges[0].node.status).toEqual(
      request.status
    );
    expect(data.membershipRequests.edges[0].node.name).toEqual(user.name);
    expect(data.membershipRequests.edges[0].node.email).toEqual(user.email);
  });

  it("should return an error if user doesn't have appropriate permissions", async () => {
    // Given
    const { company, user: companyMember } = await userWithCompanyFactory(
      "MEMBER"
    );

    const user = await userFactory();
    await createMembershipRequest(user, company);

    // When
    const { errors } = await getMembershipRequests(companyMember, {
      where: { id: company.id }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      `Vous n'avez pas la permission de lister les demandes de rattachement de l'établissement ${company.orgId}`
    );
  });

  it("should return an error if user doesn't belong to target company", async () => {
    // Given
    const { user: admin1 } = await userWithCompanyFactory("ADMIN");
    const { company: company2 } = await userWithCompanyFactory("ADMIN");

    // When
    const { errors } = await getMembershipRequests(admin1, {
      where: { id: company2.id }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      `Vous n'avez pas la permission de lister les demandes de rattachement de l'établissement ${company2.orgId}`
    );
  });

  it("should return an error if the company ID does not exist", async () => {
    // Given
    const { user: admin } = await userWithCompanyFactory();

    // When
    const { errors } = await getMembershipRequests(admin, {
      where: { id: "non-existing-id" }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe("L'entreprise ciblée n'existe pas");
  });

  it("should return an error if the company orgId does not exist", async () => {
    // Given
    const { user: admin } = await userWithCompanyFactory();

    // When
    const { errors } = await getMembershipRequests(admin, {
      where: { orgId: siretify(3) }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe("L'entreprise ciblée n'existe pas");
  });

  it("should return an error no ID nor orgId has been provided", async () => {
    // Given
    const { user: admin } = await userWithCompanyFactory();

    // When
    const { errors } = await getMembershipRequests(admin, {});

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe("Obligatoire");
  });

  it("should return an error if using both ID and orgId", async () => {
    // Given
    const { company, user: admin } = await userWithCompanyFactory();

    // When
    const { errors } = await getMembershipRequests(admin, {
      where: { id: company.id, orgId: company.orgId }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "Vous devez faire une recherche par `id` ou `orgId` mais pas les deux"
    );
  });

  it("should not return unrelated membership requests", async () => {
    // Given

    // Company 1
    const { company: company1, user: admin1 } = await userWithCompanyFactory();
    const user1 = await userFactory();
    const request1 = await createMembershipRequest(user1, company1);

    // Company 2 (unrelated because admin is not admin of company 2)
    const { company: company2 } = await userWithCompanyFactory();
    const user2 = await userFactory();
    await createMembershipRequest(user2, company2);

    // Company 3 (unrelated because admin will request on company 1)
    const company3 = await companyAssociatedToExistingUserFactory(
      admin1,
      "ADMIN"
    );
    const user3 = await userFactory();
    await createMembershipRequest(user3, company3);

    // When
    const { errors, data } = await getMembershipRequests(admin1, {
      where: { id: company1.id }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data?.membershipRequests.totalCount).toEqual(1);
    expect(data.membershipRequests.edges[0].node.id).toEqual(request1.id);
    expect(data.membershipRequests.edges[0].node.createdAt).toEqual(
      request1.createdAt.toISOString()
    );
    expect(data.membershipRequests.edges[0].node.status).toEqual(
      request1.status
    );
    expect(data.membershipRequests.edges[0].node.name).toEqual(user1.name);
    expect(data.membershipRequests.edges[0].node.email).toEqual(user1.email);
  });

  it("should not return requests that are not PENDING", async () => {
    // Given
    const { company, user: admin } = await userWithCompanyFactory();

    // Request 1: legit
    const user1 = await userFactory();
    const request = await createMembershipRequest(user1, company);

    // Request 2: not legit, because not pending
    const user2 = await userFactory();
    await createMembershipRequest(user2, company, { status: "ACCEPTED" });

    // Request 3: not legit, because not pending
    const user3 = await userFactory();
    await createMembershipRequest(user3, company, { status: "REFUSED" });

    // When
    const { errors, data } = await getMembershipRequests(admin, {
      where: { orgId: company.orgId }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data?.membershipRequests.totalCount).toEqual(1);
    expect(data.membershipRequests.edges[0].node.id).toEqual(request.id);
    expect(data.membershipRequests.edges[0].node.createdAt).toEqual(
      request.createdAt.toISOString()
    );
    expect(data.membershipRequests.edges[0].node.status).toEqual(
      request.status
    );
    expect(data.membershipRequests.edges[0].node.name).toEqual(user1.name);
    expect(data.membershipRequests.edges[0].node.email).toEqual(user1.email);
  });

  it("testing pagination", async () => {
    // Given
    const { company, user: admin } = await userWithCompanyFactory();

    // Request 1
    const user1 = await userFactory();
    const request1 = await createMembershipRequest(user1, company);

    // Request 2
    const user2 = await userFactory();
    const request2 = await createMembershipRequest(user2, company);

    // Request 3
    const user3 = await userFactory();
    const request3 = await createMembershipRequest(user3, company);

    // When (first page)
    const { errors: errors1, data: data1 } = await getMembershipRequests(
      admin,
      {
        where: { id: company.id },
        first: 2,
        skip: 0
      }
    );

    // Then
    expect(errors1).toBeUndefined();
    expect(data1?.membershipRequests.totalCount).toEqual(3);
    expect(data1?.membershipRequests.edges.length).toEqual(2);
    expect(data1?.membershipRequests.edges[0].node.id).toEqual(request3.id);
    expect(data1?.membershipRequests.edges[1].node.id).toEqual(request2.id);

    // When (second page)
    const { errors: errors2, data: data2 } = await getMembershipRequests(
      admin,
      {
        where: { id: company.id },
        first: 2,
        skip: 2
      }
    );

    // Then
    expect(errors2).toBeUndefined();
    expect(data2?.membershipRequests.totalCount).toEqual(3);
    expect(data2?.membershipRequests.edges.length).toEqual(1);
    expect(data2?.membershipRequests.edges[0].node.id).toEqual(request1.id);
  });
});
