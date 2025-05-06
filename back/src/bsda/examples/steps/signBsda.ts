import { WorkflowStep } from "../../../common/workflow";
import mutations from "../mutations";

const expectedStatus = {
  EMISSION: "SIGNED_BY_PRODUCER",
  WORK: "SIGNED_BY_WORKER",
  TRANSPORT: "SENT",
  RECEPTION: "RECEIVED",
  OPERATION: "PROCESSED"
};

const expectedStatusWhenGrouping = {
  EMISSION: "SIGNED_BY_PRODUCER",
  WORK: "SIGNED_BY_WORKER",
  TRANSPORT: "SENT",
  OPERATION: "AWAITING_CHILD"
};

type BsdaSignatureType =
  | "EMISSION"
  | "OPERATION"
  | "RECEPTION"
  | "TRANSPORT"
  | "WORK";

export function signBsda(
  company: string,
  type: BsdaSignatureType
): WorkflowStep {
  return {
    description: `L'entreprise ${company} appose une signature "${type}" sur le BSDA.`,
    mutation: mutations.signBsda,
    variables: ctx => ({
      id: ctx.bsda.id,
      input: {
        author: `Jean Dupont`,
        type
      }
    }),
    expected: { status: expectedStatus[type] },
    data: response => response.signBsda,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsda: data })
  };
}

export function signBsdaToGroup(
  company: string,
  type: BsdaSignatureType
): WorkflowStep {
  return {
    description: `L'entreprise ${company} appose une signature "${type}" sur le BSDA.`,
    mutation: mutations.signBsda,
    variables: ctx => ({
      id: ctx.bsda.id,
      input: {
        author: `Jean Dupont`,
        type
      }
    }),
    expected: { status: expectedStatusWhenGrouping[type] },
    data: response => response.signBsda,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsda: data })
  };
}
