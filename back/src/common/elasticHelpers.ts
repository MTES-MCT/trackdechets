import { ApiResponse } from "@elastic/elasticsearch";
import {
  SearchResponse,
  UpdateByQueryResponse
} from "@elastic/elasticsearch/api/types";
import { xDaysAgo } from "../utils";
import { BsdElastic, client, index } from "./elastic";
import { RevisionRequestStatus } from "@prisma/client";
import { logger } from "@td/logger";
import { addMonths } from "date-fns";
import { prisma } from "@td/prisma";
import { toHHmmss } from "./helpers";

type RevisionRequest = {
  status: RevisionRequestStatus;
  approvals: {
    approverSiret: string;
  }[];
  authoringCompany: {
    orgId: string;
  };
  updatedAt: Date;
  isCanceled: boolean;
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
      if (revisionRequest.status === "PENDING" && !revisionRequest.isCanceled) {
        return {
          isInRevisionFor: [
            ...new Set([...isInRevisionFor, ...revisionRequestOrgIds])
          ],
          isRevisedFor
        };
      }
      // La révision a été acceptée ou refusée. On n'affiche pas celles dont l'acceptation
      // ou le refus a plus de 6 mois.
      else {
        if (revisionRequest.updatedAt < addMonths(new Date(), -6)) {
          return {
            isInRevisionFor,
            isRevisedFor
          };
        } else {
          return {
            isInRevisionFor,
            isRevisedFor: [
              ...new Set([...isRevisedFor, ...revisionRequestOrgIds])
            ]
          };
        }
      }
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

/**
 * Dans l'onget "Révisés", on retire les révisions acceptées / refusées / annulées
 * de plus de 6 mois
 */
export const cleanUpIsRevisedForTab = async (alias = index.alias) => {
  const size = 100;
  const sort = { id: "ASC" };
  const search_after = undefined;

  const { body }: ApiResponse<SearchResponse<BsdElastic>> = await client.search(
    {
      index: alias,
      body: {
        size:
          size +
          // Take one more result to know if there's a next page
          // it's removed from the actual results though
          1,
        query: {
          bool: {
            filter: [
              {
                exists: {
                  field: "isReturnFor"
                }
              }
            ]
          }
        },
        sort,
        search_after
      }
    }
  );

  console.log("body.hits", body.hits);
  // const hits = body.hits.hits.slice(0, size);

  //   logger.info(
  //     `[cleanUpIsRevisedForTab] Update ended! ${body.updated} bsds updated in ${body.took}ms!`
  //   );

  // const bsddWhere = {
  //     updatedAt: { lt: addMonths(new Date(), -6) },
  //     OR: [
  //       { status: { not: RevisionRequestStatus.PENDING } },
  //       { isCanceled: true }
  //     ]
  //   };

  //   const bsddRevisionRequestsCount = await prisma.bsddRevisionRequest.count({
  //     where: bsddWhere,
  //   });

  //   logger.info(`${bsddRevisionRequestsCount} révisions BSDD à réindexer`);

  //   const BATCH_SIZE = 100;
  //   let lastId: string | null = null;
  //   let finished = false;
  //   let skip = 0;
  //   let updatedBsdds = 0;
  //   const startDate = new Date();
  //   let errors = 0;
  //   while (!finished) {
  //     const bsddRevisionRequests = await prisma.bsddRevisionRequest.findMany({
  //       take: BATCH_SIZE,
  //       where: bsddWhere,
  //       skip, // Skip the cursor
  //       ...(lastId
  //         ? {
  //             cursor: {
  //               id: lastId
  //             }
  //           }
  //         : {}),
  //       orderBy: {
  //         createdAt: "asc"
  //       },
  //       select: {
  //         id: true,
  //         bsddId: true,
  //       }
  //     });

  //     if (bsddRevisionRequests.length < 10) {
  //       finished = true;
  //     }
  //     if (bsddRevisionRequests.length === 0) {
  //       break;
  //     }

  //     lastId = bsddRevisionRequests[bsddRevisionRequests.length - 1].id;
  //     skip = 1;

  //     // Reindex each BSDD
  //     for (const bsddRevisionRequest of bsddRevisionRequests) {
  //       updatedBsdds += 1;

  //       try {
  //         // TODO: Do something here
  //         logger.info(`Réindexation du BSDD ${bsddRevisionRequest.bsddId}`);
  //       } catch (e) {
  //         errors++;

  //         logger.error(
  //           `/!\\ Erreur pour le BSDD ${bsddRevisionRequest.bsddId}: ${e.message}`
  //         );
  //       }
  //     }

  //     // Info debug
  //     const loopDuration = new Date().getTime() - startDate.getTime();
  //     logger.info(
  //       `${updatedBsdds} BSDDs réindexés en ${toHHmmss(
  //         loopDuration
  //       )} (temps total estimé: ${toHHmmss(
  //         (loopDuration / updatedBsdds) * bsddRevisionRequestsCount
  //       )})`
  //     );
  //   }

  //   // Info debug
  //   const duration = new Date().getTime() - startDate.getTime();
  //   logger.info(
  //     `${updatedBsdds} BSDDs réindexés, ${errors} erreurs (${Math.round(
  //       (errors / bsddRevisionRequestsCount) * 100
  //     )}%) en ${toHHmmss(duration)}!`
  //   );
};
