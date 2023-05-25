import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function signEmissionForm(company: string): WorkflowStep {
  return {
    description: `Le producteur signe l'enlèvement.`,
    mutation: mutations.signEmissionForm,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: fixtures.signEmissionFormInput()
    }),
    expected: { status: "SIGNED_BY_PRODUCER" },
    data: response => response.signEmissionForm,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}

export function signEmissionFormAfterTempStorage(company: string) {
  return {
    ...signEmissionForm(company),
    variables: ({ bsd, ttr }) => ({
      id: bsd.id,
      input: fixtures.signEmissionFormInput(),
      securityCode: ttr.securityCode
    }),
    expected: { status: "SIGNED_BY_TEMP_STORER" }
  };
}
