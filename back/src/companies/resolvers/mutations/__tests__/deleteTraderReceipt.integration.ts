import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { AuthType } from "../../../../auth/auth";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import type { Mutation } from "@td/codegen-back";

describe("{ mutation { deleteTraderReceipt } }", () => {
  afterEach(() => resetDatabase());

  it("should delete a traderReceipt", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };
    const createdReceipt = await prisma.traderReceipt.create({ data: receipt });

    await prisma.company.update({
      data: { traderReceipt: { connect: { id: createdReceipt.id } } },
      where: { id: company.id }
    });

    const { mutate } = makeClient({ ...user, auth: AuthType.Session });

    const mutation = `
      mutation {
        deleteTraderReceipt(
          input: {
            id: "${createdReceipt.id}"
          }
        ){
          id
        }
      }
    `;

    const { data } = await mutate<Pick<Mutation, "deleteTraderReceipt">>(
      mutation
    );
    expect(data.deleteTraderReceipt.id).toEqual(createdReceipt.id);

    expect(await prisma.traderReceipt.count()).toEqual(0);
  });

  it("should throw if user does not have sufficient permissions", async () => {
    // Given
    const { user, company } = await userWithCompanyFactory("READER");
    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };
    const createdReceipt = await prisma.traderReceipt.create({ data: receipt });

    await prisma.company.update({
      data: { traderReceipt: { connect: { id: createdReceipt.id } } },
      where: { id: company.id }
    });

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const mutation = `
      mutation {
        deleteTraderReceipt(
          input: {
            id: "${createdReceipt.id}"
          }
        ){
          id
        }
      }
    `;
    const { errors } = await mutate<Pick<Mutation, "deleteTraderReceipt">>(
      mutation
    );

    // Then
    expect(errors![0].message).toBe(
      "Vous n'avez pas le droit d'éditer ou supprimer ce récépissé négociant"
    );
    expect(await prisma.traderReceipt.count()).toEqual(1);
  });

  it("should throw if user has sufficient permissions, but in another company", async () => {
    // Given
    const { company } = await userWithCompanyFactory("ADMIN");
    const { user: user2 } = await userWithCompanyFactory("ADMIN");

    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };
    const createdReceipt = await prisma.traderReceipt.create({ data: receipt });

    await prisma.company.update({
      data: { traderReceipt: { connect: { id: createdReceipt.id } } },
      where: { id: company.id }
    });

    // When
    const { mutate } = makeClient({ ...user2, auth: AuthType.Session });
    const mutation = `
      mutation {
        deleteTraderReceipt(
          input: {
            id: "${createdReceipt.id}"
          }
        ){
          id
        }
      }
    `;
    const { errors } = await mutate<Pick<Mutation, "deleteTraderReceipt">>(
      mutation
    );

    // Then
    expect(errors![0].message).toBe(
      "Vous n'avez pas le droit d'éditer ou supprimer ce récépissé négociant"
    );
    expect(await prisma.traderReceipt.count()).toEqual(1);
  });

  it("should throw if user does not have sufficient permissions, even if receipt is deteched from any company", async () => {
    // Given
    const { user } = await userWithCompanyFactory("READER");
    const receipt = {
      receiptNumber: "receiptNumber",
      validityLimit: "2021-03-31T00:00:00.000Z",
      department: "07"
    };
    const createdReceipt = await prisma.traderReceipt.create({ data: receipt });

    // When
    const { mutate } = makeClient({ ...user, auth: AuthType.Session });
    const mutation = `
      mutation {
        deleteTraderReceipt(
          input: {
            id: "${createdReceipt.id}"
          }
        ){
          id
        }
      }
    `;
    const { errors } = await mutate<Pick<Mutation, "deleteTraderReceipt">>(
      mutation
    );

    // Then
    expect(errors![0].message).toBe(
      "Vous n'avez pas le droit d'éditer ou supprimer ce récépissé négociant"
    );
    expect(await prisma.traderReceipt.count()).toEqual(1);
  });
});
