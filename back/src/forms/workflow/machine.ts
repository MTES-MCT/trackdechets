import { assign, Machine } from "xstate";
import { GROUP_CODES } from "../../common/constants";
import { WorkflowError } from "./errors";
import {
  markFormAppendixAwaitingFormsAsGrouped,
  markFormAppendixGroupedsAsProcessed,
  validateForm,
  validateSecurityCode
} from "./helpers";
import { FormState } from "./model";

export const formWorkflowMachine = Machine(
  {
    id: "form-workflow-machine",
    initial: FormState.Draft,
    context: {
      form: null,
      requestContext: null,
      isStableState: true
    },
    states: {
      [FormState.Draft]: {
        entry: "setStable",
        exit: "setUnStable",
        on: {
          MARK_SEALED: [{ target: "pendingSealedValidation" }],
          MARK_SENT: [{ target: "pendingSentValidation" }]
        }
      },
      [FormState.Sealed]: {
        entry: "setStable",
        exit: "setUnStable",
        on: {
          MARK_SENT: [{ target: "pendingSentValidation" }],
          MARK_SIGNED_BY_TRANSPORTER: [
            {
              target: "error.missingSignature",
              cond: "isMissingSignature"
            },
            {
              target: `pendingEmitterSecurityCodeValidation`
            }
          ]
        }
      },
      [FormState.Sent]: {
        entry: "setStable",
        exit: "setUnStable",
        on: {
          MARK_TEMP_STORED: [
            {
              target: FormState.Refused,
              cond: "isFormRefusedByTempStorage"
            },
            {
              target: FormState.TempStored,
              cond: "hasTempStorageDestination"
            },
            {
              target: "error.invalidTransition"
            }
          ],
          MARK_RECEIVED: [
            {
              target: "error.invalidTransition",
              cond: "hasTempStorageDestination"
            },
            {
              target: "pendingReceivedMarkFormAppendixGroupedsAsProcessed",
              cond: "isFormAccepted"
            },
            {
              target: FormState.Refused
            }
          ]
        }
      },
      [FormState.Refused]: { type: "final" },
      [FormState.Received]: {
        entry: "setStable",
        exit: "setUnStable",
        on: {
          MARK_PROCESSED: [
            {
              target: FormState.NoTraceability,
              cond: "isExemptOfTraceability"
            },
            {
              target: FormState.AwaitingGroup,
              cond: "awaitsGroup"
            },
            {
              target: FormState.Processed
            }
          ]
        }
      },
      pendingSealedMarkFormAppendixAwaitingFormsAsGrouped: {
        invoke: {
          id: "pendingSealedMarkFormAppendixAwaitingFormsAsGrouped",
          src: "markFormAppendixAwaitingFormsAsGrouped",
          onDone: { target: FormState.Sealed },
          onError: { target: "error.appendixError" }
        }
      },
      pendingSentMarkFormAppendixAwaitingFormsAsGrouped: {
        invoke: {
          id: "pendingSentMarkFormAppendixAwaitingFormsAsGrouped",
          src: "markFormAppendixAwaitingFormsAsGrouped",
          onDone: { target: FormState.Sent },
          onError: { target: "error.appendixError" }
        }
      },
      pendingSealedValidation: {
        invoke: {
          id: "validateBeforeSent",
          src: ctx => validateForm(ctx.form),
          onDone: {
            target: "pendingSealedMarkFormAppendixAwaitingFormsAsGrouped"
          },
          onError: { target: "error.invalidForm" }
        }
      },
      pendingSentValidation: {
        invoke: {
          id: "validateBeforeSent",
          src: ctx => validateForm(ctx.form),
          onDone: {
            target: "pendingSentMarkFormAppendixAwaitingFormsAsGrouped"
          },
          onError: { target: "error.invalidForm" }
        }
      },
      pendingEmitterSecurityCodeValidation: {
        invoke: {
          src: (ctx, event) =>
            validateSecurityCode(
              ctx.form.emitterCompanySiret,
              event.securityCode
            ),
          onDone: {
            target: "pendingSentMarkFormAppendixAwaitingFormsAsGrouped"
          },
          onError: { target: "error.invalidSecurityCode" }
        }
      },
      pendingTempStorerSecurityCodeValidation: {
        invoke: {
          src: (ctx, event) =>
            validateSecurityCode(
              ctx.form.recipientCompanySiret,
              event.securityCode
            ),
          onDone: {
            target: FormState.Resent
          },
          onError: { target: "error.invalidSecurityCode" }
        }
      },
      pendingReceivedMarkFormAppendixGroupedsAsProcessed: {
        invoke: {
          id: "pendingReceivedMarkFormAppendixGroupedsAsProcessed",
          src: "markFormAppendixGroupedsAsProcessed",
          onDone: { target: FormState.Received },
          onError: { target: "error.appendixError" }
        }
      },
      [FormState.Processed]: { type: "final" },
      [FormState.NoTraceability]: { type: "final" },
      [FormState.AwaitingGroup]: { type: "final" },
      [FormState.TempStored]: {
        entry: "setStable",
        exit: "setUnStable",
        on: {
          MARK_RESEALED: [
            {
              target: FormState.Resealed
            }
          ],
          MARK_RESENT: [
            {
              target: FormState.Resent
            }
          ]
        }
      },
      [FormState.Resealed]: {
        entry: "setStable",
        exit: "setUnStable",
        on: {
          MARK_RESENT: [
            {
              target: FormState.Resent
            }
          ],
          MARK_SIGNED_BY_TRANSPORTER: [
            {
              target: "error.missingSignature",
              cond: "isMissingSignature"
            },
            {
              target: `pendingTempStorerSecurityCodeValidation`
            }
          ]
        }
      },
      [FormState.Resent]: {
        entry: "setStable",
        exit: "setUnStable",
        on: {
          MARK_RECEIVED: [
            {
              target: "pendingReceivedMarkFormAppendixGroupedsAsProcessed",
              cond: "isFormAccepted"
            },
            {
              target: FormState.Refused
            }
          ]
        }
      },
      error: {
        states: {
          invalidForm: { meta: WorkflowError.InvalidForm },
          invalidTransition: { meta: WorkflowError.InvalidTransition },
          missingSignature: { meta: WorkflowError.MissingSignature },
          invalidSecurityCode: { meta: WorkflowError.InvalidSecurityCode },
          appendixError: { meta: WorkflowError.AppendixError }
        }
      }
    }
  },
  {
    services: {
      markFormAppendixAwaitingFormsAsGrouped: ctx =>
        markFormAppendixAwaitingFormsAsGrouped(ctx.form.id),
      markFormAppendixGroupedsAsProcessed: ctx =>
        markFormAppendixGroupedsAsProcessed(ctx.form.id, ctx.requestContext)
    },
    actions: {
      // Stable = possible state for a form. Basically any of the FormState.* states
      setStable: assign({ isStableState: true }) as any,
      // Unstable = transient state, can be sync or async. Basically any pending* state, which are used for validation & side effects
      setUnStable: assign({ isStableState: false }) as any
    },
    guards: {
      isMissingSignature: (_, event: any) =>
        !event.signedByTransporter || !event.signedByProducer,
      isExemptOfTraceability: ctx => ctx.form.noTraceability,
      awaitsGroup: ctx =>
        GROUP_CODES.includes(ctx.form.processingOperationDone),
      isFormAccepted: ctx => {
        return ["ACCEPTED", "PARTIALLY_REFUSED"].includes(
          ctx.form.wasteAcceptationStatus
        );
      },
      isFormRefusedByTempStorage: (_, event: any) => {
        return !["ACCEPTED", "PARTIALLY_REFUSED"].includes(
          event.wasteAcceptationStatus
        );
      },
      hasTempStorageDestination: ctx => ctx.form.recipientIsTempStorage
    }
  }
);
