import { interpret, State } from "xstate";
import { flattenObjectForDb } from "../form-converter";
import { GraphQLContext } from "../../types";
import { getError } from "../workflow/errors";
import { formWorkflowMachine } from "../workflow/machine";
import { ForbiddenError } from "apollo-server-express";
import { capitalize } from "../../common/strings";
import { prisma } from "../../generated/prisma-client";
import {
  MutationMarkAsSealedArgs,
  MutationMarkAsSentArgs,
  MutationMarkAsReceivedArgs,
  MutationMarkAsProcessedArgs,
  MutationSignedByTransporterArgs,
  MutationMarkAsTempStoredArgs,
  MutationMarkAsResealedArgs,
  MutationMarkAsResentArgs,
  Form,
  FormStatus
} from "../../generated/graphql/types";

export async function markAsSealed(
  { id }: MutationMarkAsSealedArgs,
  context: GraphQLContext
): Promise<Form> {
  return transitionForm(id, { eventType: "MARK_SEALED" }, context);
}

export function markAsSent(
  { id, sentInfo }: MutationMarkAsSentArgs,
  context: GraphQLContext
): Promise<Form> {
  return transitionForm(
    id,
    { eventType: "MARK_SENT", eventParams: sentInfo },
    context
  );
}

export function markAsReceived(
  { id, receivedInfo }: MutationMarkAsReceivedArgs,
  context: GraphQLContext
): Promise<Form> {
  return transitionForm(
    id,
    {
      eventType: "MARK_RECEIVED",
      eventParams: { signedAt: new Date(), ...receivedInfo }
    },
    context
  );
}

export function markAsProcessed(
  { id, processedInfo }: MutationMarkAsProcessedArgs,
  context: GraphQLContext
): Promise<Form> {
  return transitionForm(
    id,
    { eventType: "MARK_PROCESSED", eventParams: processedInfo },
    context,
    infos => flattenObjectForDb(infos)
  );
}

export async function signedByTransporter(
  { id, signingInfo }: MutationSignedByTransporterArgs,
  context: GraphQLContext
): Promise<Form> {
  const form = await prisma.form({ id });

  // BSD has already been sent, it must be a signature for frame 18
  if (form.sentAt) {
    const temporaryStorageDetail = await prisma
      .form({ id })
      .temporaryStorageDetail();

    const hasWasteDetailsOverride = !!temporaryStorageDetail.wasteDetailsQuantity;

    return transitionForm(
      id,
      { eventType: "MARK_SIGNED_BY_TRANSPORTER", eventParams: signingInfo },
      context,
      infos => {
        const wasteDetails = {
          wasteDetailsPackagings: infos.packagings,
          wasteDetailsQuantity: infos.quantity,
          wasteDetailsOnuCode: infos.onuCode
        };

        return {
          ...(!hasWasteDetailsOverride && wasteDetails),
          temporaryStorageDetail: {
            update: {
              signedBy: infos.sentBy,
              signedAt: infos.sentAt,
              signedByTransporter: infos.signedByTransporter,
              ...(hasWasteDetailsOverride && wasteDetails)
            }
          }
        };
      }
    );
  }

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

export function markAsTempStored(
  { id, tempStoredInfos }: MutationMarkAsTempStoredArgs,
  context: GraphQLContext
): Promise<Form> {
  const transformEventToFormParams = infos => ({
    temporaryStorageDetail: {
      update: {
        tempStorerSignedAt: new Date(), // Default value to now
        ...Object.keys(infos).reduce((prev, cur) => {
          prev[`tempStorer${capitalize(cur)}`] = infos[cur];
          return prev;
        }, {})
      }
    }
  });

  return transitionForm(
    id,
    { eventType: "MARK_TEMP_STORED", eventParams: tempStoredInfos },
    context,
    transformEventToFormParams
  );
}

export function markAsResealed(
  { id, resealedInfos }: MutationMarkAsResealedArgs,
  context: GraphQLContext
): Promise<Form> {
  const transformEventToFormParams = infos => ({
    temporaryStorageDetail: {
      update: flattenObjectForDb(infos)
    }
  });

  return transitionForm(
    id,
    { eventType: "MARK_RESEALED", eventParams: resealedInfos },
    context,
    transformEventToFormParams
  );
}

export function markAsResent(
  { id, resentInfos }: MutationMarkAsResentArgs,
  context: GraphQLContext
): Promise<Form> {
  const transformEventToFormParams = infos => ({
    temporaryStorageDetail: {
      update: {
        ...flattenObjectForDb(infos)
      }
    }
  });

  return transitionForm(
    id,
    { eventType: "MARK_RESENT", eventParams: resentInfos },
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
  const form = await prisma.form({ id: formId });
  const temporaryStorageDetail = await prisma
    .form({ id: formId })
    .temporaryStorageDetail();

  const formPropsFromEvent = transformEventToFormProps(eventParams);

  const startingState = State.from(form.status, {
    form: { ...form, ...formPropsFromEvent, temporaryStorageDetail },
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
          formId,
          newStatus,
          context,
          eventType,
          eventParams
        );

        const updatedForm = await prisma.updateForm({
          where: { id: formId },
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
