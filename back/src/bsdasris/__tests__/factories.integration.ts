import { resetDatabase } from "../../../integration-tests/helper";
import { bsdasriFactory } from "./factories";

describe("Test Factories", () => {
  afterEach(resetDatabase);

  test("should create a bsdasri", async () => {
    const dasri = await bsdasriFactory({
      opt: { emitterCompanyName: "somecompany" }
    });

    expect(dasri.id).toBeTruthy();
    expect(dasri.status).toEqual("INITIAL");
    expect(dasri.isDraft).toEqual(false);
  });
});
