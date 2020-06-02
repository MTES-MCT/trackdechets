import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "../../../../generated/prisma-client";

describe("{ mutation { updateTransporterReceipt } }", () => {
  afterEach(() => resetDatabase());

  it("should update a transporter receipt", async () => {
    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };

    const receiptId = await prisma.createTransporterReceipt(receipt).id();
    const { user, company } = await userWithCompanyFactory("ADMIN");
    await prisma.updateCompany({
      data: { transporterReceipt: { connect: { id: receiptId } } },
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
            id: "${receiptId}"
            receiptNumber: "${update.receiptNumber}"
            validityLimit: "${update.validityLimit}"
            department: "${update.department}"
          }
          ) { receiptNumber, validityLimit, department }
        }`;
    const { mutate } = makeClient(user);

    const { data } = await mutate(mutation);

    // check returned value
    expect(data.updateTransporterReceipt).toEqual(update);

    // check record was modified in db
    const { id, ...updated } = await prisma.transporterReceipt({
      id: receiptId
    });
    expect(updated).toEqual(update);
  });
});
