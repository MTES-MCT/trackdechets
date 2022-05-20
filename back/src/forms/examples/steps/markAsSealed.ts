import { WorkflowStep } from "../../../common/workflow";
import mutations from "../mutations";

export function markAsSealed(company: string): WorkflowStep {
  return {
    description:
      "Valide les données présentes sur le BSDD avant envoi. Cette action" +
      " peut-être effectuée par n'importe quel établissement apparaissant sur le BSDD. À ce stade" +
      " il est encore possible de de modifier le BSDD grâce à la mutation updateForm",
    mutation: mutations.markAsSealed,
    variables: ({ bsd }) => ({ id: bsd.id }),
    expected: { status: "SEALED" },
    data: response => response.markAsSealed,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
