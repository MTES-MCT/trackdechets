import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function signTransportForm(company: string): WorkflowStep {
  return {
    description: `Le transporteur signe l'enlèvement.`,
    mutation: mutations.signTransportForm,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: fixtures.signTransportFormInput()
    }),
    expected: { status: "SENT" },
    data: response => response.signTransportForm,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}

export function signTransportFormAfterTempStorage(company: string) {
  return {
    ...signTransportForm(company),
    variables: ({ bsd, ttr }) => ({
      id: bsd.id,
      input: fixtures.signTransportFormInput(),
      securityCode: ttr.securityCode
    }),
    expected: { status: "RESENT" }
  };
}
