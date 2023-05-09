import mutations from "../mutations";
import defaultFixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function prepareSegment(
  company: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    description: `Dès qu'un transporteur (transporteur 1, identifié par son SIRET ou son numéro de TVA inta-communautaire pour les transporteurs étrangers) à signé l'enlèvement d'un déchet auprès d'un producteur,
  il peut préparer le segment suivant afin de transmettre le déchet et son bordereau à un autre transporteur (transporteur 2, identifié par son SIRET ou son numéro de TVA inta-communautaire pour les transporteurs étrangers).
  La mutation prepareSegment est dédiée à cette étape. Le nouveau segment est créé en mode brouillon.
  Pour un maximum de souplesse, seul le siret du nouveau transporteur est requis. Tant que le segment est en mode brouillon,
  le transporteur 1 peut le modifier ( tous les champs) Dès qu'un segment est marqué comme prêt à être transmis,
  c'est le transporteur 2 qui peut l'éditer (hormis info entreprises, siret etc.) La modification s'effectue grâce à la mutation editSegment.`,
    mutation: mutations.prepareSegment,
    variables: ({ bsd, transporteur1, transporteur2 }) => ({
      id: bsd.id,
      siret: transporteur1.siret?.length
        ? transporteur1.siret
        : transporteur1.vatNumber,
      nextSegmentInfo: fixtures.nextSegmentInfoInput(
        transporteur2.siret?.length
          ? transporteur2.siret
          : transporteur2.vatNumber
      )
    }),
    expected: { mode: "RAIL" },
    data: response => response.prepareSegment,
    company,
    setContext: (ctx, data) => ({ ...ctx, transportSegment: { id: data.id } })
  };
}
