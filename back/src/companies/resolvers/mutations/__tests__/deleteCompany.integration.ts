import { UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import type { Mutation, MutationDeleteCompanyArgs } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const DELETE_COMPANY = `
  mutation DeleteCompany($id: ID!) {
    deleteCompany(id: $id) {
      id
    }
  }
`;

describe("deleteCompany", () => {
  afterEach(resetDatabase);

  it("should delete a company", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);

    await mutate<Pick<Mutation, "deleteCompany">, MutationDeleteCompanyArgs>(
      DELETE_COMPANY,
      {
        variables: { id: company.id }
      }
    );

    const deletedCompany = await prisma.company.findUnique({
      where: { id: company.id }
    });
    expect(deletedCompany).toBeNull();
  });

  it("should prevent non admin user from deleting a company", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.MEMBER);
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "deleteCompany">,
      MutationDeleteCompanyArgs
    >(DELETE_COMPANY, {
      variables: { id: company.id }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Vous devez être administrateur d'un établissement pour pouvoir le supprimer`
      })
    ]);
  });
});
