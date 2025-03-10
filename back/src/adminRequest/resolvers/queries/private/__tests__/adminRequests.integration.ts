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
          companyOrgId
          companyName
          status
          createdAt
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

  it("should return the admin requests", async () => {
    // Given
    const { user, company: company1 } = await userWithCompanyFactory("MEMBER");
    const company2 = await companyFactory();

    await prisma.adminRequest.create({
      data: {
        company: { connect: { id: company1.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL,
        userId: user.id
      }
    });

    await prisma.adminRequest.create({
      data: {
        company: { connect: { id: company2.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL,
        userId: user.id
      }
    });

    // When
    const { query } = makeClient(user);
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

    expect(data.adminRequests.edges[0].node.companyOrgId).toBe(company2.orgId);
    expect(data.adminRequests.edges[0].node.companyName).toBe(company2.name);
    expect(data.adminRequests.edges[0].node.status).toBe(
      AdminRequestStatus.PENDING
    );

    expect(data.adminRequests.edges[1].node.companyOrgId).toBe(company1.orgId);
    expect(data.adminRequests.edges[1].node.companyName).toBe(company1.name);
    expect(data.adminRequests.edges[1].node.status).toBe(
      AdminRequestStatus.PENDING
    );
  });
});
