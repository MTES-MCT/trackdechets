import { Form, Prisma } from "@prisma/client";
import { BsddEvent } from "./types";

export function bsddReducer(
  currentState: Partial<Form>,
  event: BsddEvent
): Partial<Form> {
  switch (event.type) {
    case "BsddCreated": {
      const { owner, updatedAt, createdAt, appendix2Forms, ...bsdd } =
        event.data.content;
      return {
        id: event.streamId,
        status: "DRAFT",
        ...bsdd,
        ...dateConverter({}, bsdd)
      };
    }

    case "BsddUpdated": {
      const { owner, updatedAt, createdAt, appendix2Forms, ...bsdd } = event
        .data.content as Prisma.FormCreateInput; // TODO Check if we can we somehow keep Prisma.FormUpdateInput
      return {
        ...currentState,
        ...bsdd,
        ...dateConverter(currentState, event.data.content as any)
      };
    }

    case "BsddSigned":
      return {
        ...currentState,
        status: event.data.status
      };

    case "BsddDeleted":
      return { ...currentState, isDeleted: true };

    case "BsddRevisionRequestApplied":
      return {
        ...currentState,
        ...event.data.content,
        ...dateConverter(currentState, event.data.content)
      };

    default:
      throw "Unexpected event type";
  }
}

function dateConverter(
  currentState: Partial<Form>,
  update: Partial<Prisma.FormCreateInput>
) {
  return {
    transporterValidityLimit: getDateField(
      currentState,
      update,
      "transporterValidityLimit"
    ),
    traderValidityLimit: getDateField(
      currentState,
      update,
      "traderValidityLimit"
    ),
    brokerValidityLimit: getDateField(
      currentState,
      update,
      "brokerValidityLimit"
    ),
    emittedAt: getDateField(currentState, update, "emittedAt"),
    takenOverAt: getDateField(currentState, update, "takenOverAt"),
    sentAt: getDateField(currentState, update, "sentAt"),
    receivedAt: getDateField(currentState, update, "receivedAt"),
    processedAt: getDateField(currentState, update, "processedAt"),
    signedAt: getDateField(currentState, update, "signedAt")
  };
}

function getDateField(
  currentState: Partial<Form>,
  update: Partial<Prisma.FormCreateInput>,
  fieldName: string
) {
  if (update[fieldName]) {
    return new Date(update[fieldName]);
  }
  if (currentState[fieldName]) {
    return currentState[fieldName];
  }
  return null;
}
