import { Bsdasri, Prisma } from "@td/prisma";
import { BsdasriEvent } from "./types";

export function bsdasriReducer(
  currentState: Partial<Bsdasri>,
  event: BsdasriEvent
): Partial<Bsdasri> {
  switch (event.type) {
    case "BsdasriCreated": {
      const {
        updatedAt,
        createdAt,
        grouping,

        ...bsdasri
      } = event.data;

      return {
        id: event.streamId,
        ...fixMissTypings(bsdasri)
      };
    }
    case "BsdasriUpdated": {
      const {
        id,
        updatedAt,
        createdAt,
        grouping,

        ...bsdasri
      } = event.data;

      return {
        ...currentState,
        ...fixMissTypings(bsdasri as Prisma.BsdasriCreateInput)
      };
    }
    case "BsdasriSigned":
      return {
        ...currentState,
        status: event.data.status
      };

    case "BsdasriDeleted":
      return { ...currentState, isDeleted: true };

    case "BsdasriRevisionRequestApplied": {
      const { ...bsdasri } = event.data.content;
      return {
        ...currentState,
        ...fixMissTypings(bsdasri as Partial<Prisma.BsdasriCreateInput>)
      };
    }

    default:
      throw new Error("Unexpected event type");
  }
}

function fixMissTypings(
  update: Partial<
    Omit<Prisma.BsdasriCreateInput, "updatedAt" | "createdAt" | "grouping">
  >
) {
  const patch = {
    ...update,

    // packagings: update.packagings as Prisma.JsonValue,
    emitterEmissionSignatureDate: update.emitterEmissionSignatureDate
      ? new Date(update.emitterEmissionSignatureDate.toString())
      : undefined,

    destinationReceptionDate: update.destinationReceptionDate
      ? new Date(update.destinationReceptionDate.toString())
      : undefined,
    destinationOperationDate: update.destinationOperationDate
      ? new Date(update.destinationOperationDate.toString())
      : undefined,
    destinationOperationSignatureDate: update.destinationOperationSignatureDate
      ? new Date(update.destinationOperationSignatureDate.toString())
      : undefined
  };

  return Object.keys(patch).reduce((prev, cur) => {
    if (patch[cur]) {
      prev[cur] = patch[cur];
    }
    return prev;
  }, {});
}
