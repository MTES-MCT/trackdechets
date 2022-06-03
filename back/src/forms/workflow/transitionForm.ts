import { Form, Prisma, Status } from "@prisma/client";
import prisma from "../../prisma";
import { Event } from "./types";
import machine from "./machine";
import { InvalidTransition } from "../errors";
import { formDiff } from "./diff";
import { eventEmitter, TDEvent } from "../../events/emitter";
import { indexForm } from "../elastic";
import { getFullForm } from "../database";
import { GraphQLContext } from "../../types";
import { persistBsddEvent } from "../../activity-events/bsdd";

/**
 * Transition a form from initial state (ex: DRAFT) to next state (ex: SEALED)
 * Allowed transitions are defined as a state machine using xstate
 * Data updates are applied along the way and we make sure this transition is
 * logged in the StatusLogs table
 */
export default async function transitionForm(
  user: Express.User,
  form: Form,
  event: Event
) {
  const currentStatus = form.status;

  // Use state machine to calculate new status
  const nextState = machine.transition(currentStatus, event);

  // This transition is not possible
  if (!nextState.changed) {
    throw new InvalidTransition();
  }

  const nextStatus = nextState.value as Status;

  const formUpdateInput: Prisma.FormUpdateInput = {
    status: nextStatus,
    ...event.formUpdateInput
  };

  // retrieves temp storage before update
  // for diff calculation
  const forwardedIn = await prisma.form
    .findUnique({ where: { id: form.id } })
    .forwardedIn();

  // update form
  const updatedForm = await prisma.form.update({
    where: { id: form.id },
    data: formUpdateInput
  });

  // retrieves updated temp storage
  const updatedForwardedIn = await prisma.form
    .findUnique({ where: { id: updatedForm.id } })
    .forwardedIn();

  // calculates diff between initial form and updated form
  const updatedFields = await formDiff(
    { ...form, forwardedIn },
    { ...updatedForm, forwardedIn: updatedForwardedIn }
  );

  eventEmitter.emit<Form>(TDEvent.TransitionForm, {
    previousNode: form,
    node: updatedForm,
    updatedFields,
    mutation: "UPDATED"
  });

  // log status change
  await prisma.statusLog.create({
    data: {
      user: { connect: { id: user.id } },
      form: { connect: { id: form.id } },
      status: nextStatus,
      authType: user.auth,
      loggedAt: new Date(),
      updatedFields
    }
  });
  await persistBsddEvent({
    streamId: form.id,
    actor: user.id,
    type: "BsddUpdated",
    data: { content: formUpdateInput },
    metadata: { authType: user.auth }
  });
  await persistBsddEvent({
    streamId: form.id,
    actor: user.id,
    type: "BsddSigned",
    data: { status: nextStatus },
    metadata: { authType: user.auth }
  });

  const fullForm = await getFullForm(updatedForm);
  await indexForm(fullForm, { user } as GraphQLContext);

  return updatedForm;
}
