import { bsdaReducer } from "../reducer";
import { aggregateStream } from "../../aggregator";
import { BsdaCreated, BsdaEvent, BsdaUpdated, BsdaSigned } from "../types";
import { Bsda } from "@prisma/client";
import { siretify } from "../../../__tests__/factories";

describe("ActivityEvent.Bsda", () => {
  it("should get proper state when all events are aggregated", () => {
    const userId = "aaa";
    const bsdaId = "TD-TEST-0001";

    const bsdaCreated: BsdaCreated = {
      actor: userId,
      streamId: bsdaId,
      type: "BsdaCreated",
      data: {
        id: bsdaId,
        emitterCompanyName: "Test company",
        packagings: []
      }
    };
    const emitterCompanySiret = siretify(5);
    const bsdaUpdated: BsdaUpdated = {
      actor: userId,
      streamId: bsdaId,
      type: "BsdaUpdated",
      data: {
        id: bsdaId,
        emitterCompanySiret
      }
    };

    const bsdaSigned: BsdaSigned = {
      actor: userId,
      streamId: bsdaId,
      type: "BsdaSigned",
      data: {
        status: "PROCESSED"
      }
    };

    const events = [bsdaCreated, bsdaUpdated, bsdaSigned];

    const bsda = aggregateStream<Bsda, BsdaEvent>(events, bsdaReducer);

    expect(bsda).toMatchObject({
      id: bsdaId,
      status: "PROCESSED",
      emitterCompanyName: "Test company",
      emitterCompanySiret
    });
  });
});
