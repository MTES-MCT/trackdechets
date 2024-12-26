import { Bspaoh, BspaohStatus } from "@prisma/client";
import { createMachine } from "xstate";
import type { BspaohSignatureType } from "@td/codegen-back";

export enum EventType {
  ProducerSignature,
  TransporterSignature,
  RecipientSignature
}

type Event = {
  type: BspaohSignatureType;
  bspaoh: Bspaoh;
};

export const machine = createMachine<Record<string, never>, Event>(
  {
    id: "bspaoh-workflow",
    initial: BspaohStatus.INITIAL,
    // This flag is an opt into some fixed behaviors that will be the default in v5
    // cf. https://xstate.js.org/docs/guides/actions.html
    predictableActionArguments: true,
    states: {
      [BspaohStatus.INITIAL]: {
        on: {
          EMISSION: {
            target: BspaohStatus.SIGNED_BY_PRODUCER
          }
        }
      },
      [BspaohStatus.SIGNED_BY_PRODUCER]: {
        on: {
          TRANSPORT: {
            target: BspaohStatus.SENT
          }
        }
      },

      [BspaohStatus.SENT]: {
        on: {
          RECEPTION: [
            {
              target: BspaohStatus.REFUSED,
              cond: "isBspaohRefused"
            },
            {
              target: BspaohStatus.PARTIALLY_REFUSED,
              cond: "isBspaohPartiallyRefused"
            },
            {
              target: BspaohStatus.RECEIVED
            }
          ],
          DELIVERY: {
            target: BspaohStatus.SENT,
            cond: "deliverytIsNotSigned"
          }
        }
      },
      [BspaohStatus.RECEIVED]: {
        on: {
          OPERATION: [
            {
              target: BspaohStatus.PROCESSED
            }
          ]
        }
      },
      [BspaohStatus.PARTIALLY_REFUSED]: {
        on: {
          OPERATION: [
            {
              target: BspaohStatus.PROCESSED
            }
          ]
        }
      },
      [BspaohStatus.REFUSED]: { type: "final" },
      [BspaohStatus.PROCESSED]: { type: "final" },
      [BspaohStatus.CANCELED]: { type: "final" }
    }
  },
  {
    guards: {
      deliverytIsNotSigned: (_, event) =>
        !event.bspaoh?.handedOverToDestinationSignatureDate,
      isBspaohRefused: (_, event) =>
        event.bspaoh?.destinationReceptionAcceptationStatus ===
        BspaohStatus.REFUSED,

      isBspaohPartiallyRefused: (_, event) =>
        event.bspaoh?.destinationReceptionAcceptationStatus ===
        BspaohStatus.PARTIALLY_REFUSED
    }
  }
);
