import type { Query } from "@td/codegen-back";
import makeClient from "../../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../../integration-tests/helper";
import gql from "graphql-tag";
import { AdminRequestStatus, AdminRequestValidationMethod } from "@td/prisma";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../../__tests__/factories";
import { prisma } from "@td/prisma";

const ADMIN_REQUEST = gql`
  query adminRequests($adminRequestId: ID!) {
    adminRequest(adminRequestId: $adminRequestId) {
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
`;

describe("Query adminRequest", () => {
  afterEach(resetDatabase);

  it("user must be logged in", async () => {
    // Given

    // When
    const { query } = makeClient();
    const { errors } = await query<Pick<Query, "adminRequests">>(
      ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: "some-id"
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual("Vous n'êtes pas connecté.");
  });

  it("author can request his own request", async () => {
    // Given
    const user = await userFactory();
    const company = await companyFactory();

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: user.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
      }
    });

    // When
    const { query } = makeClient(user);
    const { errors, data } = await query<Pick<Query, "adminRequest">>(
      ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: adminRequest.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(data.adminRequest.id).toBe(adminRequest.id);
    expect(data.adminRequest.company.orgId).toBe(company.orgId);
    expect(data.adminRequest.company.name).toBe(company.name);
    expect(data.adminRequest.user.name).toBe(user.name);
    expect(data.adminRequest.status).toBe(AdminRequestStatus.PENDING);
  });

  it("any member of target company can get the request", async () => {
    // Given
    const user = await userFactory();
    const { user: companyMember, company } = await userWithCompanyFactory();

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: user.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
      }
    });

    // When
    const { query } = makeClient(companyMember);
    const { errors, data } = await query<Pick<Query, "adminRequest">>(
      ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: adminRequest.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(data.adminRequest.id).toBe(adminRequest.id);
    expect(data.adminRequest.company.orgId).toBe(company.orgId);
    expect(data.adminRequest.company.name).toBe(company.name);
    expect(data.adminRequest.user.name).toBe(user.name);
    expect(data.adminRequest.status).toBe(AdminRequestStatus.PENDING);
  });

  it("a user who is not the author of the request, nor belongs to target company, should not be able to get the request", async () => {
    // Given
    const user = await userFactory();
    const requester = await userFactory();
    const company = await companyFactory();

    const adminRequest = await prisma.adminRequest.create({
      data: {
        user: { connect: { id: user.id } },
        company: { connect: { id: company.id } },
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
      }
    });

    // When
    const { query } = makeClient(requester);
    const { errors } = await query<Pick<Query, "adminRequest">>(ADMIN_REQUEST, {
      variables: {
        adminRequestId: adminRequest.id
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "Vous n'êtes pas autorisé à effectuer cette action."
    );
  });
});
