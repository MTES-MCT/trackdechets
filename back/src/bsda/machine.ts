import { Bsda, BsdaType, BsdaStatus } from "@prisma/client";
import { createMachine } from "xstate";
import { BsdaSignatureType } from "../generated/graphql/types";
import { PARTIAL_OPERATIONS } from "./validation";

export enum EventType {
  ProducerSignature,
  TransporterSignature,
  RecipientSignature
}

type Event = {
  type: BsdaSignatureType;
  bsda: Bsda;
};

export const machine = createMachine<{}, Event>(
  {
    id: "bsda-workflow",
    initial: BsdaStatus.INITIAL,
    states: {
      [BsdaStatus.INITIAL]: {
        on: {
          EMISSION: {
            target: BsdaStatus.SIGNED_BY_PRODUCER
          },
          WORK: {
            target: BsdaStatus.SIGNED_BY_WORKER,
            cond: "canSkipEmissionSignature"
          },
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
            cond: "isGroupingOrForwardingBsda"
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
        event.bsda?.workerWorkHasEmitterPaperSignature ||
        event.bsda?.emitterIsPrivateIndividual,
      isCollectedBy2710: (_, event) =>
        event.bsda?.type === BsdaType.COLLECTION_2710,
      isCollectedBy2710AndGroupingOrReshipmentOperation: (_, event) =>
        event.bsda?.type === BsdaType.COLLECTION_2710 &&
        PARTIAL_OPERATIONS.includes(event.bsda?.destinationOperationCode),
      isGroupingOrReshipmentOperation: (_, event) =>
        PARTIAL_OPERATIONS.includes(event.bsda?.destinationOperationCode),
      isGroupingOrForwardingBsda: (_, event) =>
        event.bsda?.type === BsdaType.GATHERING ||
        event.bsda?.type === BsdaType.RESHIPMENT
    }
  }
);
