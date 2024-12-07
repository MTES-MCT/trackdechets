import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "@td/codegen-back";

import makeClient from "../../../../__tests__/testClient";
import { companyDigestFactory } from "../../../__tests__/factories.companydigest";
import { gql } from "graphql-tag";
import { ErrorCode } from "../../../../common/errors";
import { userWithCompanyFactory } from "../../../../__tests__/factories";

const GET_COMPANY_DIGEST = gql`
  query companyDigests($orgId: String!) {
    companyDigests(orgId: $orgId) {
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

describe("Query.companyDigests", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const { query } = makeClient();
    const { errors } = await query<Pick<Query, "companyDigests">>(
      GET_COMPANY_DIGEST,
      {
        variables: { orgId: company.siret }
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

    await companyDigestFactory({ opt: { orgId: company.siret! } });

    const { user } = await userWithCompanyFactory("MEMBER");
    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "companyDigests">>(
      GET_COMPANY_DIGEST,
      {
        variables: { orgId: company.siret }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez requêter un établissement dont vous n'êtes pas membre.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should return the last companyDigest of each year (year and year-1)", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const cd1 = await companyDigestFactory({ opt: { orgId: company.siret! } });
    const cd2 = await companyDigestFactory({
      opt: { orgId: company.siret!, year: lastYear }
    });
    // older companyDigests
    await companyDigestFactory({
      opt: { orgId: company.siret!, createdAt: yesterday }
    });
    await companyDigestFactory({
      opt: { orgId: company.siret!, year: lastYear, createdAt: yesterday }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "companyDigests">>(
      GET_COMPANY_DIGEST,
      {
        variables: { orgId: company.siret }
      }
    );

    expect(data.companyDigests.length).toEqual(2);
    expect(data.companyDigests.map(c => c?.id).sort()).toEqual(
      [cd1.id, cd2.id].sort()
    );
  });

  it("should return the last companyDigest of each year (year and year-1)ss", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const cd1 = await companyDigestFactory({
      opt: { orgId: company.siret! }
    });

    // older companyDigest
    await companyDigestFactory({
      opt: { orgId: company.siret!, createdAt: yesterday }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "companyDigests">>(
      GET_COMPANY_DIGEST,
      {
        variables: { orgId: company.siret }
      }
    );

    expect(data.companyDigests.length).toEqual(1);
    expect(data.companyDigests.map(c => c?.id)).toEqual([cd1.id]);
  });
});
