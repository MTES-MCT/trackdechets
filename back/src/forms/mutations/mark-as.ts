import { interpret, State } from "xstate";
import { boolean, date, object, string, number } from "yup";
import { DomainError, ErrorCode } from "../../common/errors";
import { getUserCompanies } from "../../companies/queries/userCompanies";
import { Context } from "../../types";
import { getError } from "../workflow/errors";
import { formWorkflowMachine } from "../workflow/machine";

export async function markAsSealed(_, { id }, context: Context) {
  return transitionForm(id, { eventType: "MARK_SEALED" }, context);
}

export const markAsSent = {
  getValidationSchema: () =>
    object().shape({
      sentAt: date().required("Vous devez saisir une date d'envoi."),
      sentBy: string().required("Vous devez saisir un responsable de l'envoi.")
    }),
  resolve: (_, { id, sentInfo }, context: Context) =>
    transitionForm(
      id,
      { eventType: "MARK_SENT", eventParams: sentInfo },
      context
    )
};

export const markAsReceived = {
  getValidationSchema: () =>
    object().shape({
      isAccepted: boolean().required(
        "Vous devez préciser si vous acceptez ou non le déchet."
      ),
      receivedBy: string().required(
        "Vous devez saisir un responsable de la réception."
      ),
      receivedAt: date().required("Vous devez saisir une date de réception."),
      quantityReceived: number().positive(
        "Vous devez saisir une quantité reçue supérieure à 0."
      )
    }),
  resolve: (_, { id, receivedInfo }, context: Context) =>
    transitionForm(
      id,
      { eventType: "MARK_RECEIVED", eventParams: receivedInfo },
      context
    )
};

export const markAsProcessed = {
  getValidationSchema: () =>
    object().shape({
      processingOperationDone: string().matches(
        /(R|D)\s\d{1,2}/,
        "Cette opération de traitement n'existe pas."
      ),
      processingOperationDescription: string().required(
        "Vous devez renseigner la description de l'opération."
      ),
      processedBy: string().required(
        "Vous devez saisir un responsable de traitement."
      ),
      processedAt: date().required("Vous devez saisir la date de traitement."),
      nextDestinationProcessingOperation: string().nullable(true),
      nextDestinationDetails: string().nullable(true),
      noTraceability: boolean().nullable(true)
    }),
  resolve: (_, { id, processedInfo }, context: Context) =>
    transitionForm(
      id,
      { eventType: "MARK_PROCESSED", eventParams: processedInfo },
      context
    )
};

export async function signedByTransporter(
  _,
  { id, signingInfo },
  context: Context
) {
  const input = {
    ...signingInfo,
    sentAt: signingInfo.sentAt,
    sentBy: signingInfo.sentBy,
    wasteDetailsPackagings: signingInfo.packagings,
    wasteDetailsQuantity: signingInfo.quantity,
    wasteDetailsOnuCode: signingInfo.onuCode
  };

  return transitionForm(
    id,
    { eventType: "MARK_SIGNED_BY_TRANSPORTER", eventParams: input },
    context
  );
}

async function transitionForm(
  formId: string,
  { eventType, eventParams = {} }: { eventType: string; eventParams?: any },
  context: Context
) {
  const form = await context.prisma.form({ id: formId });

  const userCompanies = await getUserCompanies(context.user.id);
  const actorSirets = userCompanies.map(c => c.siret);

  const startingState = State.from(form.status, {
    form: { ...form, ...eventParams },
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
          data: { status: newStatus, ...eventParams }
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
