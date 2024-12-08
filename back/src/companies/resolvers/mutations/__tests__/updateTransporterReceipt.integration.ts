import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";

describe("{ mutation { updateTransporterReceipt } }", () => {
  afterEach(() => resetDatabase());

  it("should update a transporter receipt", async () => {
    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };

    const createdReceipt = await prisma.transporterReceipt.create({
      data: receipt
    });
    const { user, company } = await userWithCompanyFactory("ADMIN");
    await prisma.company.update({
      data: { transporterReceipt: { connect: { id: createdReceipt.id } } },
      where: { id: company.id }
    });

    const update = {
      receiptNumber: "receiptNumber2",
      validityLimit: "2021-04-30T00:00:00.000Z",
      department: "13"
    };

    const mutation = `
      mutation {
        updateTransporterReceipt(
          input: {
            id: "${createdReceipt.id}"
            receiptNumber: "${update.receiptNumber}"
            validityLimit: "${update.validityLimit}"
            department: "${update.department}"
          }
          ) { receiptNumber, validityLimit, department }
        }`;
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { data } = await mutate<Pick<Mutation, "updateTransporterReceipt">>(
      mutation
    );

    // check returned value
    expect(data.updateTransporterReceipt).toEqual(update);

    // check record was modified in db
    const { id, ...updated } =
      await prisma.transporterReceipt.findUniqueOrThrow({
        where: { id: createdReceipt.id }
      });
    expect(updated.receiptNumber).toEqual(update.receiptNumber);
    expect(updated.validityLimit.toISOString()).toEqual(update.validityLimit);
    expect(updated.department).toEqual(update.department);
  });
});
