import { Machine, assign } from "xstate";
import { FormState } from "./model";
import { WorkflowError } from "./errors";
import {
  markFormAppendixAwaitingFormsAsGrouped,
  validateForm,
  validateSecurityCode,
  markFormAppendixGroupedsAsProcessed
} from "./helpers";

export const GROUP_CODES = ["D 13", "D 14", "D 15", "R 13"];

export const formWorkflowMachine = Machine(
  {
    id: "form-workflow-machine",
    initial: FormState.Draft,
    context: {
      form: null,
      actorSirets: [],
      requestContext: null,
      isStableState: true
    },
    states: {
      [FormState.Draft]: {
        entry: "setStable",
        exit: "setUnStable",
        on: {
          MARK_SEALED: [
            {
              target: "error.invalidTransition",
              cond: "isNotEmitter"
            },
            { target: "pendingSealedValidation" }
          ],
          MARK_SENT: [
            {
              target: "error.invalidTransition",
              cond: "isNotEmitter"
            },
            { target: "pendingSentValidation" }
          ]
        }
      },
      [FormState.Sealed]: {
        entry: "setStable",
        exit: "setUnStable",
        on: {
          MARK_SENT: [
            {
              target: "error.invalidTransition",
              cond: "isNeitherEmitterOrTransporter"
            },
            { target: "pendingSentValidation" }
          ],
          MARK_SIGNED_BY_TRANSPORTER: [
            {
              target: "error.missingSignature",
              cond: "isMissingSignature"
            },
            {
              target: `pendingSecurityCodeValidation`
            }
          ]
        }
      },
      [FormState.Sent]: {
        entry: "setStable",
        exit: "setUnStable",
        on: {
          MARK_RECEIVED: [
            {
              target: "error.invalidTransition",
              cond: "isNotRecipient"
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
              target: "error.invalidTransition",
              cond: "isNotRecipient"
            },
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
      pendingSecurityCodeValidation: {
        invoke: {
          src: (ctx, event) =>
            validateSecurityCode(
              ctx.form,
              event.securityCode,
              ctx.requestContext
            ),
          onDone: {
            target: "pendingSentMarkFormAppendixAwaitingFormsAsGrouped"
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
        markFormAppendixAwaitingFormsAsGrouped(ctx.form.id, ctx.requestContext),
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
      isNotEmitter: ctx =>
        !ctx.actorSirets.includes(ctx.form.emitterCompanySiret),
      isNeitherEmitterOrTransporter: ctx =>
        !ctx.actorSirets.includes(ctx.form.emitterCompanySiret) &&
        !ctx.actorSirets.includes(ctx.form.transporterCompanySiret),
      isMissingSignature: (_, event: any) =>
        !event.signedByTransporter || !event.signedByProducer,
      isNotRecipient: ctx =>
        !ctx.actorSirets.includes(ctx.form.recipientCompanySiret),
      isExemptOfTraceability: ctx => ctx.form.noTraceability,
      awaitsGroup: ctx =>
        GROUP_CODES.includes(ctx.form.processingOperationDone),
      isFormAccepted: ctx => {
        return ["ACCEPTED", "PARTIALLY_REFUSED"].includes(
          ctx.form.wasteAcceptationStatus
        );
      }
    }
  }
);
