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

export type RevisionTab =
  // > Onglet 'En cours'.
  // Toutes les révisions dont je suis l'auteur ou la cible, et qui n'ont pas encore été résolues.
  | "isPendingRevisionFor"
  // > Onglet 'Emises'
  // Toutes les révisions que mon entreprise a émises, et qui n'ont pas encore été résolues.
  | "isEmittedRevisionFor"
  // > Onglet 'Reçues'
  // Toutes les révisions dont mon entreprise est la cible, et qui n'ont pas encore été résolues.
  | "isReceivedRevisionFor"
  // > Onglet 'Révisées'
  // Toutes les révisions qui ont été résolues.
  | "isReviewedRevisionFor";

/**
 * Pour une liste de demandes de révisions BSDD, BSDA ou Bsdasri, retourne l'ensemble
 * des identifiants d'établissements pour lesquels il y a une demande de révision
 * en cours ou passée.
 */
export function getRevisionOrgIds(
  revisionRequests: RevisionRequest[]
): Pick<BsdElastic, RevisionTab> {
  const {
    isPendingRevisionFor,
    isEmittedRevisionFor,
    isReceivedRevisionFor,
    isReviewedRevisionFor
  } = revisionRequests.reduce<ReturnType<typeof getRevisionOrgIds>>(
    // Pour chaque demande de révision en cours ou passés sur le bordereau
    (
      {
        isPendingRevisionFor,
        isEmittedRevisionFor,
        isReceivedRevisionFor,
        isReviewedRevisionFor
      },
      revisionRequest
    ) => {
      // Les acteurs de la révision
      const authorOrgId = revisionRequest.authoringCompany.orgId;
      const targetsOrgIds = revisionRequest.approvals.map(a => a.approverSiret);
      const companiesOrgIds = [authorOrgId, ...targetsOrgIds];

      // La révision est toujours en cours
      if (revisionRequest.status === "PENDING") {
        return {
          isPendingRevisionFor: [
            ...new Set([...isPendingRevisionFor, ...companiesOrgIds])
          ],
          isEmittedRevisionFor: [
            ...new Set([...isEmittedRevisionFor, authorOrgId])
          ],
          isReceivedRevisionFor: [
            ...new Set([...isReceivedRevisionFor, ...targetsOrgIds])
          ],
          isReviewedRevisionFor
        };
      }

      // La révision a abouti
      return {
        isPendingRevisionFor,
        isEmittedRevisionFor,
        isReceivedRevisionFor,
        isReviewedRevisionFor: [
          ...new Set([...isReviewedRevisionFor, ...companiesOrgIds])
        ]
      };
    },
    {
      isPendingRevisionFor: [],
      isEmittedRevisionFor: [],
      isReceivedRevisionFor: [],
      isReviewedRevisionFor: []
    }
  );

  // Si on a à la fois une demande de révision en cours et des demandes de révision passées
  // on ne veut pas que le bordereau apparaisse dans l'onglet 'Révisés'.
  return {
    isPendingRevisionFor,
    isEmittedRevisionFor,
    isReceivedRevisionFor,
    isReviewedRevisionFor: isReviewedRevisionFor.filter(
      orgId => !isPendingRevisionFor.includes(orgId)
    )
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
