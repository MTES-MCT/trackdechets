import { resetDatabase } from "../../../integration-tests/helper";
import { getBsdaHistory } from "../database";
import { bsdaFactory } from "./factories";

describe("getBsdaHistory", () => {
  afterAll(resetDatabase);

  it("should retrieve the full history of a BSDA", async () => {
    const bsda1 = await bsdaFactory({ opt: { id: "bsda1" } });

    // bsda2 is forwarding bsda1
    const bsda2 = await bsdaFactory({
      opt: { id: "bsda2", forwarding: { connect: { id: bsda1.id } } }
    });

    const bsda3 = await bsdaFactory({ opt: { id: "bsda3" } });
    const bsda4 = await bsdaFactory({ opt: { id: "bsda4" } });

    // bsda5 is grouping bsda3 and bsda4
    const bsda5 = await bsdaFactory({
      opt: {
        id: "bsda5",
        grouping: {
          connect: [{ id: bsda3.id }, { id: bsda4.id }]
        },
        forwarding: { connect: { id: bsda2.id } }
      }
    });
    const history = await getBsdaHistory(bsda5);
    expect(history.map(bsda => bsda.id)).toEqual([
      bsda1.id,
      bsda2.id,
      bsda3.id,
      bsda4.id
    ]);
  });
});
