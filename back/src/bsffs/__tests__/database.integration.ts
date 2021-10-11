import { resetDatabase } from "../../../integration-tests/helper";
import { getBsffHistory } from "../database";
import { createBsff } from "./factories";

describe("getBsffHistory", () => {
  afterAll(resetDatabase);

  it("should retrieve the full history of a BSFF", async () => {
    const bsff1 = await createBsff({}, { id: "bsff1" });
    // bsff2 is forwarding bsff1
    const bsff2 = await createBsff(
      {},
      { id: "bsff2", forwarding: { connect: { id: bsff1.id } } }
    );

    const bsff3 = await createBsff({}, { id: "bsff3" });
    // bsff4 is repackaging bsff2 and bsff3
    const bsff4 = await createBsff(
      {},
      {
        id: "bsff4",
        repackaging: { connect: [{ id: bsff2.id }, { id: bsff3.id }] }
      }
    );
    const bsff5 = await createBsff({}, { id: "bsff5" });
    // bsff6 is grouping bsff5 and bsff4
    const bsff6 = await createBsff(
      {},
      {
        id: "bsff6",
        grouping: {
          connect: [{ id: bsff4.id }, { id: bsff5.id }]
        }
      }
    );
    const history = await getBsffHistory(bsff6);
    expect(history.map(bsff => bsff.id)).toEqual([
      bsff1.id,
      bsff2.id,
      bsff3.id,
      bsff4.id,
      bsff5.id
    ]);
  });
});
