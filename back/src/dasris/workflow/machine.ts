import { Machine } from "xstate";
import { DasriState, DasriEventType, DasriEvent } from "./types";
import { WasteAcceptationStatus } from "@prisma/client";
/**
 * Workflow state machine for dasris
 */
const machine = Machine<any, DasriEvent>(
  {
    id: "dasri-workflow-machine",
    initial: DasriState.Draft,
    states: {
      [DasriState.Draft]: {
        on: {
          [DasriEventType.MarkAsReady]: [{ target: DasriState.Sealed }]
        }
      },
      [DasriState.Sealed]: {
        on: {
          [DasriEventType.SignEmission]: [
            { target: DasriState.ReadyForTakeover, cond: "emissionNotSigned" }
          ],
          [DasriEventType.SignTransport]: [
            { target: DasriState.Sent, cond: "acceptedByTransporter" },
            { target: DasriState.Refused, cond: "refusedByTransporter" }
          ],
          [DasriEventType.SignEmissionWithSecretCode]: [
            { target: DasriState.ReadyForTakeover, cond: "emissionNotSigned" }
          ]
        }
      },
      [DasriState.ReadyForTakeover]: {
        on: {
          [DasriEventType.SignTransport]: [
            { target: DasriState.Sent, cond: "acceptedByTransporter" },
            { target: DasriState.Refused, cond: "refusedByTransporter" }
          ]
        }
      },
      [DasriState.Sent]: {
        on: {
          [DasriEventType.SignReception]: [
            { target: DasriState.Received, cond: "acceptedByRecipient" },
            { target: DasriState.Refused, cond: "refusedByRecipient" }
          ]
        }
      },
      [DasriState.Received]: {
        on: {
          [DasriEventType.SignOperation]: [
            { target: DasriState.Processed, cond: "processNotSigned" }
          ]
        }
      },
      [DasriState.Processed]: {
        type: "final"
      },
      [DasriState.Refused]: {
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
          ].includes(ctx?.transporterWasteAcceptationStatus)
        );
      },
      refusedByTransporter: ctx => {
        //  totally refused
        return (
          emissionNotSigned(ctx) &&
          ctx?.transporterWasteAcceptationStatus ===
            WasteAcceptationStatus.REFUSED
        );
      },
      acceptedByRecipient: ctx => {
        // partially or totally accepted
        return (
          receptionNotSigned(ctx) &&
          [
            WasteAcceptationStatus.ACCEPTED,
            WasteAcceptationStatus.PARTIALLY_REFUSED
          ].includes(ctx?.recipientWasteAcceptationStatus)
        );
      },
      refusedByRecipient: ctx => {
        //  totally refused
        return (
          receptionNotSigned(ctx) &&
          ctx?.recipientWasteAcceptationStatus ===
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
