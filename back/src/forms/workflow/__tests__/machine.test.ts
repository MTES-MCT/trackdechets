import { Status } from "@td/prisma";
import machine from "../machine";
import { EventType } from "../types";

describe("Workflow machine", () => {
  test("DRAFT -> SEALED", () => {
    const nextState = machine.transition(Status.DRAFT, {
      type: EventType.MarkAsSealed
    });
    expect(nextState.value).toEqual(Status.SEALED);
  });

  test("SEALED -> SENT", () => {
    const nextState = machine.transition(Status.SEALED, {
      type: EventType.SignedByTransporter
    });
    expect(nextState.value).toEqual(Status.SENT);
  });
  test("SEALED -> SENT", () => {
    const nextState = machine.transition(Status.SEALED, {
      type: EventType.SignedByProducer,
      formUpdateInput: {
        isDirectSupply: true
      }
    });
    expect(nextState.value).toEqual(Status.SENT);
  });
  test("SEALED -> SENT", () => {
    const nextState = machine.transition(Status.SEALED, {
      type: EventType.SignedByProducer
    });
    expect(nextState.value).toEqual(Status.SIGNED_BY_PRODUCER);
  });
  test("SENT -> SENT", () => {
    const nextState = machine.transition(Status.SENT, {
      type: EventType.SignedByTransporter
    });
    expect(nextState.value).toEqual(Status.SENT);
  });
  test("SENT -> RECEIVED", () => {
    const nextState = machine.transition(Status.SENT, {
      type: EventType.MarkAsReceived
    });
    expect(nextState.value).toEqual(Status.RECEIVED);
  });
  test("SENT -> ACCEPTED", () => {
    const nextState = machine.transition(Status.SENT, {
      type: EventType.MarkAsReceived,
      formUpdateInput: {
        wasteAcceptationStatus: "ACCEPTED"
      }
    });
    expect(nextState.value).toEqual(Status.ACCEPTED);
  });
  test("SENT -> REFUSED", () => {
    const nextState = machine.transition(Status.SENT, {
      type: EventType.MarkAsReceived,
      formUpdateInput: {
        wasteAcceptationStatus: "REFUSED"
      }
    });
    expect(nextState.value).toEqual(Status.REFUSED);
  });
  test("SENT -> TEMP_STORED", () => {
    const nextState = machine.transition(Status.SENT, {
      type: EventType.MarkAsTempStored
    });
    expect(nextState.value).toEqual(Status.TEMP_STORED);
  });
  test("SENT -> TEMP_STORER_ACCEPTED", () => {
    const nextState = machine.transition(Status.SENT, {
      type: EventType.MarkAsTempStored,
      formUpdateInput: {
        wasteAcceptationStatus: "ACCEPTED"
      }
    });
    expect(nextState.value).toEqual(Status.TEMP_STORER_ACCEPTED);
  });
  test("SENT -> REFUSED (temp storage)", () => {
    const nextState = machine.transition(Status.SENT, {
      type: EventType.MarkAsTempStored,
      formUpdateInput: {
        wasteAcceptationStatus: "REFUSED"
      }
    });
    expect(nextState.value).toEqual(Status.REFUSED);
  });
  test("TEMP_STORED -> REFUSED (temp storage)", () => {
    const nextState = machine.transition(Status.TEMP_STORED, {
      type: EventType.MarkAsTempStorerAccepted,
      formUpdateInput: {
        wasteAcceptationStatus: "REFUSED"
      }
    });
    expect(nextState.value).toEqual(Status.REFUSED);
  });
  test("RECEIVED -> ACCEPTED", () => {
    const nextState = machine.transition(Status.RECEIVED, {
      type: EventType.MarkAsAccepted
    });
    expect(nextState.value).toEqual(Status.ACCEPTED);
  });
  test("ACCEPTED -> PROCESSED", () => {
    const nextState = machine.transition(Status.ACCEPTED, {
      type: EventType.MarkAsProcessed,
      formUpdateInput: {
        nextDestinationCompanyCountry: "FR"
      }
    });
    expect(nextState.value).toEqual(Status.PROCESSED);
  });
  test("ACCEPTED -> FOLLOWED_WITH_PNTTD", () => {
    const nextState = machine.transition(Status.ACCEPTED, {
      type: EventType.MarkAsProcessed,
      formUpdateInput: {
        processingOperationDone: "R 12",
        nextDestinationCompanyCountry: "BE",
        noTraceability: false
      }
    });
    expect(nextState.value).toEqual(Status.FOLLOWED_WITH_PNTTD);
  });
  test("ACCEPTED -> AWAITING_GROUP", () => {
    const nextState = machine.transition(Status.ACCEPTED, {
      type: EventType.MarkAsProcessed,
      formUpdateInput: { processingOperationDone: "R 12" }
    });
    expect(nextState.value).toEqual(Status.AWAITING_GROUP);
  });
  test("ACCEPTED -> NO_TRACEABILITY", () => {
    const nextState = machine.transition(Status.ACCEPTED, {
      type: EventType.MarkAsProcessed,
      formUpdateInput: { noTraceability: true }
    });
    expect(nextState.value).toEqual(Status.NO_TRACEABILITY);
  });
  test("TEMP_STORER_ACCEPTED -> RESEALED", () => {
    const nextState = machine.transition(Status.TEMP_STORER_ACCEPTED, {
      type: EventType.MarkAsResealed
    });
    expect(nextState.value).toEqual(Status.RESEALED);
  });
  test("RESEALED -> RESENT", () => {
    const nextState = machine.transition(Status.RESEALED, {
      type: EventType.SignedByTransporter
    });
    expect(nextState.value).toEqual(Status.RESENT);
  });
  test("TEMP_STORER_ACCEPTED -> RESENT", () => {
    const nextState = machine.transition(Status.TEMP_STORER_ACCEPTED, {
      type: EventType.MarkAsResent
    });
    expect(nextState.value).toEqual(Status.RESENT);
  });
  test("RESENT -> RECEIVED", () => {
    const nextState = machine.transition(Status.RESENT, {
      type: EventType.MarkAsReceived
    });
    expect(nextState.value).toEqual(Status.RECEIVED);
  });
  test("AWAITING_GROUP -> GROUPED", () => {
    const nextState = machine.transition(Status.AWAITING_GROUP, {
      type: EventType.MarkAsGrouped
    });
    expect(nextState.value).toEqual(Status.GROUPED);
  });
  test("GROUPED -> PROCESSED", () => {
    const nextState = machine.transition(Status.GROUPED, {
      type: EventType.MarkAsProcessed
    });
    expect(nextState.value).toEqual(Status.PROCESSED);
  });
});
