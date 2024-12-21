import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";

describe("{ mutation { updateTraderReceipt } }", () => {
  afterEach(() => resetDatabase());

  test("admin can update a trader receipt", async () => {
    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };

    const createdReceipt = await prisma.traderReceipt.create({ data: receipt });
    const { user, company } = await userWithCompanyFactory("ADMIN");
    await prisma.company.update({
      data: { traderReceipt: { connect: { id: createdReceipt.id } } },
      where: { id: company.id }
    });

    const update = {
      receiptNumber: "receiptNumber2",
      validityLimit: "2021-04-30T00:00:00.000Z",
      department: "13"
    };

    const mutation = `
      mutation {
        updateTraderReceipt(
          input: {
            id: "${createdReceipt.id}"
            receiptNumber: "${update.receiptNumber}"
            validityLimit: "${update.validityLimit}"
            department: "${update.department}"
          }
          ) { receiptNumber, validityLimit, department }
        }`;
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { data } = await mutate<Pick<Mutation, "updateTraderReceipt">>(
      mutation
    );

    // check returned value
    expect(data.updateTraderReceipt).toEqual(update);

    // check record was modified in db
    const { id, ...updated } = await prisma.traderReceipt.findUniqueOrThrow({
      where: { id: createdReceipt.id }
    });
    expect(updated.receiptNumber).toEqual(update.receiptNumber);
    expect(updated.validityLimit.toISOString()).toEqual(update.validityLimit);
    expect(updated.department).toEqual(update.department);
  });
});
