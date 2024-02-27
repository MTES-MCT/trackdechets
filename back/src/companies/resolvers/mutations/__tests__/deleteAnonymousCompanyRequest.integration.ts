import { prisma } from "../../../../../../libs/back/prisma/src";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  Mutation,
  MutationDeleteAnonymousCompanyRequestArgs
} from "../../../../generated/graphql/types";

const DELETE_ANONYMOUS_COMPANY_REQUEST = `
  mutation DeleteAnonymousCompanyRequest($siret: String!) {
    deleteAnonymousCompanyRequest(siret: $siret)
  }
`;

describe("mutation deleteAnonymousCompanyRequest", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should prevent non-admin from deleting an anonymous company", async () => {
    // Given
    const user = await userFactory({ isAdmin: false });
    const { mutate } = makeClient(user);

    // When
    const { errors } = await mutate<
      Pick<Mutation, "deleteAnonymousCompanyRequest">,
      MutationDeleteAnonymousCompanyRequestArgs
    >(DELETE_ANONYMOUS_COMPANY_REQUEST, {
      variables: { siret: "98254982600013" }
    });

    // Then
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas administrateur"
      })
    ]);
  });

  it("should throw if invalid SIRET", async () => {
    // Given
    const user = await userFactory({ isAdmin: true });
    const { mutate } = makeClient(user);

    // When
    const { errors } = await mutate<
      Pick<Mutation, "deleteAnonymousCompanyRequest">
    >(DELETE_ANONYMOUS_COMPANY_REQUEST, {
      variables: {
        siret: "not a siret"
      }
    });

    // Then
    expect(errors).toEqual([
      expect.objectContaining({
        message: "siret: not a siret n'est pas un numéro de SIRET valide"
      })
    ]);
  });

  it("should throw if empty SIRET", async () => {
    // Given
    const user = await userFactory({ isAdmin: true });
    const { mutate } = makeClient(user);

    // When
    const { errors } = await mutate<
      Pick<Mutation, "deleteAnonymousCompanyRequest">
    >(DELETE_ANONYMOUS_COMPANY_REQUEST, {
      variables: {
        siret: ""
      }
    });

    // Then
    expect(errors).toEqual([
      expect.objectContaining({
        message: "siret est un champ requis et doit avoir une valeur"
      })
    ]);
  });

  it("should delete the AnonymousCompanyRequest", async () => {
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
        siret: "98254982600013",
        codeCommune: "44100"
      }
    });

    // When
    const { errors } = await mutate<
      Pick<Mutation, "deleteAnonymousCompanyRequest">
    >(DELETE_ANONYMOUS_COMPANY_REQUEST, {
      variables: {
        siret: "98254982600013"
      }
    });

    // Then
    expect(errors).toBeUndefined();
    const request = await prisma.anonymousCompanyRequest.findFirst({
      where: { siret: "98254982600013" }
    });
    expect(request).toBeNull();
  });

  it("should not crash if request does not exist", async () => {
    // Given
    const user = await userFactory({ isAdmin: true });
    const { mutate } = makeClient(user);

    // When
    const { errors } = await mutate<
      Pick<Mutation, "deleteAnonymousCompanyRequest">
    >(DELETE_ANONYMOUS_COMPANY_REQUEST, {
      variables: {
        siret: "98254982600013"
      }
    });

    // Then
    expect(errors).toBeUndefined();
  });
});
