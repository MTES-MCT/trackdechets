import { BsvhuForm, BsvhuStatus } from "@prisma/client";
import { Machine } from "xstate";
import { SignatureTypeInput } from "../generated/graphql/types";

type Event = {
  type: SignatureTypeInput;
  bsvhu: BsvhuForm;
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
      [BsvhuStatus.REFUSED]: { type: "final" },
      [BsvhuStatus.PROCESSED]: { type: "final" }
    }
  },
  {
    guards: {
      isBsvhuRefused: (_, event) =>
        event.bsvhu?.destinationReceptionAcceptationStatus === "REFUSED"
    }
  }
);
