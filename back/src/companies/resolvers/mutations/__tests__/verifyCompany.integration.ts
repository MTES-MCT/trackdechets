import {
  CompanyVerificationMode,
  CompanyVerificationStatus,
  UserRole
} from "@td/prisma";
import { gql } from "graphql-tag";
import { AuthType } from "../../../../auth/auth";
import { prisma } from "@td/prisma";
import {
  companyFactory,
  siretify,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { sendMail } from "../../../../mailer/mailing";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { renderMail, verificationDone } from "@td/mail";
import type { Mutation } from "@td/codegen-back";

const VERIFY_COMPANY = gql`
  mutation VerifyCompany($input: VerifyCompanyInput!) {
    verifyCompany(input: $input) {
      verificationStatus
    }
  }
`;

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

describe("mutation verifyCompany", () => {
  afterAll(resetDatabase);

  afterEach(() => {
    (sendMail as jest.Mock).mockClear();
  });

  it("should disallow unauthenticated user", async () => {
    const company = await companyFactory({
      verificationStatus: CompanyVerificationStatus.LETTER_SENT
    });
    const { mutate } = makeClient();
    const { errors } = await mutate(VERIFY_COMPANY, {
      variables: {
        input: { siret: company.siret, code: company.verificationCode }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté."
      })
    ]);
  });
  it("should disallow user authenticated through API", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN, {
      verificationStatus: CompanyVerificationStatus.LETTER_SENT
    });
    const { mutate } = makeClient({ ...user, auth: AuthType.Bearer });
    const { errors } = await mutate(VERIFY_COMPANY, {
      variables: {
        input: { siret: company.siret, code: company.verificationCode }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté."
      })
    ]);
  });
  it("should throw an exception if company does not exist", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN, {
      verificationStatus: CompanyVerificationStatus.LETTER_SENT
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate(VERIFY_COMPANY, {
      variables: {
        input: { siret: siretify(3), code: company.verificationCode }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Cet établissement n'existe pas dans Trackdéchets"
      })
    ]);
  });
  it("should throw an exception if user is not admin of the company", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.MEMBER, {
      verificationStatus: CompanyVerificationStatus.LETTER_SENT
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate(VERIFY_COMPANY, {
      variables: {
        input: {
          siret: company.siret,
          code: company.verificationCode
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Vous n'êtes pas administrateur de l'entreprise portant le siret "${company.siret}".`
      })
    ]);
  });
  it("should throw an error if verification code is invalid", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN, {
      verificationStatus: CompanyVerificationStatus.LETTER_SENT
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate(VERIFY_COMPANY, {
      variables: {
        input: {
          siret: company.siret,
          code: "00000" // invalid verification code
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Code de vérification invalide"
      })
    ]);
  });
  it("should set isVerified to `true`", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN, {
      verificationStatus: CompanyVerificationStatus.LETTER_SENT
    });
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "verifyCompany">>(
      VERIFY_COMPANY,
      {
        variables: {
          input: { siret: company.siret, code: company.verificationCode }
        }
      }
    );
    expect(data.verifyCompany.verificationStatus).toEqual(
      CompanyVerificationStatus.VERIFIED
    );
    const updatedCompany = await prisma.company.findUniqueOrThrow({
      where: { siret: company.siret! }
    });
    expect(updatedCompany.verificationStatus).toEqual(
      CompanyVerificationStatus.VERIFIED
    );
    expect(updatedCompany.verificationMode).toEqual(
      CompanyVerificationMode.LETTER
    );
    expect(updatedCompany.verifiedAt).toBeDefined();
    expect(updatedCompany.verifiedAt).not.toBeNull();

    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      renderMail(verificationDone, {
        to: [{ email: user.email, name: user.name }],
        variables: {
          company: updatedCompany as any
        }
      })
    );
  });
});
