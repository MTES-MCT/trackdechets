import { Machine } from "xstate";
import { FormState } from "./model";
import { WorkflowError } from "./errors";
import {
  markFormAppendixAwaitingFormsAsGrouped,
  validateForm
} from "./helpers";

export const draftMachine = Machine(
  {
    id: "draft-machine",
    initial: FormState.Draft,
    context: { form: null, actorSirets: [], requestContext: null },
    states: {
      [FormState.Draft]: {
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
        type: "final",
        entry: "markFormAppendixAwaitingFormsAsGrouped"
      },
      [FormState.Sent]: {
        type: "final",
        entry: "markFormAppendixAwaitingFormsAsGrouped"
      },
      pendingSealedValidation: {
        invoke: {
          id: "validateBeforeSent",
          src: ctx => validateForm(ctx.form),
          onDone: { target: FormState.Sealed },
          onError: { target: "error.invalidForm" }
        }
      },
      pendingSentValidation: {
        invoke: {
          id: "validateBeforeSent",
          src: ctx => validateForm(ctx.form),
          onDone: { target: FormState.Sent },
          onError: { target: "error.invalidForm" }
        }
      },
      error: {
        states: {
          invalidForm: { meta: WorkflowError.InvalidForm },
          invalidTransition: { meta: WorkflowError.InvalidTransition }
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
      isNotEmitter: ctx =>
        !ctx.actorSirets.includes(ctx.form.emitterCompanySiret)
    }
  }
);
