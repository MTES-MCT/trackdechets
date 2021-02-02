import { resetDatabase } from "../../../integration-tests/helper";
import { dasriFactory } from "./factories";
import { userFactory } from "../../__tests__/factories";

describe("Test Factories", () => {
  afterAll(resetDatabase);

  test("should create a user", async () => {
    const usr = await userFactory();

    const dasri = await dasriFactory({
      ownerId: usr.id,
      opt: { emitterCompanyName: "somecompany" }
    });

    expect(dasri.id).toBeTruthy();
    expect(dasri.readableId).toBeTruthy();
  });
});
