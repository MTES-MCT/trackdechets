import { Bsda, BsdaType, BsdaStatus } from "@prisma/client";
import { Machine } from "xstate";
import { BsdaSignatureType } from "../generated/graphql/types";

export enum EventType {
  ProducerSignature,
  TransporterSignature,
  RecipientSignature
}

type Event = {
  type: BsdaSignatureType;
  bsda: Bsda;
};

export const machine = Machine<never, Event>(
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
            cond: "workerHasEmitterPaperSignature"
          },
          OPERATION: {
            target: BsdaStatus.PROCESSED,
            cond: "isCollectedBy2010"
          }
        }
      },
      [BsdaStatus.SIGNED_BY_PRODUCER]: {
        on: {
          WORK: {
            target: BsdaStatus.SIGNED_BY_WORKER
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
              cond: "hasChildBsda"
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
      workerHasEmitterPaperSignature: (_, event) =>
        event.bsda?.workerWorkHasEmitterPaperSignature,
      isCollectedBy2010: (_, event) =>
        event.bsda?.type === BsdaType.COLLECTION_2710,
      hasChildBsda: (_, event) =>
        [BsdaType.GATHERING, BsdaType.RESHIPMENT].includes(
          event.bsda?.type as any
        )
    }
  }
);
