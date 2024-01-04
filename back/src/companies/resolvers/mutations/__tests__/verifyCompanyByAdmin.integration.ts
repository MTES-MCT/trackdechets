import {
  CompanyVerificationMode,
  CompanyVerificationStatus,
  UserRole
} from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import {
  siretify,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const VERIFY_COMPANY_BY_ADMIN = gql`
  mutation VerifyCompanyByAdmin($input: VerifyCompanyByAdminInput!) {
    verifyCompanyByAdmin(input: $input) {
      verificationStatus
      verifiedAt
      verificationComment
      verificationMode
    }
  }
`;

describe("mutation verifyCompanyByAdmin", () => {
  afterAll(resetDatabase);

  it("should deny access to non admin users", async () => {
    const admin = await userFactory({ isAdmin: false });

    const { user: _, company } = await userWithCompanyFactory(UserRole.ADMIN, {
      verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED
    });

    const { mutate } = makeClient(admin);

    const { errors } = await mutate(VERIFY_COMPANY_BY_ADMIN, {
      variables: {
        input: {
          siret: company.siret
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas administrateur" })
    ]);
  });

  it("should throw error if company does not exist", async () => {
    const admin = await userFactory({ isAdmin: true });

    const { mutate } = makeClient(admin);

    const { errors } = await mutate(VERIFY_COMPANY_BY_ADMIN, {
      variables: {
        input: {
          siret: siretify(5)
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Cet établissement n'existe pas dans Trackdéchets"
      })
    ]);
  });

  it("should verify company, set verification mode and verificationComment", async () => {
    const admin = await userFactory({ isAdmin: true });

    const { user: _, company } = await userWithCompanyFactory(UserRole.ADMIN, {
      verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED
    });

    const { mutate } = makeClient(admin);

    const verificationComment = "The admin is the director of the company";

    await mutate(VERIFY_COMPANY_BY_ADMIN, {
      variables: {
        input: {
          siret: company.siret,
          verificationComment
        }
      }
    });

    const verifiedCompany = await prisma.company.findUniqueOrThrow({
      where: { siret: company.siret! }
    });

    expect(verifiedCompany.verificationStatus).toEqual(
      CompanyVerificationStatus.VERIFIED
    );
    expect(verifiedCompany.verificationMode).toEqual(
      CompanyVerificationMode.MANUAL
    );
    expect(verifiedCompany.verificationComment).toEqual(verificationComment);
    expect(verifiedCompany.verifiedAt).not.toBeNull();
  });

  it("should verify a foreign company, set verification mode and verificationComment", async () => {
    const admin = await userFactory({ isAdmin: true });

    const { user: _, company } = await userWithCompanyFactory(UserRole.ADMIN, {
      verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED,
      siret: null,
      vatNumber: "BE0541696002"
    });

    const { mutate } = makeClient(admin);

    const verificationComment = "The admin is the director of the company";

    await mutate(VERIFY_COMPANY_BY_ADMIN, {
      variables: {
        input: {
          siret: company.orgId,
          verificationComment
        }
      }
    });

    const verifiedCompany = await prisma.company.findUniqueOrThrow({
      where: { orgId: company.orgId }
    });

    expect(verifiedCompany.verificationStatus).toEqual(
      CompanyVerificationStatus.VERIFIED
    );
    expect(verifiedCompany.verificationMode).toEqual(
      CompanyVerificationMode.MANUAL
    );
    expect(verifiedCompany.verificationComment).toEqual(verificationComment);
    expect(verifiedCompany.verifiedAt).not.toBeNull();
  });
});
