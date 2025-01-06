import { resetDatabase } from "../../../../../integration-tests/helper";
import type {
  Mutation,
  MutationToggleDormantCompanyArgs
} from "@td/codegen-back";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { UserRole } from "@prisma/client";
import { prisma } from "@td/prisma";

const TOGGLE_DORMANT_COMPANY = `
  mutation ToggleDormantCompany($id: ID!) {
    toggleDormantCompany(id: $id)
  }
`;

describe("toggleDormantCompany", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should throw an error if user is not admin of the company", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.MEMBER);
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "toggleDormantCompany">,
      MutationToggleDormantCompanyArgs
    >(TOGGLE_DORMANT_COMPANY, {
      variables: { id: company.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Vous n'êtes pas administrateur de l'entreprise portant le siret "${company.siret}".`
      })
    ]);
  });

  it("should toggle dormant company status", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);

    const { data } = await mutate<
      Pick<Mutation, "toggleDormantCompany">,
      MutationToggleDormantCompanyArgs
    >(TOGGLE_DORMANT_COMPANY, {
      variables: { id: company.id }
    });

    expect(data.toggleDormantCompany).toBe(true);
    const updatedCompany = await prisma.company.findUniqueOrThrow({
      where: { id: company.id }
    });
    expect(updatedCompany.isDormantSince).not.toBeNull();
  });
});
