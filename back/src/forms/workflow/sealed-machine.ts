import { Machine } from "xstate";
import { FormState } from "./model";
import { WorkflowError } from "./errors";
import {
  validateForm,
  validateSecurityCode,
  markFormAppendixAwaitingFormsAsGrouped
} from "./helpers";

export const sealedMachine = Machine(
  {
    id: "sealed-machine",
    initial: FormState.Sealed,
    context: { form: null, actorSirets: [], requestContext: null },
    states: {
      [FormState.Sealed]: {
        on: {
          MARK_SENT: [
            {
              target: "error.invalidTransition",
              cond: "isNeitherEmitterOrTransporter"
            },
            { target: "pendingFormValidation" }
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
        type: "final",
        entry: "markFormAppendixAwaitingFormsAsGrouped"
      },
      pendingFormValidation: {
        invoke: {
          id: "validateBeforeSeal",
          src: ctx => validateForm(ctx.form),
          onDone: { target: FormState.Sent },
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
          onDone: { target: FormState.Sent },
          onError: { target: "error.invalidSecurityCode" }
        }
      },
      error: {
        type: "final",
        states: {
          invalidForm: { meta: WorkflowError.InvalidForm },
          invalidTransition: { meta: WorkflowError.InvalidTransition },
          missingSignature: { meta: WorkflowError.MissingSignature },
          invalidSecurityCode: { meta: WorkflowError.InvalidSecurityCode }
        }
      }
    }
  },
  {
    actions: {
      markFormAppendixAwaitingFormsAsGrouped: ctx =>
        markFormAppendixAwaitingFormsAsGrouped(ctx.form.id, ctx.requestContext)
    },
    guards: {
      isNeitherEmitterOrTransporter: ctx =>
        !ctx.actorSirets.includes(ctx.form.emitterCompanySiret) &&
        !ctx.actorSirets.includes(ctx.form.transporterCompanySiret),
      isMissingSignature: (_, event: any) =>
        !event.signedByTransporter || !event.signedByProducer
    }
  }
);
