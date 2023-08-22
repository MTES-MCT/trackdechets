import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { AuthType } from "../../../../auth";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "../../../../generated/graphql/types";

describe("{ mutation { createTransporterReceipt } }", () => {
  afterEach(() => resetDatabase());

  it("should create a transporter receipt", async () => {
    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };

    const user = await userFactory();

    const mutation = `
      mutation {
        createTransporterReceipt(
          input: {
            receiptNumber: "${receipt.transporterReceiptNumber}"
            validityLimit: "${receipt.transporterReceiptValidityLimit}"
            department: "${receipt.transporterReceiptNumber}"
          }
          ) { receiptNumber, validityLimit, department }
        }`;
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { data } = await mutate<Pick<Mutation, "createTransporterReceipt">>(
      mutation
    );

    expect(await prisma.transporterReceipt.count()).toEqual(1);

    expect(data.createTransporterReceipt).toEqual(receipt);
  });
});
