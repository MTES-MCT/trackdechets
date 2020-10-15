import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "../../../../generated/prisma-client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { AuthType } from "../../../../auth";
import { ExecutionResult } from "graphql";
import { Mutation } from "../../../../generated/graphql/types";

describe("{ mutation { deleteTraderReceipt } }", () => {
  afterEach(() => resetDatabase());

  it("should delete a traderReceipt", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };
    const receiptId = await prisma.createTraderReceipt(receipt).id();

    await prisma.updateCompany({
      data: { traderReceipt: { connect: { id: receiptId } } },
      where: { id: company.id }
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const mutation = `
      mutation {
        deleteTraderReceipt(
          input: {
            id: "${receiptId}"
          }
        ){
          id
        }
      }
    `;

    const { data } = await mutate<
      ExecutionResult<Pick<Mutation, "deleteTraderReceipt">>
    >(mutation);
    expect(data.deleteTraderReceipt.id).toEqual(receiptId);

    expect(await prisma.traderReceiptsConnection().aggregate().count()).toEqual(
      0
    );
  });
});
