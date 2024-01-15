import { Prisma, Status, WasteAcceptationStatus } from "@prisma/client";
import { Machine } from "xstate";
import {
  isForeignVat,
  isSiret,
  PROCESSING_OPERATIONS_GROUPEMENT_CODES
} from "@td/constants";
import { Event, EventType } from "./types";
import { hasPipeline } from "../validation";

/**
 * Workflow state machine
 */
const machine = Machine<any, Event>(
  {
    id: "form-workflow-machine",
    initial: Status.DRAFT,
    states: {
      [Status.CANCELED]: { type: "final" },
      [Status.DRAFT]: {
        on: {
          [EventType.MarkAsSealed]: [{ target: Status.SEALED }]
        }
      },
      [Status.SEALED]: {
        on: {
          [EventType.SignedByTransporter]: [
            {
              target: Status.SENT
            }
          ],
          [EventType.ImportPaperForm]: [
            {
              target: Status.NO_TRACEABILITY,
              cond: "isExemptOfTraceability"
            },
            { target: Status.AWAITING_GROUP, cond: "awaitsGroup" },
            { target: Status.PROCESSED }
          ],
          [EventType.SignedByProducer]: [
            {
              target: Status.SIGNED_BY_PRODUCER,
              cond: "notPipeline"
            },
            {
              target: Status.SENT,
              cond: "hasPipeline"
            }
          ]
        }
      },
      [Status.SIGNED_BY_PRODUCER]: {
        on: {
          [EventType.SignedByTransporter]: [
            {
              target: Status.SENT
            }
          ]
        }
      },
      [Status.SENT]: {
        on: {
          [EventType.MarkAsTempStored]: [
            {
              target: Status.REFUSED,
              cond: "isFormRefused"
            },
            {
              target: Status.TEMP_STORER_ACCEPTED,
              cond: "isFormAccepted"
            },
            {
              target: Status.TEMP_STORED
            }
          ],
          [EventType.MarkAsReceived]: [
            {
              target: Status.REFUSED,
              cond: "isFormRefused"
            },
            {
              target: Status.ACCEPTED,
              cond: "isFormAccepted"
            },
            {
              target: Status.RECEIVED
            }
          ],
          // When a transporter N > 1 signs, the BSDD stays in the same status
          [EventType.SignedByTransporter]: [{ target: Status.SENT }]
        }
      },
      [Status.REFUSED]: { type: "final" },
      [Status.RECEIVED]: {
        on: {
          [EventType.MarkAsAccepted]: [
            {
              target: Status.REFUSED,
              cond: "isFormRefused"
            },
            {
              target: Status.ACCEPTED
            }
          ]
        }
      },
      [Status.ACCEPTED]: {
        on: {
          [EventType.MarkAsProcessed]: [
            {
              target: Status.NO_TRACEABILITY,
              cond: "isExemptOfTraceability"
            },
            {
              target: Status.FOLLOWED_WITH_PNTTD,
              cond: "isFollowedWithPnttd"
            },
            {
              target: Status.AWAITING_GROUP,
              cond: "awaitsGroup"
            },
            {
              target: Status.PROCESSED
            }
          ],
          [EventType.MarkAsResealed]: [
            {
              target: Status.RESEALED
            }
          ]
        }
      },
      [Status.PROCESSED]: { type: "final" },
      [Status.FOLLOWED_WITH_PNTTD]: { type: "final" },
      [Status.NO_TRACEABILITY]: { type: "final" },
      [Status.AWAITING_GROUP]: {
        on: {
          [EventType.MarkAsGrouped]: { target: Status.GROUPED }
        }
      },
      [Status.GROUPED]: {
        on: { [EventType.MarkAsProcessed]: { target: Status.PROCESSED } }
      },
      [Status.TEMP_STORED]: {
        on: {
          [EventType.MarkAsTempStorerAccepted]: [
            {
              target: Status.REFUSED,
              cond: "isFormRefused"
            },
            {
              target: Status.TEMP_STORER_ACCEPTED
            }
          ]
        }
      },
      [Status.TEMP_STORER_ACCEPTED]: {
        on: {
          [EventType.MarkAsResealed]: [
            {
              target: Status.RESEALED
            }
          ],
          [EventType.MarkAsResent]: [
            {
              target: Status.RESENT
            }
          ],
          [EventType.MarkAsProcessed]: [
            {
              target: Status.NO_TRACEABILITY,
              cond: "isExemptOfTraceability"
            },
            {
              target: Status.FOLLOWED_WITH_PNTTD,
              cond: "isFollowedWithPnttd"
            },
            {
              target: Status.AWAITING_GROUP,
              cond: "awaitsGroup"
            },
            {
              target: Status.PROCESSED
            }
          ]
        }
      },
      [Status.RESEALED]: {
        on: {
          [EventType.MarkAsResent]: [
            {
              target: Status.RESENT
            }
          ],
          [EventType.SignedByTransporter]: [
            {
              target: Status.RESENT
            }
          ],
          [EventType.SignedByTempStorer]: [
            {
              target: Status.SIGNED_BY_TEMP_STORER
            }
          ]
        }
      },
      [Status.SIGNED_BY_TEMP_STORER]: {
        on: {
          [EventType.MarkAsResent]: [
            {
              target: Status.RESENT
            }
          ]
        }
      },
      [Status.RESENT]: {
        on: {
          [EventType.MarkAsReceived]: [
            {
              target: Status.REFUSED,
              cond: "isFormRefused"
            },
            {
              target: Status.ACCEPTED,
              cond: "isFormAccepted"
            },
            {
              target: Status.RECEIVED
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
      isExemptOfTraceability: (_, event) => {
        function guard(update: Prisma.FormUpdateInput | undefined) {
          if (!update) return false;
          return update.noTraceability === true;
        }
        return (
          guard(event.formUpdateInput) ||
          guard(event.formUpdateInput?.forwardedIn?.update)
        );
      },
      awaitsGroup: (_, event) => {
        function guard(update: Prisma.FormUpdateInput | undefined) {
          if (!update) return false;
          return (
            PROCESSING_OPERATIONS_GROUPEMENT_CODES.includes(
              update.processingOperationDone as string
            ) &&
            !isForeignNextDestination(update) &&
            !(update.noTraceability === true) &&
            update.emitterType !== "APPENDIX1_PRODUCER"
          );
        }
        return (
          guard(event.formUpdateInput) ||
          guard(event.formUpdateInput?.forwardedIn?.update)
        );
      },
      isFollowedWithPnttd: (_, event) => {
        function guard(update: Prisma.FormUpdateInput | undefined) {
          if (!update) return false;
          return (
            PROCESSING_OPERATIONS_GROUPEMENT_CODES.includes(
              update.processingOperationDone as string
            ) &&
            isForeignNextDestination(update) &&
            update.noTraceability !== true
          );
        }
        return (
          guard(event.formUpdateInput) ||
          guard(event.formUpdateInput?.forwardedIn?.update)
        );
      },
      isFormRefused: (_, event) => {
        function guard(update: Prisma.FormUpdateInput | undefined) {
          if (!update) return false;
          return update.wasteAcceptationStatus === "REFUSED";
        }

        return (
          guard(event.formUpdateInput) ||
          guard(event.formUpdateInput?.forwardedIn?.update)
        );
      },
      isFormAccepted: (_, event) => {
        function guard(update: Prisma.FormUpdateInput | undefined) {
          if (!update) return false;
          return [
            WasteAcceptationStatus.ACCEPTED,
            WasteAcceptationStatus.PARTIALLY_REFUSED
          ].includes(update.wasteAcceptationStatus as any);
        }
        return (
          guard(event.formUpdateInput) ||
          guard(event.formUpdateInput?.forwardedIn?.update)
        );
      },
      hasPipeline: (_, event) =>
        !!event.formUpdateInput?.wasteDetailsPackagingInfos &&
        hasPipeline(event.formUpdateInput as any),
      notPipeline: (_, event) =>
        !event.formUpdateInput?.wasteDetailsPackagingInfos ||
        !hasPipeline(event.formUpdateInput as any)
    }
  }
);

/**
 * Determine whether nextDestionation is foreign based on a priority guessing system
 */
function isForeignNextDestination(update: Prisma.FormUpdateInput) {
  if (update.nextDestinationCompanyExtraEuropeanId) {
    return true;
  }
  if (
    update.nextDestinationCompanyVatNumber &&
    isForeignVat(update.nextDestinationCompanyVatNumber as string)
  ) {
    return true;
  }
  if (
    update.nextDestinationCompanySiret &&
    isSiret(update.nextDestinationCompanySiret as string)
  ) {
    return false;
  }
  if (
    !!update.nextDestinationCompanyCountry &&
    update.nextDestinationCompanyCountry !== "FR"
  ) {
    return true;
  }
  return false;
}

export default machine;
