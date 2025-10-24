import { bsdasriReducer } from "../reducer";
import { aggregateStream } from "../../aggregator";
import {
  BsdasriCreated,
  BsdasriEvent,
  BsdasriUpdated,
  BsdasriSigned
} from "../types";
import { Bsdasri } from "@td/prisma";
import { siretify } from "../../../__tests__/factories";

describe("ActivityEvent.Bsdasri", () => {
  it("should get proper state when all events are aggregated", () => {
    const userId = "aaa";
    const bsdasriId = "TD-TEST-0001";

    const bsdasriCreated: BsdasriCreated = {
      actor: userId,
      streamId: bsdasriId,
      type: "BsdasriCreated",
      data: {
        id: bsdasriId,
        emitterCompanyName: "Test company"
      }
    };
    const emitterCompanySiret = siretify(5);
    const bsdasriUpdated: BsdasriUpdated = {
      actor: userId,
      streamId: bsdasriId,
      type: "BsdasriUpdated",
      data: {
        id: bsdasriId,
        emitterCompanySiret
      }
    };

    const bsdasriSigned: BsdasriSigned = {
      actor: userId,
      streamId: bsdasriId,
      type: "BsdasriSigned",
      data: {
        status: "PROCESSED"
      }
    };

    const events = [bsdasriCreated, bsdasriUpdated, bsdasriSigned];

    const bsdasri = aggregateStream<Bsdasri, BsdasriEvent>(
      events,
      bsdasriReducer
    );

    expect(bsdasri).toMatchObject({
      id: bsdasriId,
      status: "PROCESSED",
      emitterCompanyName: "Test company",
      emitterCompanySiret
    });
  });
});
