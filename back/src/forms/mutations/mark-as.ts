import { interpret, State } from "xstate";
import { DomainError, ErrorCode } from "../../common/errors";
import { getUserCompanies } from "../../companies/queries/userCompanies";
import { Context } from "../../types";
import { getError } from "../workflow/errors";
import { formWorkflowMachine } from "../workflow/machine";

export async function markAsSealed(_, { id }, context: Context) {
  return transitionForm(id, { eventType: "MARK_SEALED" }, context);
}

export function markAsSent(_, { id, sentInfo }, context: Context) {
  return transitionForm(
    id,
    { eventType: "MARK_SENT", eventParams: sentInfo },
    context
  );
}

export function markAsReceived(_, { id, receivedInfo }, context: Context) {
  return transitionForm(
    id,
    { eventType: "MARK_RECEIVED", eventParams: receivedInfo },
    context
  );
}

export function markAsProcessed(_, { id, processedInfo }, context: Context) {
  return transitionForm(
    id,
    { eventType: "MARK_PROCESSED", eventParams: processedInfo },
    context
  );
}

export async function signedByTransporter(
  _,
  { id, signingInfo },
  context: Context
) {
  const transformEventToFormParams = signingInfo => ({
    signedByTransporter: signingInfo.signedByTransporter,
    signedByProducer: signingInfo.signedByProducer,
    sentAt: signingInfo.sentAt,
    sentBy: signingInfo.sentBy,
    wasteDetailsPackagings: signingInfo.packagings,
    wasteDetailsQuantity: signingInfo.quantity,
    wasteDetailsOnuCode: signingInfo.onuCode
  });

  return transitionForm(
    id,
    { eventType: "MARK_SIGNED_BY_TRANSPORTER", eventParams: signingInfo },
    context,
    transformEventToFormParams
  );
}

async function transitionForm(
  formId: string,
  { eventType, eventParams = {} }: { eventType: string; eventParams?: any },
  context: Context,
  transformEventToFormProps = v => v
) {
  const form = await context.prisma.form({ id: formId });
  const formPropsFromEvent = transformEventToFormProps(eventParams);

  const userCompanies = await getUserCompanies(context.user.id);
  const actorSirets = userCompanies.map(c => c.siret);

  const startingState = State.from(form.status, {
    form: { ...form, ...formPropsFromEvent },
    actorSirets,
    requestContext: context,
    isStableState: true
  });

  if (
    !formWorkflowMachine
      .resolveState(startingState)
      .nextEvents.includes(eventType)
  ) {
    throw new DomainError("Transition impossible", ErrorCode.FORBIDDEN);
  }

  const formService = interpret(formWorkflowMachine);

  // Machine transitions are always synchronous
  // We subscribe to the transitions and wait for a stable or final position before returning a result
  return new Promise((resolve, reject) => {
    formService.start(startingState).onTransition(async state => {
      if (!state.changed) {
        return;
      }

      if (state.matches("error")) {
        const workflowError = state.meta[Object.keys(state.meta)[0]];
        const error = await getError(workflowError, form);
        reject(error);
        formService.stop();
      }

      // `done` means we reached a final state (xstate concept)
      // `context.isStableState` is a concept introduced to differentiate form state with transient states (validation or side effects)
      // If we reached one of those, we konow the transition is over and we can safely update the form and return
      if (state.done || state.context.isStableState) {
        const newStatus = state.value;
        await logStatusChange(formId, newStatus, context);

        const updatedForm = context.prisma.updateForm({
          where: { id: formId },
          data: { status: newStatus, ...formPropsFromEvent }
        });
        resolve(updatedForm);
        formService.stop();
      }
    });

    formService.send({ type: eventType, ...eventParams });
  });
}

export function logStatusChange(formId, status, context: Context) {
  return context.prisma
    .createStatusLog({
      form: { connect: { id: formId } },
      user: { connect: { id: context.user.id } },
      status
    })
    .catch(err => {
      console.error(
        `Cannot log status change for form ${formId}, user ${context.user.id}, status ${status}`,
        err
      );
      throw new Error("Problème technique, merci de réessayer plus tard.");
    });
}
