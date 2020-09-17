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
          IMPORT_PAPER_FORM: [{ target: FormState.Processed }]
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
              target: FormState.TempStored
            }
          ],
          [EventType.MarkAsReceived]: [
            {
              target: FormState.Refused,
              cond: "isFormRefused"
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
          event.formUpdateInput?.processingOperationDone
        ),
      isFormRefused: (_, event) =>
        event.formUpdateInput?.wasteAcceptationStatus === "REFUSED",
      isFormRefusedByTempStorage: (_, event) =>
        event.formUpdateInput?.temporaryStorageDetail?.update
          ?.tempStorerWasteAcceptationStatus === "REFUSED"
    }
  }
);

export default machine;
