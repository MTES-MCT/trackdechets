import machine from "../machine";
import { EventType, FormState } from "../types";

describe("Workflow machine", () => {
  test("DRAFT -> SEALED", () => {
    const nextState = machine.transition(FormState.Draft, {
      type: EventType.MarkAsSealed
    });
    expect(nextState.value).toEqual(FormState.Sealed);
  });

  test("DRAFT -> SENT", () => {
    const nextState = machine.transition(FormState.Draft, {
      type: EventType.MarkAsSent
    });
    expect(nextState.value).toEqual(FormState.Sent);
  });

  test("SEALED -> SENT", () => {
    const nextState = machine.transition(FormState.Sealed, {
      type: EventType.SignedByTransporter
    });
    expect(nextState.value).toEqual(FormState.Sent);
  });
  test("SENT -> RECEIVED", () => {
    const nextState = machine.transition(FormState.Sent, {
      type: EventType.MarkAsReceived
    });
    expect(nextState.value).toEqual(FormState.Received);
  });
  test("SENT -> REFUSED", () => {
    const nextState = machine.transition(FormState.Sent, {
      type: EventType.MarkAsReceived,
      formUpdateInput: {
        wasteAcceptationStatus: "REFUSED"
      }
    });
    expect(nextState.value).toEqual(FormState.Refused);
  });
  test("SENT -> TEMP_STORED", () => {
    const nextState = machine.transition(FormState.Sent, {
      type: EventType.MarkAsTempStored
    });
    expect(nextState.value).toEqual(FormState.TempStored);
  });
  test("SENT -> REFUSED (temp storage)", () => {
    const nextState = machine.transition(FormState.Sent, {
      type: EventType.MarkAsTempStored,
      formUpdateInput: {
        temporaryStorageDetail: {
          update: { tempStorerWasteAcceptationStatus: "REFUSED" }
        }
      }
    });
    expect(nextState.value).toEqual(FormState.Refused);
  });
  test("RECEIVED -> PROCESSED", () => {
    const nextState = machine.transition(FormState.Received, {
      type: EventType.MarkAsProcessed
    });
    expect(nextState.value).toEqual(FormState.Processed);
  });
  test("RECEIVED -> AWAITING_GROUP", () => {
    const nextState = machine.transition(FormState.Received, {
      type: EventType.MarkAsProcessed,
      formUpdateInput: { processingOperationDone: "R 12" }
    });
    expect(nextState.value).toEqual(FormState.AwaitingGroup);
  });
  test("RECEIVED -> NO_TRACEABILITY", () => {
    const nextState = machine.transition(FormState.Received, {
      type: EventType.MarkAsProcessed,
      formUpdateInput: { noTraceability: true }
    });
    expect(nextState.value).toEqual(FormState.NoTraceability);
  });
  test("TEMP_STORED -> RESEALED", () => {
    const nextState = machine.transition(FormState.TempStored, {
      type: EventType.MarkAsResealed
    });
    expect(nextState.value).toEqual(FormState.Resealed);
  });
  test("RESEALED -> RESENT", () => {
    const nextState = machine.transition(FormState.Resealed, {
      type: EventType.SignedByTransporter
    });
    expect(nextState.value).toEqual(FormState.Resent);
  });
  test("TEMP_STORED -> RESENT", () => {
    const nextState = machine.transition(FormState.TempStored, {
      type: EventType.MarkAsResent
    });
    expect(nextState.value).toEqual(FormState.Resent);
  });
  test("RESENT -> RECEIVED", () => {
    const nextState = machine.transition(FormState.Resent, {
      type: EventType.MarkAsReceived
    });
    expect(nextState.value).toEqual(FormState.Received);
  });
  test("AWAITING_GROUP -> GROUPED", () => {
    const nextState = machine.transition(FormState.AwaitingGroup, {
      type: EventType.MarkAsGrouped
    });
    expect(nextState.value).toEqual(FormState.Grouped);
  });
  test("GROUPED -> PROCESSED", () => {
    const nextState = machine.transition(FormState.Grouped, {
      type: EventType.MarkAsProcessed
    });
    expect(nextState.value).toEqual(FormState.Processed);
  });
});
