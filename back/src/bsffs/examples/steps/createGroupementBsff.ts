import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";
import mutations from "../mutations";

export function createGroupementBsff(company: string): WorkflowStep {
  return {
    description:
      "Le centre de tri, transit, regroupement crée un BSFF de groupement en renseignant les identifiants Trackdéchets" +
      " des contenants qu'il souhaite grouper. Le champ `packagings` est omis car les informations sur les contenants" +
      " sont déduits automatiquement",
    mutation: mutations.createBsff,
    variables: ({ ttr, transporteur, traiteur, initialBsffs }) => {
      return {
        input: {
          type: "GROUPEMENT",
          emitter: fixtures.operateurInput(ttr.siret),
          waste: {
            code: "14 06 01*",
            description: "R404A",
            adr: "UN 1078, Gaz frigorifique NSA (Gaz réfrigérant, NSA), 2.2 (C/E)"
          },
          weight: {
            value: 1,
            isEstimate: true
          },
          transporter: fixtures.transporterInput({
            siret: transporteur.siret,
            vatNumber: transporteur.vatNumber
          }),
          destination: fixtures.traiteurInput(traiteur.siret),
          grouping: initialBsffs.flatMap(bsff => bsff.packagings.map(p => p.id))
        }
      };
    },
    expected: { status: "INITIAL" },
    data: response => response.createBsff,
    company,
    setContext: (ctx, data) => ({
      ...ctx,
      bsff: data,
      packagings: data.packagings
    })
  };
}
