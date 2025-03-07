import gql from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";
import {
  siretify,
  userFactory,
  userInCompany,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import { AdminRequestValidationMethod } from "@prisma/client";
import { prisma } from "@td/prisma";

const CREATE_ADMIN_REQUEST = gql`
  mutation createAdminRequest($input: CreateAdminRequestInput!) {
    createAdminRequest(input: $input) {
      id
    }
  }
`;

describe("Mutation createAdminRequest", () => {
  afterEach(resetDatabase);

  it("user must be logged in", async () => {
    // Given

    // When
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: "orgId"
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual("Vous n'êtes pas connecté.");
  });

  it("should throw error if target company does not exist", async () => {
    // Given
    const user = await userFactory();

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: siretify(1),
            validationMethod:
              AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "L'entreprise ciblée n'existe pas dans Trackdéchets."
    );
  });

  it("should throw error if user is already ADMIN of target company", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("ADMIN");

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "Vous êtes déjà administrateur de cette entreprise."
    );
  });

  it("should throw error if collaborator email does not exist", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
            collaboratorEmail: "non.existing@mail.com"
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual("Le collaborateur ciblé n'existe pas.");
  });

  it("should throw error if collaborator does not belong to target company", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const collaborator = await userFactory({ email: "collaborator@mail.com" });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
            collaboratorEmail: collaborator.email
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "Le collaborateur ne fait pas partie de l'entreprise ciblée."
    );
  });

  it("should throw if requesting validation by collaborator email but providing no collborator email", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL
          }
        }
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "L'adresse email d'un collaborateur est requise pour cette méthode de validation."
    );
  });

  it("should create an admin request", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const collaborator = await userInCompany("MEMBER", company.id, {
      email: "collaborator@mail.com"
    });

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "createAdminRequest">>(
      CREATE_ADMIN_REQUEST,
      {
        variables: {
          input: {
            companyOrgId: company.orgId,
            validationMethod:
              AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
            collaboratorEmail: collaborator.email
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();

    const companyAdminRequest = await prisma.adminRequest.findFirstOrThrow({
      where: {
        id: data.createAdminRequest.id
      }
    });

    expect(companyAdminRequest.userId).toEqual(user.id);
    expect(companyAdminRequest.companyId).toEqual(company.id);
    expect(companyAdminRequest.collaboratorId).toEqual(collaborator.id);
    expect(companyAdminRequest.validationMethod).toEqual(
      AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL
    );
  });
});
