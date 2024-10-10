import { ApiResponse } from "@elastic/elasticsearch";
import { UpdateByQueryResponse } from "@elastic/elasticsearch/api/types";
import { xDaysAgo } from "../utils";
import { BsdElastic, client, index } from "./elastic";
import { RevisionRequestStatus } from "@prisma/client";
import { logger } from "@td/logger";

type RevisionRequest = {
  status: RevisionRequestStatus;
  approvals: {
    approverSiret: string;
  }[];
  authoringCompany: {
    orgId: string;
  };
};

/**
 * Pour une liste de demandes de révisions BSDD, BSDA ou Bsdasri, retourne l'ensemble
 * des identifiants d'établissements pour lesquels il y a une demande de révision
 * en cours ou passée.
 */
export function getRevisionOrgIds(
  revisionRequests: RevisionRequest[]
): Pick<BsdElastic, "isInRevisionFor" | "isRevisedFor"> {
  const { isInRevisionFor, isRevisedFor } = revisionRequests.reduce<
    ReturnType<typeof getRevisionOrgIds>
  >(
    // Pour chaque demande de révision en cours ou passés sur le bordereau
    ({ isInRevisionFor, isRevisedFor }, revisionRequest) => {
      // On commence par calculer la liste des identifiants d'établissements
      // concernés par la demande de révision. En théorie cette liste est plus ou
      // moins la même d'une demande de révision à l'autre
      const revisionRequestOrgIds = [
        revisionRequest.authoringCompany.orgId,
        ...revisionRequest.approvals.map(a => a.approverSiret)
      ];
      // En fonction du statut de la demande de révision, on affecte les identifiants
      // d'établissements soit à `isInRevisionFor`, soit à `isRevisedFor`. L'utilisation
      // de `new Set(...)` permet de s'assurer que les identifiants sont uniques dans la liste.

      return revisionRequest.status === "PENDING"
        ? {
            isInRevisionFor: [
              ...new Set([...isInRevisionFor, ...revisionRequestOrgIds])
            ],
            isRevisedFor
          }
        : {
            isInRevisionFor,
            isRevisedFor: [
              ...new Set([...isRevisedFor, ...revisionRequestOrgIds])
            ]
          };
    },
    { isInRevisionFor: [], isRevisedFor: [] }
  );

  // Si on a à la fois une demande de révision en cours et des demandes de révision passées
  // on veut que le bordereau apparaisse uniquement dans l'onglet `En révision`. On ajoute donc
  // un filtre sur `isRevisedFor` pour s'assurer qu'un identifiant d'établissement apparaisse
  // soit dans `isInRevisionFor`, soit dans `isRevisedFor` mais pas dans les deux.
  return {
    isInRevisionFor: isInRevisionFor,
    isRevisedFor: isRevisedFor.filter(orgId => !isInRevisionFor.includes(orgId))
  };
}
/**
 * The "isReturnFor" tab contains BSDs with characteristics that make them valuable for
 * transporters, but only for so long. That's why we need to regularly clean this tab up
 */
export const cleanUpIsReturnForTab = async (alias = index.alias) => {
  const twoDaysAgo = xDaysAgo(new Date(), 2);

  const { body }: ApiResponse<UpdateByQueryResponse> =
    await client.updateByQuery({
      index: alias,
      refresh: true,
      body: {
        query: {
          bool: {
            filter: [
              {
                exists: {
                  field: "isReturnFor"
                }
              },
              {
                range: {
                  destinationReceptionDate: {
                    lt: twoDaysAgo.toISOString()
                  }
                }
              }
            ]
          }
        },
        script: {
          source: "ctx._source.isReturnFor = []"
        }
      }
    });

  logger.info(
    `[cleanUpIsReturnForTab] Update ended! ${body.updated} bsds updated in ${body.took}ms!`
  );

  return body;
};
