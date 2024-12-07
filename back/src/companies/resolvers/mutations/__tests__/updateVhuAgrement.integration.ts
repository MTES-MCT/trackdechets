import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "@td/codegen-back";

describe("{ mutation { updateVhuAgrement } }", () => {
  afterEach(() => resetDatabase());

  it("should update a VHU agrement", async () => {
    const agrement = {
      agrementNumber: "agrementNumber",
      department: "07"
    };

    const createdAgrement = await prisma.vhuAgrement.create({
      data: agrement
    });
    const { user, company } = await userWithCompanyFactory("ADMIN");
    await prisma.company.update({
      data: { vhuAgrementDemolisseur: { connect: { id: createdAgrement.id } } },
      where: { id: company.id }
    });

    const update = {
      agrementNumber: "agrementNumber2",
      department: "13"
    };

    const mutation = `
      mutation {
        updateVhuAgrement(
          input: {
            id: "${createdAgrement.id}"
            agrementNumber: "${update.agrementNumber}"
            department: "${update.department}"
          }
          ) { agrementNumber, department }
        }`;
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { data } = await mutate<Pick<Mutation, "updateVhuAgrement">>(
      mutation
    );

    // check returned value
    expect(data.updateVhuAgrement).toEqual(update);

    // check record was modified in db
    const { id, ...updated } = await prisma.vhuAgrement.findUniqueOrThrow({
      where: { id: createdAgrement.id }
    });
    expect(updated.agrementNumber).toEqual(update.agrementNumber);
    expect(updated.department).toEqual(update.department);
  });
});
