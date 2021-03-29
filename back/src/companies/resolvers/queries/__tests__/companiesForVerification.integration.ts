import { CompanyVerificationStatus, UserRole } from ".prisma/client";
import { gql } from "apollo-server-express";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { associateUserToCompany } from "../../../../users/database";
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
    const { company: company1, user: _user1 } = await userWithCompanyFactory(
      UserRole.ADMIN
    );
    const { company: company2, user: _user2 } = await userWithCompanyFactory(
      UserRole.ADMIN
    );
    const { query } = makeClient(admin);
    const { data } = await query(COMPANIES_FOR_VERIFICATION);
    expect(data.companiesForVerification.totalCount).toEqual(2);
    expect(data.companiesForVerification.companies).toEqual([
      expect.objectContaining({
        createdAt: company1.createdAt.toISOString(),
        siret: company1.siret,
        name: company1.name,
        verificationStatus: company1.verificationStatus
      }),
      expect.objectContaining({
        createdAt: company2.createdAt.toISOString(),
        siret: company2.siret,
        name: company2.name,
        verificationStatus: company2.verificationStatus
      })
    ]);
  });

  it("should filter based on companyVerificationStatus", async () => {
    const admin = await userFactory({ isAdmin: true });
    const { company: _company1, user: _user1 } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED
      }
    );
    const { company: company2, user: _user2 } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        verificationStatus: CompanyVerificationStatus.VERIFIED
      }
    );
    const { query } = makeClient(admin);
    const { data } = await query(COMPANIES_FOR_VERIFICATION, {
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

  it("should return first admin if several admins joined", async () => {
    const admin = await userFactory({ isAdmin: true });

    // create company with first admin
    const {
      company: company,
      user: companyAdmin1
    } = await userWithCompanyFactory(UserRole.ADMIN);

    // add a second admin
    const companyAdmin2 = await userFactory();
    await associateUserToCompany(
      companyAdmin2.id,
      company.siret,
      UserRole.ADMIN
    );

    const { query } = makeClient(admin);
    const { data } = await query(COMPANIES_FOR_VERIFICATION);
    expect(data.companiesForVerification.totalCount).toEqual(1);
    expect(data.companiesForVerification.companies).toEqual([
      expect.objectContaining({
        createdAt: company.createdAt.toISOString(),
        siret: company.siret,
        name: company.name,
        verificationStatus: company.verificationStatus,
        admin: {
          email: companyAdmin1.email
        }
      })
    ]);
  });
});
