import { WasteAcceptationStatus } from "@prisma/client";
import { Machine } from "xstate";
import { PROCESSING_OPERATIONS_GROUPEMENT_CODES } from "../../common/constants";
import { Event, EventType, FormState } from "./types";

/**
 * Workflow state machine
 */
const machine = Machine<any, Event>(
  {
    id: "form-workflow-machine",
    initial: FormState.Draft,
    states: {
      [FormState.Draft]: {
        on: {
          [EventType.MarkAsSealed]: [{ target: FormState.Sealed }],
          [EventType.MarkAsSent]: [{ target: FormState.Sent }]
        }
      },
      [FormState.Sealed]: {
        on: {
          [EventType.MarkAsSent]: [{ target: FormState.Sent }],
          [EventType.SignedByTransporter]: [
            {
              target: FormState.Sent
            }
          ],
          [EventType.ImportPaperForm]: [{ target: FormState.Processed }]
        }
      },
      [FormState.Sent]: {
        on: {
          [EventType.MarkAsTempStored]: [
            {
              target: FormState.Refused,
              cond: "isFormRefusedByTempStorage"
            },
            {
              target: FormState.TempStorerAccepted,
              cond: "isFormAcceptedByTempStorage"
            },
            {
              target: FormState.TempStored
            }
          ],
          [EventType.MarkAsReceived]: [
            {
              target: FormState.Refused,
              cond: "isFormRefused"
            },
            {
              target: FormState.Accepted,
              cond: "isFormAccepted"
            },
            {
              target: FormState.Received
            }
          ]
        }
      },
      [FormState.Refused]: { type: "final" },
      [FormState.Received]: {
        on: {
          [EventType.MarkAsAccepted]: [
            {
              target: FormState.Refused,
              cond: "isFormRefused"
            },
            {
              target: FormState.Accepted
            }
          ]
        }
      },
      [FormState.Accepted]: {
        on: {
          [EventType.MarkAsProcessed]: [
            {
              target: FormState.NoTraceability,
              cond: "isExemptOfTraceability"
            },
            {
              target: FormState.AwaitingGroup,
              cond: "awaitsGroup"
            },
            {
              target: FormState.Processed
            }
          ]
        }
      },
      [FormState.Processed]: { type: "final" },
      [FormState.NoTraceability]: { type: "final" },
      [FormState.AwaitingGroup]: {
        on: {
          [EventType.MarkAsGrouped]: { target: FormState.Grouped }
        }
      },
      [FormState.Grouped]: {
        on: { [EventType.MarkAsProcessed]: { target: FormState.Processed } }
      },
      [FormState.TempStored]: {
        on: {
          [EventType.MarkAsTempStorerAccepted]: [
            {
              target: FormState.Refused,
              cond: "isFormRefusedByTempStorage"
            },
            {
              target: FormState.TempStorerAccepted
            }
          ]
        }
      },
      [FormState.TempStorerAccepted]: {
        on: {
          [EventType.MarkAsResealed]: [
            {
              target: FormState.Resealed
            }
          ],
          [EventType.MarkAsResent]: [
            {
              target: FormState.Resent
            }
          ]
        }
      },
      [FormState.Resealed]: {
        on: {
          [EventType.MarkAsResent]: [
            {
              target: FormState.Resent
            }
          ],
          [EventType.SignedByTransporter]: [
            {
              target: FormState.Resent
            }
          ]
        }
      },
      [FormState.Resent]: {
        on: {
          [EventType.MarkAsReceived]: [
            {
              target: FormState.Refused,
              cond: "isFormRefused"
            },
            {
              target: FormState.Accepted,
              cond: "isFormAccepted"
            },
            {
              target: FormState.Received
            }
          ]
        }
      },
      error: {
        states: {}
      }
    }
  },
  {
    guards: {
      isExemptOfTraceability: (_, event) =>
        !!event?.formUpdateInput?.noTraceability,
      awaitsGroup: (_, event) =>
        PROCESSING_OPERATIONS_GROUPEMENT_CODES.includes(
          event.formUpdateInput?.processingOperationDone as string
        ),
      isFormRefused: (_, event) =>
        event.formUpdateInput?.wasteAcceptationStatus === "REFUSED",
      isFormAccepted: (_, event) =>
        [
          WasteAcceptationStatus.ACCEPTED,
          WasteAcceptationStatus.PARTIALLY_REFUSED
        ].includes(event.formUpdateInput?.wasteAcceptationStatus as any),
      isFormRefusedByTempStorage: (_, event) =>
        event.formUpdateInput?.temporaryStorageDetail?.update
          ?.tempStorerWasteAcceptationStatus === "REFUSED",
      isFormAcceptedByTempStorage: (_, event) =>
        [
          WasteAcceptationStatus.ACCEPTED,
          WasteAcceptationStatus.PARTIALLY_REFUSED
        ].includes(
          event.formUpdateInput?.temporaryStorageDetail?.update
            ?.tempStorerWasteAcceptationStatus as any
        )
    }
  }
);

export default machine;
