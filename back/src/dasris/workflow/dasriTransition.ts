import { Dasri, Prisma, DasriStatus } from "@prisma/client";
import prisma from "../../prisma";
import { DasriEvent } from "./types";
import machine from "./machine";
import { InvalidTransition } from "../../forms/errors";
import { ObjectSchema } from "yup";

/**
 * Transition a form from initial state (ex: DRAFT) to next state (ex: SEALED)
 * Allowed transitions are defined as a state machine using xstate
 */
export default async function dasriTransition(
  dasri: Dasri,
  event: DasriEvent,
  validator?: ObjectSchema
) {
  const currentStatus = dasri.status;

  // are required dasri fields filled ?
  if (!!validator) {
    await validator.validate(dasri);
  }
  // Use state machine to calculate new status
  const nextState = machine.transition(currentStatus, event, dasri);

  // This transition is not possible
  if (!nextState.changed) {
    throw new InvalidTransition();
  }

  const nextStatus = nextState.value as DasriStatus;

  const dasriUpdateInput: Prisma.DasriUpdateInput = {
    status: nextStatus,
    ...event.dasriUpdateInput
  };

  // update dasri
  const updatedForm = await prisma.dasri.update({
    where: { id: dasri.id },
    data: dasriUpdateInput
  });

  return updatedForm;
}
