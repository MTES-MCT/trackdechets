import { Machine } from "xstate";
import { BsdasriEvent } from "./types";
import { WasteAcceptationStatus, BsdasriStatus } from "@prisma/client";
import { DASRI_GROUPING_OPERATIONS_CODES } from "../../common/constants";

/**
 * Workflow state machine for dasris
 */
const machine = Machine<any, BsdasriEvent>(
  {
    id: "dasri-workflow-machine",
    initial: BsdasriStatus.INITIAL,
    states: {
      [BsdasriStatus.INITIAL]: {
        on: {
          ["EMISSION"]: [
            {
              target: BsdasriStatus.SIGNED_BY_PRODUCER,
              cond: "emissionNotSigned"
            }
          ],
          ["TRANSPORT"]: [
            { target: BsdasriStatus.SENT, cond: "acceptedByTransporter" },
            { target: BsdasriStatus.REFUSED, cond: "refusedByTransporter" }
          ]
        }
      },
      [BsdasriStatus.SIGNED_BY_PRODUCER]: {
        on: {
          ["TRANSPORT"]: [
            { target: BsdasriStatus.SENT, cond: "acceptedByTransporter" },
            { target: BsdasriStatus.REFUSED, cond: "refusedByTransporter" }
          ]
        }
      },
      [BsdasriStatus.SENT]: {
        on: {
          ["RECEPTION"]: [
            { target: BsdasriStatus.RECEIVED, cond: "acceptedByRecipient" },
            { target: BsdasriStatus.REFUSED, cond: "refusedByRecipient" }
          ]
        }
      },
      [BsdasriStatus.RECEIVED]: {
        on: {
          ["OPERATION"]: [
            { target: BsdasriStatus.AWAITING_GROUP, cond: "hasGroupingCode" },
            { target: BsdasriStatus.PROCESSED, cond: "processNotSigned" }
          ]
        }
      },
      [BsdasriStatus.PROCESSED]: {
        type: "final"
      },
      [BsdasriStatus.REFUSED]: {
        type: "final"
      },
      [BsdasriStatus.AWAITING_GROUP]: {
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
        !ctx?.recipientSignedBy && !ctx?.recipientSignedAt,
      hasGroupingCode: ctx =>
        DASRI_GROUPING_OPERATIONS_CODES.includes(ctx?.destinationOperationCode)
    }
  }
);

export default machine;

const emissionNotSigned = ctx => {
  return !ctx?.emitterSignedBy && !ctx.emitterSignedAt;
};
const transportNotSigned = ctx =>
  !ctx?.transporterSignedBy && !ctx.transporterSignedAt;
const receptionNotSigned = ctx =>
  !ctx?.recipientSignedBy && !ctx.recipientSignedAt;
