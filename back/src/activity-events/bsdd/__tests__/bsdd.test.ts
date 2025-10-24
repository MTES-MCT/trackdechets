import { bsddReducer } from "../reducer";
import { aggregateStream } from "../../aggregator";
import { BsddCreated, BsddEvent, BsddUpdated, BsddSigned } from "../types";
import { Form } from "@td/prisma";
import { siretify } from "../../../__tests__/factories";

describe("ActivityEvent.Bsdd", () => {
  it("should get proper state when all events are aggregated", () => {
    const userId = "aaa";
    const bsddId = "TD-TEST-0001";

    const bsddCreated: BsddCreated = {
      actor: userId,
      streamId: bsddId,
      type: "BsddCreated",
      data: {
        content: {
          readableId: bsddId,
          owner: {},
          emitterCompanyName: "Test company"
        }
      }
    };
    const emitterCompanySiret = siretify(6);
    const bsddUpdated: BsddUpdated = {
      actor: userId,
      streamId: bsddId,
      type: "BsddUpdated",
      data: {
        content: { id: bsddId, emitterCompanySiret }
      }
    };

    const bsddSigned: BsddSigned = {
      actor: userId,
      streamId: bsddId,
      type: "BsddSigned",
      data: {
        status: "PROCESSED"
      }
    };

    const events = [bsddCreated, bsddUpdated, bsddSigned];

    const bsdd = aggregateStream<Form, BsddEvent>(events, bsddReducer);

    expect(bsdd).toMatchObject({
      id: bsddId,
      status: "PROCESSED",
      emitterCompanyName: "Test company",
      emitterCompanySiret
    });
  });
});
