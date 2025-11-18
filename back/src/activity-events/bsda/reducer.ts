import { Bsda, Prisma } from "@td/prisma";
import { BsdaEvent } from "./types";

export function bsdaReducer(
  currentState: Partial<Bsda>,
  event: BsdaEvent
): Partial<Bsda> {
  switch (event.type) {
    case "BsdaCreated": {
      const {
        updatedAt,
        createdAt,
        grouping,
        intermediaries,
        wasteSealNumbers,
        intermediariesOrgIds,
        canAccessDraftOrgIds,
        transporters,
        ...bsda
      } = event.data;

      return {
        id: event.streamId,
        ...fixMissTypings(bsda)
      };
    }
    case "BsdaUpdated": {
      const {
        id,
        updatedAt,
        createdAt,
        grouping,
        intermediaries,
        intermediariesOrgIds,
        canAccessDraftOrgIds,
        transporters,
        forwarding,
        ...bsda
      } = event.data;

      return {
        ...currentState,
        ...fixMissTypings(bsda as Prisma.BsdaCreateInput)
      };
    }
    case "BsdaSigned":
      return {
        ...currentState,
        ...(event.data.status ? { status: event.data.status } : {})
      };

    case "BsdaDeleted":
      return { ...currentState, isDeleted: true };

    case "BsdaRevisionRequestApplied": {
      const { ...bsda } = event.data.content;
      return {
        ...currentState,
        ...fixMissTypings(bsda as Partial<Prisma.BsdaCreateInput>)
      };
    }

    default:
      throw "Unexpected event type";
  }
}

function fixMissTypings(
  update: Partial<
    Omit<Prisma.BsdaCreateInput, "updatedAt" | "createdAt" | "grouping">
  >
) {
  const patch = {
    ...update,
    wasteSealNumbers: update.wasteSealNumbers as string[],
    packagings: update.packagings as Prisma.JsonValue,
    emitterEmissionSignatureDate: update.emitterEmissionSignatureDate
      ? new Date(update.emitterEmissionSignatureDate.toString())
      : undefined,
    brokerRecepisseValidityLimit: update.brokerRecepisseValidityLimit
      ? new Date(update.brokerRecepisseValidityLimit.toString())
      : undefined,
    destinationReceptionDate: update.destinationReceptionDate
      ? new Date(update.destinationReceptionDate.toString())
      : undefined,
    destinationOperationDate: update.destinationOperationDate
      ? new Date(update.destinationOperationDate.toString())
      : undefined,
    destinationOperationSignatureDate: update.destinationOperationSignatureDate
      ? new Date(update.destinationOperationSignatureDate.toString())
      : undefined,
    workerWorkSignatureDate: update.workerWorkSignatureDate
      ? new Date(update.workerWorkSignatureDate.toString())
      : undefined
  };

  return Object.keys(patch).reduce((prev, cur) => {
    if (patch[cur]) {
      prev[cur] = patch[cur];
    }
    return prev;
  }, {});
}
