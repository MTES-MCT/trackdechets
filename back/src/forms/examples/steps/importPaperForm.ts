import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function importPaperForm(company: string): WorkflowStep {
  return {
    description: `Le BSD est ensuite imprimé au format papier grâce à la query formPdf.
  Le BSD papier accompagne le déchet lors de l'enlèvement, de la réception
  et du traitement final puis les données sont "ré-injectées" dans Trackdéchets
  grâce à la mutation importPaperForm`,
    mutation: mutations.importPaperForm,
    variables: ({ bsd }) => ({
      input: {
        id: bsd.id,
        signingInfo: {
          sentAt: "2020-04-03T14:48:00",
          sentBy: "Isabelle Guichard"
        },
        receivedInfo: fixtures.receivedInfoInput,
        processedInfo: fixtures.processedInfoInput
      }
    }),
    expected: { status: "PROCESSED" },
    data: response => response.importPaperForm,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
