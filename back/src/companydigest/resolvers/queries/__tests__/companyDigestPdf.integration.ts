import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "../../../../generated/graphql/types";

import makeClient from "../../../../__tests__/testClient";
import { companyDigestFactory } from "../../../__tests__/factories.companydigest";
import { gql } from "graphql-tag";
import { ErrorCode } from "../../../../common/errors";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import { CompanyDigestStatus } from "@prisma/client";

const GET_COMPANY_DIGEST_PDF = gql`
  query CompanyDigestPdf($id: ID!) {
    companyDigestPdf(id: $id) {
      downloadLink
      token
    }
  }
`;

describe("Query.companyDigestpdf", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const cd = await companyDigestFactory({
      opt: { orgId: company.siret! }
    });
    const { query } = makeClient();
    const { errors } = await query<Pick<Query, "companyDigestPdf">>(
      GET_COMPANY_DIGEST_PDF,
      {
        variables: { id: cd.id }
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

    const cd = await companyDigestFactory({ opt: { orgId: company.siret! } });

    const { user } = await userWithCompanyFactory("MEMBER");
    const { query } = makeClient(user);
    const { errors } = await query<Pick<Query, "companyDigestPdf">>(
      GET_COMPANY_DIGEST_PDF,
      {
        variables: { id: cd.id }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Cette fiche établissement n'existe pas ou vous n'avez pas les droits nécessaires pour la consulter.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it.each([
    CompanyDigestStatus.INITIAL,
    CompanyDigestStatus.ERROR,
    CompanyDigestStatus.PENDING
  ])(
    "should raise an error if company digest is not PROCESSED ",
    async state => {
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const cd = await companyDigestFactory({
        opt: { orgId: company.siret!, state }
      });

      const { query } = makeClient(user);

      const { errors } = await query<Pick<Query, "companyDigestPdf">>(
        GET_COMPANY_DIGEST_PDF,
        {
          variables: { id: cd.id }
        }
      );

      expect(errors).toEqual([
        expect.objectContaining({
          message: "Cette fiche établissement n'est pas consultable.",
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ]);
    }
  );

  it("should return a token for requested id ", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const cd = await companyDigestFactory({
      opt: { orgId: company.siret!, state: CompanyDigestStatus.PROCESSED }
    });

    const { query } = makeClient(user);

    const { data } = await query<Pick<Query, "companyDigestPdf">>(
      GET_COMPANY_DIGEST_PDF,
      {
        variables: { id: cd.id }
      }
    );

    expect(data.companyDigestPdf.token).toBeTruthy();
  });
});
