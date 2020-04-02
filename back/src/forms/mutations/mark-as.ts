import { interpret, State } from "xstate";
import { getUserCompanies } from "../../companies/queries/userCompanies";
import { flattenObjectForDb } from "../form-converter";
import { GraphQLContext } from "../../types";
import { getError } from "../workflow/errors";
import { formWorkflowMachine } from "../workflow/machine";
import { ForbiddenError } from "apollo-server-express";

export async function markAsSealed(_, { id }, context: GraphQLContext) {
  return transitionForm(id, { eventType: "MARK_SEALED" }, context);
}

export function markAsSent(_, { id, sentInfo }, context: GraphQLContext) {
  return transitionForm(
    id,
    { eventType: "MARK_SENT", eventParams: sentInfo },
    context
  );
}

export function markAsReceived(
  _,
  { id, receivedInfo },
  context: GraphQLContext
) {
  return transitionForm(
    id,
    { eventType: "MARK_RECEIVED", eventParams: receivedInfo },
    context
  );
}

export function markAsProcessed(
  _,
  { id, processedInfo },
  context: GraphQLContext
) {
  return transitionForm(
    id,
    { eventType: "MARK_PROCESSED", eventParams: processedInfo },
    context,
    infos => flattenObjectForDb(infos)
  );
}

export async function signedByTransporter(
  _,
  { id, signingInfo },
  context: GraphQLContext
) {
  const transformEventToFormParams = infos => ({
    signedByTransporter: infos.signedByTransporter,
    sentAt: infos.sentAt,
    sentBy: infos.sentBy,
    wasteDetailsPackagings: infos.packagings,
    wasteDetailsQuantity: infos.quantity,
    wasteDetailsOnuCode: infos.onuCode
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
  context: GraphQLContext,
  transformEventToFormProps = v => v
) {
  const form = await context.prisma.form({ id: formId });

  const formPropsFromEvent = transformEventToFormProps(eventParams);

  const startingState = State.from(form.status, {
    form: { ...form, ...formPropsFromEvent },
    requestContext: context,
    isStableState: true
  });

  if (
    !formWorkflowMachine
      .resolveState(startingState)
      .nextEvents.includes(eventType)
  ) {
    throw new ForbiddenError("Transition impossible");
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
      // If we reached one of those, we know the transition is over and we can safely update the form and return
      if (state.done || state.context.isStableState) {
        const newStatus = state.value;
        await logStatusChange(
          formId,
          newStatus,
          context,
          eventType,
          eventParams
        );

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
const fieldsToLog = {
  MARK_SEALED: [],
  MARK_SENT: ["sentBy", "sentAt"],
  MARK_SIGNED_BY_TRANSPORTER: [
    "sentAt",
    "signedByTransporter",
    "securityCode",
    "sentBy",
    "signedByProducer",
    "packagings",
    "quantity",
    "onuCode"
  ],
  MARK_RECEIVED: ["receivedBy", "receivedAt", "quantityReceived"],
  MARK_PROCESSED: [
    "processedBy",
    "processedAt",
    "processingOperationDone",
    "processingOperationDescription",
    "noTraceability",
    "nextDestinationProcessingOperation",
    "nextDestinationDetails",
    "nextDestinationCompanyName",
    "nextDestinationCompanySiret",
    "nextDestinationCompanyAddress",
    "nextDestinationCompanyContact",
    "nextDestinationCompanyPhone",
    "nextDestinationCompanyMail"
  ]
};

const getSubset = fields => o =>
  fields.reduce((acc, curr) => ({ ...acc, [curr]: o[curr] }), {});

const getDiff = (eventType, params) => {
  if (!eventType) {
    return {};
  }
  const fields = fieldsToLog[eventType];
  return getSubset(fields)(params);
};
export function logStatusChange(
  formId,
  status,
  context: GraphQLContext,
  eventType: string,
  eventParams: any
) {
  const diff = getDiff(eventType, eventParams);

  return context.prisma
    .createStatusLog({
      form: { connect: { id: formId } },
      user: { connect: { id: context.user.id } },
      status,
      loggedAt: new Date(),
      updatedFields: diff
    })
    .catch(err => {
      console.error(
        `Cannot log status change for form ${formId}, user ${context.user.id}, status ${status}`,
        err
      );
      throw new Error("Problème technique, merci de réessayer plus tard.");
    });
}
