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

const ADMIN_REQUESTS_ADMIN = gql`
  query adminRequestsAdmin($skip: Int!, $first: Int!) {
    adminRequestsAdmin(skip: $skip, first: $first) {
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
    const { errors } = await query<Pick<Query, "adminRequestsAdmin">>(
      ADMIN_REQUESTS_ADMIN,
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

  it("user must be a Trackdéchets admin", async () => {
    // Given
    const user = await userFactory();

    // When
    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "adminRequestsAdmin">>(
      ADMIN_REQUESTS_ADMIN,
      {
        variables: {
          skip: 0,
          first: 10
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "Vous n'êtes pas autorisé à effectuer cette action."
    );
  });

  it("should return all adminRequests", async () => {
    // Given
    const { user: user1, company: company1 } = await userWithCompanyFactory(
      "MEMBER"
    );
    const company2 = await companyFactory();
    const user2 = await userFactory();
    const tdAdmin = await userFactory({ isAdmin: true });

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
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
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
    const { query } = makeClient(tdAdmin);
    const { errors, data } = await query<Pick<Query, "adminRequestsAdmin">>(
      ADMIN_REQUESTS_ADMIN,
      {
        variables: {
          skip: 0,
          first: 10
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(data.adminRequestsAdmin.totalCount).toBe(3);

    expect(data.adminRequestsAdmin.edges[0].node.company.orgId).toBe(
      company1.orgId
    );
    expect(data.adminRequestsAdmin.edges[0].node.company.name).toBe(
      company1.name
    );
    expect(data.adminRequestsAdmin.edges[0].node.user.name).toBe(user2.name);
    expect(data.adminRequestsAdmin.edges[0].node.status).toBe(
      AdminRequestStatus.PENDING
    );

    expect(data.adminRequestsAdmin.edges[1].node.company.orgId).toBe(
      company2.orgId
    );
    expect(data.adminRequestsAdmin.edges[1].node.company.name).toBe(
      company2.name
    );
    expect(data.adminRequestsAdmin.edges[1].node.user.name).toBe(user1.name);
    expect(data.adminRequestsAdmin.edges[1].node.status).toBe(
      AdminRequestStatus.PENDING
    );

    expect(data.adminRequestsAdmin.edges[2].node.company.orgId).toBe(
      company1.orgId
    );
    expect(data.adminRequestsAdmin.edges[2].node.company.name).toBe(
      company1.name
    );
    expect(data.adminRequestsAdmin.edges[2].node.user.name).toBe(user1.name);
    expect(data.adminRequestsAdmin.edges[2].node.status).toBe(
      AdminRequestStatus.PENDING
    );
  });
});
