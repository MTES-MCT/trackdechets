import { Form, Prisma, Status } from "@prisma/client";
import prisma from "../../prisma";
import { Event } from "./types";
import machine from "./machine";
import { InvalidTransition } from "../errors";
import { formDiff } from "./diff";
import { eventEmitter, TDEvent } from "../../events/emitter";
import { indexForm } from "../elastic";

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
  const temporaryStorageDetail = await prisma.form
    .findUnique({ where: { id: form.id } })
    .temporaryStorageDetail();

  // update form
  const updatedForm = await prisma.form.update({
    where: { id: form.id },
    data: formUpdateInput,
    include: { temporaryStorageDetail: true, transportSegments: true }
  });

  // calculates diff between initial form and updated form
  const updatedFields = formDiff(
    { ...form, temporaryStorageDetail },
    // FIXME: formDiff is not prepared to diff a form with .transportSegments
    updatedForm
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
  // FIXME: it should update the existing document, not create a new one
  await indexForm(updatedForm);

  return updatedForm;
}
