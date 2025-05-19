import { CompanyVerificationStatus, UserRole } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  userFactory,
  userWithCompanyFactory,
  adminFactory
} from "../../../../__tests__/factories";
import type { Mutation } from "@td/codegen-back";
import makeClient from "../../../../__tests__/testClient";

const STANDBY_COMPANY_BY_ADMIN = gql`
  mutation StandbyCompanyByAdmin($input: StandbyCompanyByAdminInput!) {
    standbyCompanyByAdmin(input: $input) {
      id
      verificationStatus
      verificationComment
      verificationMode
    }
  }
`;

describe("mutation standbyCompanyByAdmin", () => {
  afterAll(resetDatabase);

  it("should deny access to non admin users", async () => {
    // Given
    const admin = await userFactory({ isAdmin: false });

    const { user: _, company } = await userWithCompanyFactory(UserRole.ADMIN, {
      verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED
    });

    // When
    const { mutate } = makeClient(admin);
    const { errors } = await mutate(STANDBY_COMPANY_BY_ADMIN, {
      variables: {
        input: {
          orgId: company.orgId,
          standby: true
        }
      }
    });

    // Then
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas administrateur" })
    ]);
  });

  it("should put the company in standby", async () => {
    // Given
    const admin = await adminFactory();

    const { user: _, company } = await userWithCompanyFactory(UserRole.ADMIN, {
      verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED
    });

    // When
    const { mutate } = makeClient(admin);
    const { data, errors } = await mutate<
      Pick<Mutation, "standbyCompanyByAdmin">
    >(STANDBY_COMPANY_BY_ADMIN, {
      variables: {
        input: {
          orgId: company.orgId,
          standby: true
        }
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.standbyCompanyByAdmin.verificationStatus).toEqual("STANDBY");
  });

  it("should get the company out of standby", async () => {
    // Given
    const admin = await adminFactory();

    const { user: _, company } = await userWithCompanyFactory(UserRole.ADMIN, {
      verificationStatus: CompanyVerificationStatus.STANDBY
    });

    // When
    const { mutate } = makeClient(admin);
    const { data, errors } = await mutate<
      Pick<Mutation, "standbyCompanyByAdmin">
    >(STANDBY_COMPANY_BY_ADMIN, {
      variables: {
        input: {
          orgId: company.orgId,
          standby: false
        }
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.standbyCompanyByAdmin.verificationStatus).toEqual(
      "TO_BE_VERIFIED"
    );
  });
});
