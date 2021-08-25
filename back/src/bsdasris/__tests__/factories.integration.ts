import { resetDatabase } from "../../../integration-tests/helper";
import { bsdasriFactory } from "./factories";
import { userFactory } from "../../__tests__/factories";

describe("Test Factories", () => {
  afterEach(resetDatabase);

  test("should create a bsdasri", async () => {
    const usr = await userFactory();

    const dasri = await bsdasriFactory({
      ownerId: usr.id,
      opt: { emitterCompanyName: "somecompany" }
    });

    expect(dasri.id).toBeTruthy();
    expect(dasri.status).toEqual("INITIAL");
    expect(dasri.isDraft).toEqual(false);
    expect(dasri.bsdasriType).toEqual("SIMPLE");
  });

  test("should create a grouping bsdasri", async () => {
    const usr = await userFactory();

    const toRegroup = await bsdasriFactory({
      ownerId: usr.id,
      opt: { emitterCompanyName: "somecompany" }
    });
    const dasri = await bsdasriFactory({
      ownerId: usr.id,

      opt: {
        emitterCompanyName: "somecompany",
        regroupedBsdasris: { connect: [{ id: toRegroup.id }] }
      }
    });

    expect(dasri.bsdasriType).toEqual("GROUPING");
  });

  test("should create a synthesis bsdasri", async () => {
    const usr = await userFactory();

    const toRegroup = await bsdasriFactory({
      ownerId: usr.id,
      opt: { emitterCompanyName: "somecompany" }
    });
    const dasri = await bsdasriFactory({
      ownerId: usr.id,

      opt: {
        emitterCompanyName: "somecompany",
        synthesizedBsdasris: { connect: [{ id: toRegroup.id }] }
      }
    });

    expect(dasri.bsdasriType).toEqual("SYNTHESIS");
  });
});
