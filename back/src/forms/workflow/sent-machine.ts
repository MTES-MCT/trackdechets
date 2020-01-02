import { Machine } from "xstate";
import { FormState } from "./model";
import { WorkflowError } from "./errors";
import { markFormAppendixGroupedsAsProcessed } from "./helpers";

export const sentMachine = Machine(
  {
    id: "sent-machine",
    initial: FormState.Sent,
    context: { form: null, requestContext: null },
    states: {
      [FormState.Sent]: {
        on: {
          MARK_RECEIVED: [
            {
              target: "error.impossible",
              cond: "isNotRecipient"
            },
            {
              target: FormState.Received,
              cond: ctx => ctx.form.isAccepted
            },
            {
              target: FormState.Refused
            }
          ]
        }
      },
      [FormState.Refused]: { type: "final" },
      [FormState.Received]: {
        type: "final",
        entry: "markFormAppendixGroupedsAsProcessed"
      },
      error: {
        type: "final",
        states: {
          impossible: { data: () => WorkflowError.InvalidTransition }
        }
      }
    }
  },
  {
    actions: {
      markFormAppendixGroupedsAsProcessed: ctx =>
        markFormAppendixGroupedsAsProcessed(ctx.form.id, ctx.requestContext)
    }
  }
);
