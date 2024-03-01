import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationCreateAnonymousCompanyArgs
} from "../../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { siretify, userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { sendMail } from "../../../../mailer/mailing";
import { anonymousCompanyCreatedEmail, renderMail } from "@td/mail";

// Mock emails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

const CREATE_ANONYMOUS_COMPANY = `
  mutation CreateAnonymousCompany($input: AnonymousCompanyInput!) {
    createAnonymousCompany(input: $input) {
      id
    }
  }
`;

const validInput = {
  address: "12 rue de la liberté",
  codeCommune: "69000",
  codeNaf: "0111Z",
  name: "Acme",
  siret: siretify(6)
};

describe("createAnonymousCompany", () => {
  afterEach(async () => {
    await resetDatabase();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it("should create an anonymous company", async () => {
    const user = await userFactory({ isAdmin: true });
    const { mutate } = makeClient(user);

    await mutate<
      Pick<Mutation, "createAnonymousCompany">,
      MutationCreateAnonymousCompanyArgs
    >(CREATE_ANONYMOUS_COMPANY, { variables: { input: validInput } });

    const anonymousCompany = await prisma.anonymousCompany.findUnique({
      where: { siret: validInput.siret }
    });
    expect(anonymousCompany).toBeTruthy();
  });

  it("should create an anonymous company using a VAT number", async () => {
    // Given
    const user = await userFactory({ isAdmin: true });
    const { mutate } = makeClient(user);
    const input = {
      ...validInput,
      vatNumber: "BE0541696005",
      siret: undefined
    };

    // When
    await mutate<
      Pick<Mutation, "createAnonymousCompany">,
      MutationCreateAnonymousCompanyArgs
    >(CREATE_ANONYMOUS_COMPANY, { variables: { input } });

    // Then
    const anonymousCompany = await prisma.anonymousCompany.findUnique({
      where: { vatNumber: input.vatNumber }
    });
    expect(anonymousCompany).toBeTruthy();
    expect(anonymousCompany?.orgId).toEqual(input.vatNumber);
  });

  it("should crash if no siret nor VAT number is given", async () => {
    // Given
    const user = await userFactory({ isAdmin: true });
    const { mutate } = makeClient(user);
    const input = {
      ...validInput,
      vatNumber: undefined,
      siret: undefined
    };

    // When
    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompany">,
      MutationCreateAnonymousCompanyArgs
    >(CREATE_ANONYMOUS_COMPANY, { variables: { input } });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "La sélection d'une entreprise par SIRET ou numéro de TVA (si l'entreprise n'est pas française) est obligatoire"
    );
  });

  it("should crash if both SIRET & VAT number are given", async () => {
    // Given
    const user = await userFactory({ isAdmin: true });
    const { mutate } = makeClient(user);
    const input = {
      ...validInput,
      vatNumber: "BE0541696005"
    };

    // When
    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompany">,
      MutationCreateAnonymousCompanyArgs
    >(CREATE_ANONYMOUS_COMPANY, { variables: { input } });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "Vous ne pouvez pas préciser un numéro de TVA ET un SIRET: les deux champs sont mutuellement exclusifs"
    );
  });

  it("should prevent non-admin from creating an anonymous company", async () => {
    const user = await userFactory({ isAdmin: false });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompany">,
      MutationCreateAnonymousCompanyArgs
    >(CREATE_ANONYMOUS_COMPANY, { variables: { input: validInput } });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas administrateur"
      })
    ]);
  });

  it("should prevent creating an anonymous company with an unknown naf code", async () => {
    const user = await userFactory({ isAdmin: true });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompany">,
      MutationCreateAnonymousCompanyArgs
    >(CREATE_ANONYMOUS_COMPANY, {
      variables: { input: { ...validInput, codeNaf: "abc" } }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le code NAF ne fait pas partie de la liste reconnue."
      })
    ]);
  });

  it("should prevent creating an anonymous company that already exists (siret)", async () => {
    const user = await userFactory({ isAdmin: true });
    const { mutate } = makeClient(user);

    await prisma.anonymousCompany.create({
      data: {
        ...validInput,
        orgId: validInput.siret,
        libelleNaf: "Libellé NAF"
      }
    });

    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompany">,
      MutationCreateAnonymousCompanyArgs
    >(CREATE_ANONYMOUS_COMPANY, {
      variables: { input: validInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `L'entreprise "${validInput.siret}" est déjà connue de notre répertoire privé.`
      })
    ]);
  });

  it("should prevent creating an anonymous company that already exists (vatNumber)", async () => {
    // Given
    const user = await userFactory({ isAdmin: true });
    const { mutate } = makeClient(user);

    const input = {
      ...validInput,
      siret: undefined,
      vatNumber: "BE0541696005"
    };

    await prisma.anonymousCompany.create({
      data: {
        ...input,
        orgId: input.vatNumber,
        libelleNaf: "Libellé NAF"
      }
    });

    // When
    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompany">,
      MutationCreateAnonymousCompanyArgs
    >(CREATE_ANONYMOUS_COMPANY, {
      variables: { input }
    });

    // Then
    expect(errors).toEqual([
      expect.objectContaining({
        message: `L'entreprise "${input.vatNumber}" est déjà connue de notre répertoire privé.`
      })
    ]);
  });

  it("should delete any associated anonymousCompanyRequest", async () => {
    // Given
    const user = await userFactory({ isAdmin: true });
    const { mutate } = makeClient(user);

    await prisma.anonymousCompanyRequest.create({
      data: {
        userId: user.id,
        address: "4 BD PASTEUR 44100 NANTES",
        codeNaf: "6202A",
        name: "ACME CORP",
        pdf: "[pdf1 in base64]",
        siret: validInput.siret,
        codeCommune: "44100"
      }
    });

    // When
    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompany">,
      MutationCreateAnonymousCompanyArgs
    >(CREATE_ANONYMOUS_COMPANY, { variables: { input: validInput } });

    // Then
    expect(errors).toBeUndefined();
    const res = await prisma.anonymousCompanyRequest.findFirst({
      where: {
        siret: validInput.siret
      }
    });
    expect(res).toBeNull();
  });

  it("if associated anonymousCompanyRequest, should send an email to user", async () => {
    // Given
    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    const user = await userFactory({ isAdmin: true });
    const { mutate } = makeClient(user);

    await prisma.anonymousCompanyRequest.create({
      data: {
        userId: user.id,
        address: "4 BD PASTEUR 44100 NANTES",
        codeNaf: "6202A",
        name: "ACME CORP",
        pdf: "[pdf1 in base64]",
        siret: validInput.siret,
        codeCommune: "44100"
      }
    });

    // When
    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompany">,
      MutationCreateAnonymousCompanyArgs
    >(CREATE_ANONYMOUS_COMPANY, { variables: { input: validInput } });

    // Then
    expect(errors).toBeUndefined();

    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      renderMail(anonymousCompanyCreatedEmail, {
        to: [{ email: user.email, name: user.name }],
        variables: { siret: validInput.siret }
      })
    );
  });

  it("if no associated anonymousCompanyRequest, should not send any email", async () => {
    // Given
    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    const user = await userFactory({ isAdmin: true });
    const { mutate } = makeClient(user);

    // When
    const { errors } = await mutate<
      Pick<Mutation, "createAnonymousCompany">,
      MutationCreateAnonymousCompanyArgs
    >(CREATE_ANONYMOUS_COMPANY, { variables: { input: validInput } });

    // Then
    expect(errors).toBeUndefined();

    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(0);
  });
});
