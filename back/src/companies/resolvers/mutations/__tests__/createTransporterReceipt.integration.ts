import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth";
import { userFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";
import { addDays } from "date-fns";

describe("{ mutation { createTransporterReceipt } }", () => {
  afterEach(() => resetDatabase());

  it("should create a transporter receipt", async () => {
    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2050-03-31T00:00:00.000Z",
      department: "07"
    };

    const user = await userFactory();

    const mutation = `
      mutation {
        createTransporterReceipt(
          input: {
            receiptNumber: "${receipt.receiptNumber}"
            validityLimit: "${receipt.validityLimit}"
            department: "${receipt.department}"
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

  it("should throw if validityDate is in the past", async () => {
    // Given
    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: addDays(new Date(), -1).toISOString(),
      department: "07"
    };

    const user = await userFactory();

    const mutation = `
      mutation {
        createTransporterReceipt(
          input: {
            receiptNumber: "${receipt.receiptNumber}"
            validityLimit: "${receipt.validityLimit}"
            department: "${receipt.department}"
          }
          ) { receiptNumber, validityLimit, department }
        }`;

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await mutate<Pick<Mutation, "createTransporterReceipt">>(
      mutation
    );

    // Then
    expect(errors).not.toBeUndefined();
  });
});
