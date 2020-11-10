import { resetDatabase } from "../../../../integration-tests/helper";
import { prisma } from "../../../generated/prisma-client";
import { formFactory, userFactory } from "../../../__tests__/factories";
import setProcessedAtDateTime from "../setProcessedAtDateTime";

describe("setProcessedAtDateTime", () => {
  afterAll(resetDatabase);

  it("should convert ISO datetime string to datetime", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: { processedAt: "2019-10-04T00:00:00.000Z" }
    });
    await setProcessedAtDateTime();
    const updatedForm = await prisma.form({ id: form.id });
    expect(updatedForm.processedAtDateTime).toEqual("2019-10-04T00:00:00.000Z");
  });

  it("should convert YYYY-MM-DD string to datetime", async () => {
    const user = await userFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: { processedAt: "2019-10-04" }
    });
    await setProcessedAtDateTime();
    const updatedForm = await prisma.form({ id: form.id });
    expect(updatedForm.processedAtDateTime).toEqual("2019-10-04T00:00:00.000Z");
  });
});
