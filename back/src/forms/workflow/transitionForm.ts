import { interpret, State } from "xstate";
import { GraphQLContext } from "../../types";
import { getError } from "./errors";
import { formWorkflowMachine } from "./machine";
import { ForbiddenError } from "apollo-server-express";
import { prisma, Form as PrismaForm } from "../../generated/prisma-client";
import { Form, FormStatus } from "../../generated/graphql/types";

export default async function transitionForm(
  form: PrismaForm,
  { eventType, eventParams = {} }: { eventType: string; eventParams?: any },
  context: GraphQLContext,
  transformEventToFormProps = v => v
) {
  const temporaryStorageDetail = await prisma
    .form({ id: form.id })
    .temporaryStorageDetail();

  const formPropsFromEvent = transformEventToFormProps(eventParams);

  // to receive simple multimodal form, we need to be sure there is no segment left wo need to be taken over
  // get segments here for MARK_RECEIVED event because awaiting in xstate is tricky
  const transportSegments =
    eventType === "MARK_RECEIVED"
      ? await prisma.transportSegments({
          where: {
            form: { id: form.id }
          }
        })
      : [];
  const startingState = State.from(form.status, {
    form: {
      ...form,
      ...formPropsFromEvent,
      temporaryStorageDetail,
      transportSegments
    },
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
  return new Promise<Form>((resolve, reject) => {
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
          form.id,
          newStatus,
          context,
          eventType,
          eventParams
        );

        const updatedForm = await prisma.updateForm({
          where: { id: form.id },
          data: { status: newStatus, ...formPropsFromEvent }
        });
        resolve({ ...updatedForm, status: updatedForm.status as FormStatus });
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
    "sentBy",
    "signedByProducer",
    "packagings",
    "quantity",
    "onuCode"
  ],
  MARK_RECEIVED: ["receivedBy", "receivedAt", "signedAt", "quantityReceived"],
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
  ],
  MARK_TEMP_STORED: [
    "receivedBy",
    "receivedAt",
    "signedAt",
    "quantityReceived",
    "quantityType"
  ],
  MARK_RESEALED: [
    "destinationIsFilledByEmitter",
    "destinationCompanyName",
    "destinationCompanySiret",
    "destinationCompanyAddress",
    "destinationCompanyContact",
    "destinationCompanyPhone",
    "destinationCompanyMail",
    "destinationCap",
    "destinationProcessingOperation",
    "wasteDetailsOnuCode",
    "wasteDetailsPackagings",
    "wasteDetailsOtherPackaging",
    "wasteDetailsNumberOfPackages",
    "wasteDetailsQuantity",
    "wasteDetailsQuantityType"
  ],
  MARK_RESENT: [
    "destinationIsFilledByEmitter",
    "destinationCompanyName",
    "destinationCompanySiret",
    "destinationCompanyAddress",
    "destinationCompanyContact",
    "destinationCompanyPhone",
    "destinationCompanyMail",
    "destinationCap",
    "destinationProcessingOperation",
    "signedBy",
    "signedAt",
    "wasteDetailsOnuCode",
    "wasteDetailsPackagings",
    "wasteDetailsOtherPackaging",
    "wasteDetailsNumberOfPackages",
    "wasteDetailsQuantity",
    "wasteDetailsQuantityType"
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

  return prisma
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
