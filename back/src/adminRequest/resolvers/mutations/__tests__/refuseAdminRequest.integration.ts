import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";
import {
  companyFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import {
  AdminRequestStatus,
  AdminRequestValidationMethod
} from "@prisma/client";
import { prisma } from "@td/prisma";

const REFUSE_ADMIN_REQUEST = gql`
  mutation refuseAdminRequest($adminRequestId: ID!) {
    refuseAdminRequest(adminRequestId: $adminRequestId) {
      id
      company {
        orgId
        name
      }
      status
      createdAt
    }
  }
`;

describe("Mutation refuseAdminRequest", () => {
  afterEach(resetDatabase);

  it("user must be logged in", async () => {
    // Given

    // When
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "refuseAdminRequest">>(
      REFUSE_ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: "someId"
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual("Vous n'êtes pas connecté.");
  });

  it("should throw if request does not exist", async () => {
    // Given
    const user = await userFactory();

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "refuseAdminRequest">>(
      REFUSE_ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: "clsioob1g000lk6jymb1ma4c2"
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual("La demande n'existe pas.");
  });

  it("should throw if user does not belong to company", async () => {
    // Given
    const company = await companyFactory();
    const requestAuthor = await userFactory();
    const user = await userFactory();

    const adminRequest = await prisma.adminRequest.create({
      data: {
        company: { connect: { id: company.id } },
        userId: requestAuthor.id,
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "refuseAdminRequest">>(
      REFUSE_ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: adminRequest.id
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "Vous n'êtes pas autorisé à effectuer cette action."
    );
  });

  it("should throw if request has already been accepted", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory();
    const requestAuthor = await userFactory();

    const adminRequest = await prisma.adminRequest.create({
      data: {
        company: { connect: { id: company.id } },
        userId: requestAuthor.id,
        status: AdminRequestStatus.ACCEPTED,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "refuseAdminRequest">>(
      REFUSE_ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: adminRequest.id
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      `La demande a déjà été acceptée et n'est plus modifiable.`
    );
  });

  it("should refuse pending request", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory();
    const requestAuthor = await userFactory();

    const adminRequest = await prisma.adminRequest.create({
      data: {
        company: { connect: { id: company.id } },
        userId: requestAuthor.id,
        status: AdminRequestStatus.PENDING,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "refuseAdminRequest">>(
      REFUSE_ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: adminRequest.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(data.refuseAdminRequest.status).toBe(AdminRequestStatus.REFUSED);

    const updatedAdminRequest = await prisma.adminRequest.findUniqueOrThrow({
      where: { id: adminRequest.id }
    });

    expect(updatedAdminRequest.status).toBe(AdminRequestStatus.REFUSED);
  });

  it("should not throw if request has already been refused", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory();
    const requestAuthor = await userFactory();

    const adminRequest = await prisma.adminRequest.create({
      data: {
        company: { connect: { id: company.id } },
        userId: requestAuthor.id,
        status: AdminRequestStatus.REFUSED,
        validationMethod: AdminRequestValidationMethod.SEND_MAIL
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "refuseAdminRequest">>(
      REFUSE_ADMIN_REQUEST,
      {
        variables: {
          adminRequestId: adminRequest.id
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    expect(data.refuseAdminRequest.status).toBe(AdminRequestStatus.REFUSED);

    const updatedAdminRequest = await prisma.adminRequest.findUniqueOrThrow({
      where: { id: adminRequest.id }
    });

    expect(updatedAdminRequest.status).toBe(AdminRequestStatus.REFUSED);
  });
});
