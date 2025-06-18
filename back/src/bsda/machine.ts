import { Bsda, BsdaType, BsdaStatus } from "@prisma/client";
import { createMachine } from "xstate";
import type { BsdaSignatureType } from "@td/codegen-back";
import { PARTIAL_OPERATIONS } from "./validation/constants";

export enum EventType {
  ProducerSignature,
  TransporterSignature,
  RecipientSignature
}

type Event = {
  type: BsdaSignatureType;
  bsda: Bsda;
};

export const machine = createMachine<Record<string, never>, Event>(
  {
    id: "bsda-workflow",
    initial: BsdaStatus.INITIAL,
    // This flag is an opt into some fixed behaviors that will be the default in v5
    // cf. https://xstate.js.org/docs/guides/actions.html
    predictableActionArguments: true,
    states: {
      [BsdaStatus.CANCELED]: { type: "final" },
      [BsdaStatus.INITIAL]: {
        on: {
          EMISSION: {
            target: BsdaStatus.SIGNED_BY_PRODUCER
          },
          WORK: {
            target: BsdaStatus.SIGNED_BY_WORKER,
            cond: "canSkipEmissionSignature"
          },
          TRANSPORT: {
            target: BsdaStatus.SENT,
            cond: "isPrivateIndividualWithNoWorkerBsda"
          },
          RECEPTION: [
            {
              target: BsdaStatus.RECEIVED,
              cond: "isCollectedBy2710AndGroupingOrReshipmentOperation"
            },
            {
              target: BsdaStatus.RECEIVED,
              cond: "isCollectedBy2710"
            }
          ],
          OPERATION: [
            {
              target: BsdaStatus.AWAITING_CHILD,
              cond: "isCollectedBy2710AndGroupingOrReshipmentOperation"
            },
            {
              target: BsdaStatus.PROCESSED,
              cond: "isCollectedBy2710"
            }
          ]
        }
      },
      [BsdaStatus.SIGNED_BY_PRODUCER]: {
        on: {
          WORK: {
            target: BsdaStatus.SIGNED_BY_WORKER
          },
          TRANSPORT: {
            target: BsdaStatus.SENT,
            cond: "isGroupingOrForwardingOrWithNoWorkerBsda"
          }
        }
      },
      [BsdaStatus.SIGNED_BY_WORKER]: {
        on: {
          TRANSPORT: {
            target: BsdaStatus.SENT
          }
        }
      },
      [BsdaStatus.SENT]: {
        on: {
          TRANSPORT: { target: BsdaStatus.SENT }, // multi-modal
          RECEPTION: [
            {
              target: BsdaStatus.REFUSED,
              cond: "isBsdaRefused"
            },
            {
              target: BsdaStatus.RECEIVED
            }
          ],
          OPERATION: [
            {
              target: BsdaStatus.REFUSED,
              cond: "isBsdaRefused"
            },
            {
              target: BsdaStatus.AWAITING_CHILD,
              cond: "isGroupingOrReshipmentOperation"
            },
            {
              target: BsdaStatus.PROCESSED
            }
          ]
        }
      },
      [BsdaStatus.RECEIVED]: {
        on: {
          OPERATION: [
            {
              target: BsdaStatus.REFUSED,
              cond: "isBsdaRefused"
            },
            {
              target: BsdaStatus.AWAITING_CHILD,
              cond: "isGroupingOrReshipmentOperation"
            },
            {
              target: BsdaStatus.PROCESSED
            }
          ]
        }
      },
      [BsdaStatus.REFUSED]: { type: "final" },
      [BsdaStatus.PROCESSED]: { type: "final" },
      [BsdaStatus.AWAITING_CHILD]: { type: "final" }
    }
  },
  {
    guards: {
      isBsdaRefused: (_, event) =>
        event.bsda?.destinationReceptionAcceptationStatus ===
        BsdaStatus.REFUSED,
      canSkipEmissionSignature: (_, event) =>
        Boolean(
          event.bsda?.workerWorkHasEmitterPaperSignature ||
            event.bsda?.emitterIsPrivateIndividual
        ),
      isCollectedBy2710: (_, event) =>
        event.bsda?.type === BsdaType.COLLECTION_2710,
      isCollectedBy2710AndGroupingOrReshipmentOperation: (_, event) =>
        event.bsda?.type === BsdaType.COLLECTION_2710 &&
        !!event.bsda?.destinationOperationCode &&
        PARTIAL_OPERATIONS.includes(event.bsda.destinationOperationCode),
      isGroupingOrReshipmentOperation: (_, event) =>
        !!event.bsda?.destinationOperationCode &&
        PARTIAL_OPERATIONS.includes(event.bsda?.destinationOperationCode),
      isGroupingOrForwardingOrWithNoWorkerBsda: (_, event) =>
        event.bsda?.type === BsdaType.GATHERING ||
        event.bsda?.type === BsdaType.RESHIPMENT ||
        Boolean(event.bsda?.workerIsDisabled),
      isPrivateIndividualWithNoWorkerBsda: (_, event) =>
        Boolean(
          event.bsda?.emitterIsPrivateIndividual && event.bsda?.workerIsDisabled
        )
    }
  }
);
