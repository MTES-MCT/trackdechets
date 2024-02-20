import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationCreateAnonymousCompanyArgs
} from "../../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { siretify, userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const CREATE_ANONYMOUS_COMPANY = `
  mutation createAnonymousCompany($input: AnonymousCompanyInput!) {
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
  afterEach(resetDatabase);

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

  it("should prevent creating an anonymous company that already exists", async () => {
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
        message: `L'entreprise au SIRET "${validInput.siret}" est déjà connue de notre répertoire privé.`
      })
    ]);
  });
});
