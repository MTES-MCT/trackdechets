import {
  CompanyType,
  CompanyVerificationStatus,
  UserRole
} from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Query,
  QueryCompaniesForVerificationArgs
} from "../../../../generated/graphql/types";
import {
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const COMPANIES_FOR_VERIFICATION = gql`
  query CompaniesForVerification($where: CompanyForVerificationWhere) {
    companiesForVerification(where: $where) {
      totalCount
      companies {
        createdAt
        siret
        name
        verificationStatus
        admin {
          email
        }
      }
    }
  }
`;

describe("query companies", () => {
  afterEach(resetDatabase);

  it("should deny access to regular users", async () => {
    const user = await userFactory({ isAdmin: false });
    const { query } = makeClient(user);
    const { errors } = await query(COMPANIES_FOR_VERIFICATION);
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas administrateur" })
    ]);
  });

  it("should return the list of companies in Trackdechets if user is admin", async () => {
    const admin = await userFactory({ isAdmin: true });
    const { company: company1, user: user1 } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
      }
    );
    const { company: company2, user: user2 } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
      }
    );
    const { query } = makeClient(admin);
    const { data } = await query<
      Pick<Query, "companiesForVerification">,
      QueryCompaniesForVerificationArgs
    >(COMPANIES_FOR_VERIFICATION);

    expect(data.companiesForVerification.totalCount).toEqual(2);
    expect(data.companiesForVerification.companies).toEqual([
      {
        createdAt: company2.createdAt.toISOString(),
        siret: company2.siret,
        name: company2.name,
        verificationStatus: company2.verificationStatus,
        admin: { email: user2.email }
      },
      {
        createdAt: company1.createdAt.toISOString(),
        siret: company1.siret,
        name: company1.name,
        verificationStatus: company1.verificationStatus,
        admin: { email: user1.email }
      }
    ]);
  });

  it("should filter based on companyVerificationStatus", async () => {
    const admin = await userFactory({ isAdmin: true });
    const { company: _company1, user: _user1 } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED,
        companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
      }
    );
    const { company: company2, user: _user2 } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        verificationStatus: CompanyVerificationStatus.VERIFIED,
        companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
      }
    );
    const { query } = makeClient(admin);
    const { data } = await query<
      Pick<Query, "companiesForVerification">,
      QueryCompaniesForVerificationArgs
    >(COMPANIES_FOR_VERIFICATION, {
      variables: {
        where: { verificationStatus: "VERIFIED" }
      }
    });
    expect(data.companiesForVerification.totalCount).toEqual(1);
    expect(data.companiesForVerification.companies).toEqual([
      expect.objectContaining({
        createdAt: company2.createdAt.toISOString(),
        siret: company2.siret,
        name: company2.name,
        verificationStatus: company2.verificationStatus
      })
    ]);
  });
});
