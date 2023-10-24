import { Bsda, Prisma } from "@prisma/client";
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
        status: event.data.status
      };

    case "BsdaDeleted":
      return { ...currentState, isDeleted: true };

    case "BsdaRevisionRequestApplied":
      const { ...bsda } = event.data.content;
      return {
        ...currentState,
        ...fixMissTypings(bsda as Partial<Prisma.BsdaCreateInput>)
      };

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
    transporterTransportPlates: update.transporterTransportPlates as string[],
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
    transporterRecepisseValidityLimit: update.transporterRecepisseValidityLimit
      ? new Date(update.transporterRecepisseValidityLimit.toString())
      : undefined,
    transporterTransportTakenOverAt: update.transporterTransportTakenOverAt
      ? new Date(update.transporterTransportTakenOverAt.toString())
      : undefined,
    transporterTransportSignatureDate: update.transporterTransportSignatureDate
      ? new Date(update.transporterTransportSignatureDate.toString())
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
