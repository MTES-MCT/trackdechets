import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "@td/codegen-back";

describe("{ mutation { deleteVhuAgrement } }", () => {
  afterEach(() => resetDatabase());

  it("should delete a VHU agrement", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const agrement = {
      agrementNumber: "agrementNumber",
      department: "07"
    };
    const createdAgrement = await prisma.vhuAgrement.create({ data: agrement });

    await prisma.company.update({
      data: { vhuAgrementDemolisseur: { connect: { id: createdAgrement.id } } },
      where: { id: company.id }
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const mutation = `
      mutation {
        deleteVhuAgrement(
          input: {
            id: "${createdAgrement.id}"
          }
        ){
          id
        }
      }
    `;

    const { data } = await mutate<Pick<Mutation, "deleteVhuAgrement">>(
      mutation
    );
    expect(data.deleteVhuAgrement.id).toEqual(createdAgrement.id);

    expect(await prisma.vhuAgrement.count()).toEqual(0);
  });
});
