import { Machine } from "xstate";
import { BsdasriState, BsdasriEventType, BsdasriEvent } from "./types";
import { WasteAcceptationStatus } from "@prisma/client";
/**
 * Workflow state machine for dasris
 */
const machine = Machine<any, BsdasriEvent>(
  {
    id: "dasri-workflow-machine",
    initial: BsdasriState.Initial,
    states: {
      [BsdasriState.Initial]: {
        on: {
          [BsdasriEventType.SignEmission]: [
            { target: BsdasriState.SignedByProducer, cond: "emissionNotSigned" }
          ],
          [BsdasriEventType.SignTransport]: [
            { target: BsdasriState.Sent, cond: "acceptedByTransporter" },
            { target: BsdasriState.Refused, cond: "refusedByTransporter" }
          ],
          [BsdasriEventType.SignEmissionWithSecretCode]: [
            { target: BsdasriState.SignedByProducer, cond: "emissionNotSigned" }
          ]
        }
      },
      [BsdasriState.SignedByProducer]: {
        on: {
          [BsdasriEventType.SignTransport]: [
            { target: BsdasriState.Sent, cond: "acceptedByTransporter" },
            { target: BsdasriState.Refused, cond: "refusedByTransporter" }
          ]
        }
      },
      [BsdasriState.Sent]: {
        on: {
          [BsdasriEventType.SignReception]: [
            { target: BsdasriState.Received, cond: "acceptedByRecipient" },
            { target: BsdasriState.Refused, cond: "refusedByRecipient" }
          ]
        }
      },
      [BsdasriState.Received]: {
        on: {
          [BsdasriEventType.SignOperation]: [
            { target: BsdasriState.Processed, cond: "processNotSigned" }
          ]
        }
      },
      [BsdasriState.Processed]: {
        type: "final"
      },
      [BsdasriState.Refused]: {
        type: "final"
      },
      error: {
        states: {}
      }
    }
  },
  {
    guards: {
      emissionNotSigned: ctx => emissionNotSigned(ctx),
      acceptedByTransporter: ctx => {
        // partially or totally accepted
        return (
          transportNotSigned(ctx) &&
          [
            WasteAcceptationStatus.ACCEPTED,
            WasteAcceptationStatus.PARTIALLY_REFUSED
          ].includes(ctx?.transporterAcceptationStatus)
        );
      },
      refusedByTransporter: ctx => {
        //  totally refused
        return (
          emissionNotSigned(ctx) &&
          ctx?.transporterAcceptationStatus === WasteAcceptationStatus.REFUSED
        );
      },
      acceptedByRecipient: ctx => {
        // partially or totally accepted
        return (
          receptionNotSigned(ctx) &&
          [
            WasteAcceptationStatus.ACCEPTED,
            WasteAcceptationStatus.PARTIALLY_REFUSED
          ].includes(ctx?.destinationReceptionAcceptationStatus)
        );
      },
      refusedByRecipient: ctx => {
        //  totally refused
        return (
          receptionNotSigned(ctx) &&
          ctx?.destinationReceptionAcceptationStatus ===
            WasteAcceptationStatus.REFUSED
        );
      },
      processNotSigned: ctx =>
        !ctx?.recipientSignedBy && !ctx?.recipientSignedAt
    }
  }
);

export default machine;

const emissionNotSigned = ctx => !ctx?.emitterSignedBy && !ctx.emitterSignedAt;
const transportNotSigned = ctx =>
  !ctx?.transporterSignedBy && !ctx.transporterSignedAt;
const receptionNotSigned = ctx =>
  !ctx?.recipientSignedBy && !ctx.recipientSignedAt;
