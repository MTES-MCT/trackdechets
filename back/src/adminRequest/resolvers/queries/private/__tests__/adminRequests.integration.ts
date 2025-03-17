import type { Query } from "@td/codegen-back";
import makeClient from "../../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../../integration-tests/helper";
import gql from "graphql-tag";
import {
  AdminRequestStatus,
  AdminRequestValidationMethod
} from "@prisma/client";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../../__tests__/factories";
import { prisma } from "@td/prisma";

const ADMIN_REQUESTS = gql`
  query adminRequests($skip: Int!, $first: Int!) {
    adminRequests(skip: $skip, first: $first) {
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
          user {
            name
          }
          company {
            orgId
            name
          }
          status
          createdAt
          validationMethod
        }
      }
    }
  }
`;

describe("Query adminRequests", () => {
  afterEach(resetDatabase);

  it("user must be logged in", async () => {
    // Given

    // When
    const { query } = makeClient();
    const { errors } = await query<Pick<Query, "adminRequests">>(
      ADMIN_REQUESTS,
      {
        variables: {
          skip: 0,
          first: 10
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual("Vous n'êtes pas connecté.");
  });

  it("should return the user's requests", async () => {
    // Given
    const { user: user1, company: company1 } = await userWithCompanyFactory(
      "MEMBER"
    );
    const company2 = await companyFactory();
    const user2 = await userFactory();

    await prisma.adminRequest.create({
      data: {
        user: { connect: { id: user1.id } },
        company: { connect: { id: company1.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
      }
    });

    await prisma.adminRequest.create({
      data: {
        user: { connect: { id: user1.id } },
        company: { connect: { id: company2.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
      }
    });

    // Should not be returned because does not belong to user1
    await prisma.adminRequest.create({
      data: {
        user: { connect: { id: user2.id } },
        company: { connect: { id: company1.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
      }
    });

    // When
    const { query } = makeClient(user1);
    const { errors, data } = await query<Pick<Query, "adminRequests">>(
      ADMIN_REQUESTS,
      {
        variables: {
          skip: 0,
          first: 10
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(data.adminRequests.totalCount).toBe(2);

    expect(data.adminRequests.edges[0].node.company.orgId).toBe(company2.orgId);
    expect(data.adminRequests.edges[0].node.company.name).toBe(company2.name);
    expect(data.adminRequests.edges[0].node.user.name).toBe(user1.name);
    expect(data.adminRequests.edges[0].node.status).toBe(
      AdminRequestStatus.PENDING
    );
    expect(data.adminRequests.edges[0].node.validationMethod).toBe(
      AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
    );

    expect(data.adminRequests.edges[1].node.company.orgId).toBe(company1.orgId);
    expect(data.adminRequests.edges[1].node.company.name).toBe(company1.name);
    expect(data.adminRequests.edges[1].node.user.name).toBe(user1.name);
    expect(data.adminRequests.edges[1].node.status).toBe(
      AdminRequestStatus.PENDING
    );
    expect(data.adminRequests.edges[1].node.validationMethod).toBe(
      AdminRequestValidationMethod.SEND_MAIL
    );
  });
});
