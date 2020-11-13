import {
  Form,
  FormUpdateInput,
  Status,
  prisma,
  User
} from "../../generated/prisma-client";
import { Event } from "./types";
import machine from "./machine";
import { InvalidTransition } from "../errors";
import { formDiff } from "./diff";

/**
 * Transition a form from initial state (ex: DRAFT) to next state (ex: SEALED)
 * Allowed transitions are defined as a state machine using xstate
 * Data updates are applied along the way and we make sure this transition is
 * logged in the StatusLogs table
 */
export default async function transitionForm(
  user: User,
  form: Form,
  event: Event
) {
  const currentStatus = form.statusEnum;

  // Use state machine to calculate new status
  const nextState = machine.transition(currentStatus, event);

  // This transition is not possible
  if (!nextState.changed) {
    throw new InvalidTransition();
  }

  const nextStatus = nextState.value as Status;

  const formUpdateInput: FormUpdateInput = {
    statusEnum: nextStatus,
    ...event.formUpdateInput
  };

  // retrieves temp storage before update
  // for diff calculation
  const temporaryStorageDetail = await prisma
    .form({ id: form.id })
    .temporaryStorageDetail();

  // update form
  const updatedForm = await prisma.updateForm({
    where: { id: form.id },
    data: formUpdateInput
  });

  // retrieves updated temp storage
  const updatedTemporaryStorageDetail = await prisma
    .form({ id: updatedForm.id })
    .temporaryStorageDetail();

  // calculates diff between initial form and updated form
  const updatedFields = formDiff(
    { ...form, temporaryStorageDetail },
    { ...updatedForm, temporaryStorageDetail: updatedTemporaryStorageDetail }
  );

  // log status change
  await prisma.createStatusLog({
    user: { connect: { id: user.id } },
    form: { connect: { id: form.id } },
    status: nextStatus,
    loggedAt: new Date(),
    updatedFields
  });

  return updatedForm;
}
