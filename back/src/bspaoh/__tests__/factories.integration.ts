import { resetDatabase } from "../../../integration-tests/helper";
import { bspaohFactory, crematoriumFactory } from "./factories";

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

  test("should create a crematorium", async () => {
    const crematorium = await crematoriumFactory();
    expect(crematorium.id).toBeTruthy();
    expect(crematorium.companyTypes).toEqual(["WASTEPROCESSOR"]);
    expect(crematorium.wasteProcessorTypes).toEqual(["CREMATION"]);
  });
});
