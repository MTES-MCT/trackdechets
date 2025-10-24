import { Bsdasri, BsdasriStatus } from "@td/prisma";
import { BsdasriEvent } from "./types";
import machine from "./machine";
import { InvalidTransition } from "../../forms/errors";

/**
 * Transition a BSDASRI from initial state (ex: SENT) to next state (ex: RECEIVED)
 * Allowed transitions are defined as a state machine using xstate
 */
export async function getNextStatus(bsdasri: Bsdasri, event: BsdasriEvent) {
  if (bsdasri.isDraft) {
    throw new InvalidTransition();
  }
  const currentStatus = bsdasri.status;

  // Use state machine to calculate new status
  const nextState = machine.transition(currentStatus, event, bsdasri);

  // This transition is not possible
  if (!nextState.changed) {
    throw new InvalidTransition();
  }

  const nextStatus = nextState.value as BsdasriStatus;

  return nextStatus;
}
