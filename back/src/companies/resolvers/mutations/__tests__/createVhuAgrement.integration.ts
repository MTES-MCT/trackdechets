import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";

describe("{ mutation { createVhuAgrement } }", () => {
  afterEach(() => resetDatabase());

  it("should create a VHU agrement", async () => {
    const receipt = {
      agrementNumber: "agrementNumber",
      department: "07"
    };

    const user = await userFactory();

    const mutation = `
      mutation {
        createVhuAgrement(
          input: {
            agrementNumber: "${receipt.agrementNumber}"
            department: "${receipt.department}"
          }
          ) { agrementNumber, department }
        }`;
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { data } = await mutate<Pick<Mutation, "createVhuAgrement">>(
      mutation
    );

    expect(await prisma.vhuAgrement.count()).toEqual(1);

    expect(data.createVhuAgrement).toEqual(receipt);
  });
});
