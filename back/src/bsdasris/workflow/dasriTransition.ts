import { Bsdasri, Prisma, BsdasriStatus } from "@prisma/client";
import prisma from "../../prisma";
import { BsdasriEvent } from "./types";
import machine from "./machine";
import { InvalidTransition } from "../../forms/errors";
import { validateBsdasri, BsdasriValidationContext } from "../validation";

/**
 * Transition a form from initial state (ex: SENT) to next state (ex: RECEIVED)
 * Allowed transitions are defined as a state machine using xstate
 */
export default async function dasriTransition(
  bsdasri: Bsdasri,
  event: BsdasriEvent,
  validationContext: BsdasriValidationContext,
  extraFields?: Partial<Bsdasri>
) {
  const currentStatus = bsdasri.status;

  await validateBsdasri(bsdasri, validationContext);
  // Use state machine to calculate new status
  const nextState = machine.transition(currentStatus, event, bsdasri);

  // This transition is not possible
  if (!nextState.changed) {
    throw new InvalidTransition();
  }

  const nextStatus = nextState.value as BsdasriStatus;

  const dasriUpdateInput: Prisma.BsdasriUpdateInput = {
    status: nextStatus,
    ...event.dasriUpdateInput,
    ...extraFields
  };

  // update dasri
  return prisma.bsdasri.update({
    where: { id: bsdasri.id },
    data: dasriUpdateInput,
    include: {
      grouping: { select: { id: true } },
      synthesizing: { select: { id: true } }
    }
  });
}
