import { resetDatabase } from "../../../integration-tests/helper";
import { bspaohFactory } from "./factories";

describe("Test Factories", () => {
  afterEach(resetDatabase);

  test("should create a bspaoh", async () => {
    const paoh = await bspaohFactory({
      opt: { emitterCompanyName: "somecompany" }
    });

    expect(paoh.id).toBeTruthy();
    expect(paoh.status).toEqual("INITIAL");
    expect(paoh.transporters.length).toEqual(1);
    expect(paoh.transporters[0].transporterCompanySiret).toBeTruthy();
    expect(paoh.transportersSirets).toEqual([
      paoh.transporters[0].transporterCompanySiret
    ]);
  });
});
