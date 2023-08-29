import { CompanyVerificationStatus, UserRole } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import * as post from "../../../../common/post";
import prisma from "../../../../prisma";
import {
  siretify,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const sendVerificationCodeLetterSpy = jest.spyOn(
  post,
  "sendVerificationCodeLetter"
);
sendVerificationCodeLetterSpy.mockResolvedValueOnce(Promise.resolve());

const SEND_VERIFICATION_CODE_LETTER = gql`
  mutation SendVerificationCodeLetter(
    $input: SendVerificationCodeLetterInput!
  ) {
    sendVerificationCodeLetter(input: $input) {
      id
      verificationStatus
    }
  }
`;

describe("mutation sendVerificationCodeLetter", () => {
  afterAll(resetDatabase);

  it("should deny access to non admin users", async () => {
    const admin = await userFactory({ isAdmin: false });

    const { user: _, company } = await userWithCompanyFactory(UserRole.ADMIN, {
      verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED
    });

    const { mutate } = makeClient(admin);

    const { errors } = await mutate(SEND_VERIFICATION_CODE_LETTER, {
      variables: { input: { siret: company.siret } }
    });
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas administrateur" })
    ]);
  });

  it("should throw error if company does not exist", async () => {
    const admin = await userFactory({ isAdmin: true });

    const { mutate } = makeClient(admin);
    const { errors } = await mutate(SEND_VERIFICATION_CODE_LETTER, {
      variables: { input: { siret: siretify(3) } }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Cet établissement n'existe pas dans Trackdéchets"
      })
    ]);
  });

  it("should send a letter containing verification code and update verificationStatus", async () => {
    const { user: _, company } = await userWithCompanyFactory(UserRole.ADMIN, {
      verificationStatus: CompanyVerificationStatus.TO_BE_VERIFIED
    });
    const admin = await userFactory({ isAdmin: true });
    const { mutate } = makeClient(admin);
    await mutate(SEND_VERIFICATION_CODE_LETTER, {
      variables: { input: { siret: company.siret } }
    });
    expect(sendVerificationCodeLetterSpy).toHaveBeenCalledWith(company);
    const updatedCompany = await prisma.company.findUniqueOrThrow({
      where: { siret: company.siret! }
    });
    expect(updatedCompany.verificationStatus).toEqual(
      CompanyVerificationStatus.LETTER_SENT
    );
  });
});
