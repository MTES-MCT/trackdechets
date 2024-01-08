import { prisma } from "@td/prisma";

import { userFactory } from "./factories";
import { resetDatabase } from "../../integration-tests/helper";

describe("Test database reset", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  test("database should be reset", async () => {
    jest.setTimeout(10000);

    // now we create one
    await userFactory();

    // so we have one more
    expect((await prisma.user.findMany()).length).toBe(1);

    // then we reset the db
    await resetDatabase();

    // we have the initial number of users
    expect((await prisma.user.findMany()).length).toBe(0);
  });
});
