import { resetDatabase } from "../../../../../integration-tests/helper";
import { Mutation } from "@td/codegen-back";

import makeClient from "../../../../__tests__/testClient";

import { gql } from "graphql-tag";
import { ErrorCode } from "../../../../common/errors";
import { userWithCompanyFactory } from "../../../../__tests__/factories";

export const CREATE_COMPANY_DIGEST = gql`
  mutation CreateCompanyDigest($input: CompanyDigestCreateInput!) {
    createCompanyDigest(input: $input) {
      id
      createdAt
      updatedAt
      year
      orgId
      distantId
      state
    }
  }
`;

describe("Mutation.createCompanyDigest", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient();
    const { errors } = await mutate<Pick<Mutation, "createCompanyDigest">>(
      CREATE_COMPANY_DIGEST,
      {
        variables: {
          input: { orgId: company.siret, year: new Date().getFullYear() }
        }
      }
    );
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should raise an error if requested siret does not belong to user", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");

    const { user } = await userWithCompanyFactory("MEMBER");
    const { mutate } = makeClient(user);
    const { errors } = await mutate<Pick<Mutation, "createCompanyDigest">>(
      CREATE_COMPANY_DIGEST,
      {
        variables: {
          input: { orgId: company.siret, year: new Date().getFullYear() }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez générer une fiche établissement que pour les établissements auxquels vous appartenez.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should raise an error if year is too old", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const { mutate } = makeClient(user);
    const year = new Date().getFullYear() - 2;
    const { errors } = await mutate<Pick<Mutation, "createCompanyDigest">>(
      CREATE_COMPANY_DIGEST,
      {
        variables: {
          input: { orgId: company.siret, year: year }
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez générer une fiche établissement que pour l'année en cours et l'année précédente.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should create a companyDigest for current year", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const year = new Date().getFullYear();

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createCompanyDigest">>(
      CREATE_COMPANY_DIGEST,
      {
        variables: {
          input: { orgId: company.siret, year: year }
        }
      }
    );

    expect(data.createCompanyDigest.year).toEqual(year);
    expect(data.createCompanyDigest.orgId).toEqual(company.siret);
  });

  it("should create a companyDigest for last year", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const year = new Date().getFullYear() - 1;

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "createCompanyDigest">>(
      CREATE_COMPANY_DIGEST,
      {
        variables: {
          input: { orgId: company.siret, year: year }
        }
      }
    );

    expect(data.createCompanyDigest.year).toEqual(year);
    expect(data.createCompanyDigest.orgId).toEqual(company.siret);
  });
});
