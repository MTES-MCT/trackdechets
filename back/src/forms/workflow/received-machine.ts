import { Machine } from "xstate";
import { FormState } from "./model";
import { WorkflowError } from "./errors";

const GROUP_CODES = ["D 13", "D 14", "D 15", "R 13"];

export const receivedMachine = Machine(
  {
    id: "received-machine",
    initial: FormState.Received,
    context: { form: null, actorSirets: [], requestContext: null },
    states: {
      [FormState.Received]: {
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
              target: FormState.Processed,
              cond: "awaitsGroup"
            },
            {
              target: FormState.AwaitingGroup
            }
          ]
        }
      },
      [FormState.Processed]: { type: "final" },
      [FormState.NoTraceability]: { type: "final" },
      [FormState.AwaitingGroup]: { type: "final" },
      error: {
        states: {
          invalidTransition: { meta: WorkflowError.InvalidTransition }
        }
      }
    }
  },
  {
    guards: {
      isNotRecipient: ctx =>
        !ctx.actorSirets.includes(ctx.form.recipientCompanySiret),
      isExemptOfTraceability: ctx => ctx.form.noTraceability,
      awaitsGroup: ctx =>
        !GROUP_CODES.includes(ctx.form.processingOperationDone)
    }
  }
);
