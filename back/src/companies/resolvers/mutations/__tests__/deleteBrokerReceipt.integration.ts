import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Mutation } from "@td/codegen-back";

describe("{ mutation { deleteBrokerReceipt } }", () => {
  afterEach(() => resetDatabase());

  it("should delete a brokerReceipt", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };
    const createdReceipt = await prisma.brokerReceipt.create({ data: receipt });

    await prisma.company.update({
      data: { brokerReceipt: { connect: { id: createdReceipt.id } } },
      where: { id: company.id }
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const mutation = `
      mutation {
        deleteBrokerReceipt(
          input: {
            id: "${createdReceipt.id}"
          }
        ){
          id
        }
      }
    `;

    const { data } = await mutate<Pick<Mutation, "deleteBrokerReceipt">>(
      mutation
    );
    expect(data.deleteBrokerReceipt.id).toEqual(createdReceipt.id);

    expect(await prisma.brokerReceipt.count()).toEqual(0);
  });
});
