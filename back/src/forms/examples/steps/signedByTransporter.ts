import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function signedByTransporter(company: string): WorkflowStep {
  return {
    description: `Le transporteur et le producteur signe l'enlèvement à partir du
    compte du transporteur. Le producteur est authentifié grâce
    à son code de signature.`,
    mutation: mutations.signedByTransporter,
    variables: ({ bsd, producteur }) => ({
      id: bsd.id,
      signingInfo: fixtures.signingInfoInput(producteur.securityCode)
    }),
    expected: { status: "SENT" },
    data: response => response.signedByTransporter,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}

export function signedByTransporterAfterTempStorage(company: string) {
  return {
    ...signedByTransporter(company),
    variables: ({ bsd, ttr }) => ({
      id: bsd.id,
      signingInfo: fixtures.signingInfoInput(ttr.securityCode)
    }),
    expected: { status: "RESENT" }
  };
}
