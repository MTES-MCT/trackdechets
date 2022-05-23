import {
  CompanyVerificationMode,
  CompanyVerificationStatus,
  UserRole
} from "@prisma/client";
import { gql } from "apollo-server-express";
import { AuthType } from "../../../../auth";
import prisma from "../../../../prisma";
import {
  companyFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import * as mailsHelper from "../../../../mailer/mailing";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { renderMail } from "../../../../mailer/templates/renderers";
import { verificationDone } from "../../../../mailer/templates";
import { Mutation } from "@trackdechets/codegen/src/back.gen";

const VERIFY_COMPANY = gql`
  mutation VerifyCompany($input: VerifyCompanyInput!) {
    verifyCompany(input: $input) {
      verificationStatus
    }
  }
`;

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

describe("mutation verifyCompany", () => {
  afterAll(resetDatabase);

  afterEach(() => {
    sendMailSpy.mockClear();
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
        input: { siret: "11111111111111", code: company.verificationCode }
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
    const updatedCompany = await prisma.company.findUnique({
      where: { siret: company.siret }
    });
    expect(updatedCompany.verificationStatus).toEqual(
      CompanyVerificationStatus.VERIFIED
    );
    expect(updatedCompany.verificationMode).toEqual(
      CompanyVerificationMode.LETTER
    );
    expect(updatedCompany.verifiedAt).toBeDefined();
    expect(updatedCompany.verifiedAt).not.toBeNull();

    expect(sendMailSpy).toHaveBeenCalledWith(
      renderMail(verificationDone, {
        to: [{ email: user.email, name: user.name }],
        variables: { company: updatedCompany }
      })
    );
  });
});
