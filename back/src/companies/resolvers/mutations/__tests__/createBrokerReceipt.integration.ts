import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { AuthType } from "../../../../auth";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

describe("{ mutation { createBrokerReceipt } }", () => {
  afterEach(() => resetDatabase());

  it("should create a broker receipt !", async () => {
    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };

    const user = await userFactory();

    const createBrokerReceipt = `
      mutation CreateBrokerReceipt($input: CreateBrokerReceiptInput!){
        createBrokerReceipt(input: $input){
          receiptNumber
          validityLimit
          department
          }
      }`;

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const { data } = await mutate(createBrokerReceipt, {
      variables: { input: receipt }
    });

    expect(await prisma.brokerReceipt.count()).toEqual(1);

    expect(data.createBrokerReceipt).toEqual(receipt);
  });
});
