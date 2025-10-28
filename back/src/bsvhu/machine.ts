import { Bsvhu, BsvhuStatus } from "@td/prisma";
import { Machine } from "xstate";
import type { SignatureTypeInput } from "@td/codegen-back";

type Event = {
  type: SignatureTypeInput;
  bsvhu: Bsvhu;
  emitterCompanyNotOnTD?: boolean;
};

export const machine = Machine<never, Event>(
  {
    id: "bsvhu-workflow-machine",
    initial: BsvhuStatus.INITIAL,
    states: {
      [BsvhuStatus.INITIAL]: {
        on: {
          EMISSION: {
            target: BsvhuStatus.SIGNED_BY_PRODUCER
          },
          // if the emitter is not registered on TD, the transporter
          // is the first to sign
          TRANSPORT: {
            target: BsvhuStatus.SENT,
            cond: "emitterCompanyNotOnTDAndIrregularSituation"
          }
        }
      },
      [BsvhuStatus.SIGNED_BY_PRODUCER]: {
        on: {
          TRANSPORT: {
            target: BsvhuStatus.SENT
          }
        }
      },
      [BsvhuStatus.SENT]: {
        on: {
          TRANSPORT: { target: BsvhuStatus.SENT }, // multi-modal
          RECEPTION: [
            {
              target: BsvhuStatus.REFUSED,
              cond: "isBsvhuRefused"
            },
            {
              target: BsvhuStatus.RECEIVED
            }
          ],
          OPERATION: [
            {
              target: BsvhuStatus.REFUSED,
              cond: "isBsvhuRefused"
            },
            {
              target: BsvhuStatus.PROCESSED
            }
          ]
        }
      },
      [BsvhuStatus.RECEIVED]: {
        on: {
          OPERATION: [
            {
              target: BsvhuStatus.PROCESSED
            }
          ]
        }
      },
      [BsvhuStatus.REFUSED]: { type: "final" },
      [BsvhuStatus.PROCESSED]: { type: "final" }
    }
  },
  {
    guards: {
      isBsvhuRefused: (_, event) =>
        event.bsvhu?.destinationReceptionAcceptationStatus === "REFUSED",
      emitterCompanyNotOnTDAndIrregularSituation: (_, event) =>
        !!event.bsvhu?.emitterIrregularSituation &&
        (!!event.emitterCompanyNotOnTD || !!event.bsvhu?.emitterNoSiret)
    }
  }
);
