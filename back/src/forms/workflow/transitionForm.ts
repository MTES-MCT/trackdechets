import { Form, Status } from "@prisma/client";
import { InvalidTransition } from "../errors";
import machine from "./machine";
import { Event } from "./types";

/**
 * Transition a form from initial state (ex: DRAFT) to next state (ex: SEALED)
 * and returns the new state.
 * Allowed transitions are defined as a state machine using xstate
 */
export default function transitionForm(form: Form, event: Event): Status {
  const currentStatus = form.status;

  // Use state machine to calculate new status
  const nextState = machine.transition(currentStatus, event);

  if (nextState.transitions.length === 0) {
    // This transition is not possible
    throw new InvalidTransition();
  }

  return nextState.value as Status;
}
