import { prisma } from "@td/prisma";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Mutation } from "../../../../generated/graphql/types";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { sendMail } from "../../../../mailer/mailing";

import pdfParser from "pdf-parse";
import {
  METADATA,
  INFO,
  EXTRACTED_STRINGS
} from "./createAnonymousCompanyRequest.helpers.test";
import { renderMail, createAnonymousCompanyRequestEmail } from "@td/mail";
import { getCodeCommune } from "../../../geo/getCodeCommune";

jest.mock("pdf-parse", () => jest.fn());

// Mock emails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

// Mock getCodeCommune
jest.mock("../../../geo/getCodeCommune");

const CREATE_ANONYMOUS_COMPANY_REQUEST = gql`
  mutation CreationAnonymousCompanyRequest($pdf: String!) {
    createAnonymousCompanyRequest(pdf: $pdf)
  }
`;

describe("mutation createAnonymousCompanyRequest", () => {
  afterEach(async () => {
    await resetDatabase();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it("should create the AnonymousCompanyRequest", async () => {
    // Given
    const user = await userFactory();
    const { mutate } = makeClient(user);

    pdfParser.mockImplementation(
      () =>
        new Promise(res =>
          res({
            metadata: { _metadata: METADATA },
            info: INFO,
            text: EXTRACTED_STRINGS.join("\n")
          })
        )
    );

    // When
    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompanyRequest">
    >(CREATE_ANONYMOUS_COMPANY_REQUEST, {
      variables: {
        pdf: "dGVzdAo="
      }
    });

    // Then
    expect(errors).toBeUndefined();

    const anonymousCompanyRequest =
      await prisma.anonymousCompanyRequest.findFirst({
        where: {
          siret: "98254982600013"
        }
      });

    expect(anonymousCompanyRequest).not.toBeUndefined();
    expect(anonymousCompanyRequest).toMatchObject({
      userId: user.id,
      address: "4 BD PASTEUR 44100 NANTES",
      codeNaf: "6202A",
      name: "ACME CORP",
      pdf: "dGVzdAo=",
      siret: "98254982600013"
    });
  });

  it("should call getCodeCommune and persist returned value", async () => {
    // Given
    const user = await userFactory();
    const { mutate } = makeClient(user);

    (getCodeCommune as jest.Mock).mockImplementation((address: string) => {
      if (address === "4 BD PASTEUR 44100 NANTES")
        return Promise.resolve("44109");
      return Promise.resolve();
    });

    pdfParser.mockImplementation(
      () =>
        new Promise(res =>
          res({
            metadata: { _metadata: METADATA },
            info: INFO,
            text: EXTRACTED_STRINGS.join("\n")
          })
        )
    );

    // When
    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompanyRequest">
    >(CREATE_ANONYMOUS_COMPANY_REQUEST, {
      variables: {
        pdf: "dGVzdAo="
      }
    });

    // Then
    expect(errors).toBeUndefined();

    const anonymousCompanyRequest =
      await prisma.anonymousCompanyRequest.findFirst({
        where: {
          siret: "98254982600013"
        }
      });

    expect(anonymousCompanyRequest).not.toBeUndefined();
    expect(anonymousCompanyRequest?.codeCommune).toEqual("44109");
    expect(getCodeCommune).toBeCalledTimes(1);
    expect(getCodeCommune).toBeCalledWith("4 BD PASTEUR 44100 NANTES");
  });

  it("if getCodeCommune doesn't return anything, should persist null", async () => {
    // Given
    const user = await userFactory();
    const { mutate } = makeClient(user);

    pdfParser.mockImplementation(
      () =>
        new Promise(res =>
          res({
            metadata: { _metadata: METADATA },
            info: INFO,
            text: EXTRACTED_STRINGS.join("\n")
          })
        )
    );

    // When
    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompanyRequest">
    >(CREATE_ANONYMOUS_COMPANY_REQUEST, {
      variables: {
        pdf: "dGVzdAo="
      }
    });

    // Then
    expect(errors).toBeUndefined();

    const anonymousCompanyRequest =
      await prisma.anonymousCompanyRequest.findFirst({
        where: {
          siret: "98254982600013"
        }
      });

    expect(anonymousCompanyRequest).not.toBeUndefined();
    expect(anonymousCompanyRequest?.codeCommune).toEqual(null);
    expect(getCodeCommune).toBeCalledTimes(1);
    expect(getCodeCommune).toBeCalledWith("4 BD PASTEUR 44100 NANTES");
  });

  it("should send an email to the user", async () => {
    // Given
    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    const user = await userFactory();
    const { mutate } = makeClient(user);

    pdfParser.mockImplementation(
      () =>
        new Promise(res =>
          res({
            metadata: { _metadata: METADATA },
            info: INFO,
            text: EXTRACTED_STRINGS.join("\n")
          })
        )
    );

    // When
    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompanyRequest">
    >(CREATE_ANONYMOUS_COMPANY_REQUEST, {
      variables: {
        pdf: "dGVzdAo="
      }
    });

    // Then
    expect(errors).toBeUndefined();

    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      renderMail(createAnonymousCompanyRequestEmail, {
        to: [{ email: user.email, name: user.name }],
        variables: { siret: "98254982600013" }
      })
    );
  });

  it("should fail because pdf is not base64", async () => {
    // Given
    const user = await userFactory();
    const { mutate } = makeClient(user);

    // When
    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompanyRequest">
    >(CREATE_ANONYMOUS_COMPANY_REQUEST, {
      variables: {
        pdf: "not base64"
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual("PDF non valide");
  });

  it("should fail because pdf is invalid", async () => {
    // Given
    const user = await userFactory();
    const { mutate } = makeClient(user);

    pdfParser.mockImplementation(
      () =>
        new Promise(res =>
          res({
            metadata: { _metadata: METADATA },
            text: EXTRACTED_STRINGS.join("\n")
          })
        )
    );

    // When
    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompanyRequest">
    >(CREATE_ANONYMOUS_COMPANY_REQUEST, {
      variables: {
        pdf: "dGVzdAo="
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual("PDF non valide");
  });

  it("should fail because anonymous company already exists", async () => {
    // Given
    const user = await userFactory();
    const { mutate } = makeClient(user);

    pdfParser.mockImplementation(
      () =>
        new Promise(res =>
          res({
            metadata: { _metadata: METADATA },
            info: INFO,
            text: EXTRACTED_STRINGS.join("\n")
          })
        )
    );

    await prisma.anonymousCompany.create({
      data: {
        orgId: "98254982600013",
        address: "4 BD PASTEUR 44100 NANTES",
        codeNaf: "6202A",
        name: "ACME CORP",
        siret: "98254982600013",
        libelleNaf: "Informatique",
        codeCommune: "44109"
      }
    });

    // When
    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompanyRequest">
    >(CREATE_ANONYMOUS_COMPANY_REQUEST, {
      variables: {
        pdf: "dGVzdAo="
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "L'entreprise avec le SIRET 98254982600013 existe déjà"
    );
  });

  it("should fail because company already exists", async () => {
    // Given
    const user = await userFactory();
    const { mutate } = makeClient(user);

    pdfParser.mockImplementation(
      () =>
        new Promise(res =>
          res({
            metadata: { _metadata: METADATA },
            info: INFO,
            text: EXTRACTED_STRINGS.join("\n")
          })
        )
    );

    await prisma.company.create({
      data: {
        orgId: "98254982600013",
        address: "4 BD PASTEUR 44100 NANTES",
        codeNaf: "6202A",
        name: "ACME CORP",
        siret: "98254982600013",
        securityCode: 4561,
        verificationCode: "4561"
      }
    });

    // When
    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompanyRequest">
    >(CREATE_ANONYMOUS_COMPANY_REQUEST, {
      variables: {
        pdf: "dGVzdAo="
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "L'entreprise avec le SIRET 98254982600013 existe déjà"
    );
  });

  it("should fail because anonymous company request already exists", async () => {
    // Given
    const user = await userFactory();
    const { mutate } = makeClient(user);

    pdfParser.mockImplementation(
      () =>
        new Promise(res =>
          res({
            metadata: { _metadata: METADATA },
            info: INFO,
            text: EXTRACTED_STRINGS.join("\n")
          })
        )
    );

    await prisma.anonymousCompanyRequest.create({
      data: {
        address: "4 BD PASTEUR 44100 NANTES",
        codeNaf: "6202A",
        name: "ACME CORP",
        siret: "98254982600013",
        pdf: "dGVzdAo=",
        codeCommune: "44109",
        userId: user.id
      }
    });

    // When
    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompanyRequest">
    >(CREATE_ANONYMOUS_COMPANY_REQUEST, {
      variables: {
        pdf: "dGVzdAo="
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toEqual(
      "Une demande pour l'entreprise 98254982600013 est déjà en cours"
    );
  });
});
