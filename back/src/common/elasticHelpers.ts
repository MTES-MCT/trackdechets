import { BsdElastic } from "./elastic";
import {
  RevisionRequestApprovalStatus,
  RevisionRequestStatus
} from "@prisma/client";

type RevisionRequest = {
  createdAt: Date;
  status: RevisionRequestStatus;
  approvals: {
    approverSiret: string;
    status: RevisionRequestApprovalStatus;
  }[];
  authoringCompany: {
    orgId: string;
  };
};

export type ActiveRevisionInfos = {
  author: string;
  approvedBy: string[];
};

/**
 * Pour une liste de demandes de révisions BSDD ou BSDA, retourne l'ensemble
 * des identifiants d'établissements pour lesquels il y a une demande de révision
 * en cours ou passée.
 */
export function getRevisionsInfos(revisionRequests: RevisionRequest[]): Pick<
  BsdElastic,
  "isInRevisionFor" | "isRevisedFor"
> & {
  latestRevisionCreatedAt: Date | undefined;
  hasBeenRevised: boolean;
  activeRevisionInfos: ActiveRevisionInfos | undefined;
} {
  const {
    isInRevisionFor,
    isRevisedFor,
    latestRevisionCreatedAt,
    activeRevisionInfos
  } = revisionRequests.reduce<
    Omit<ReturnType<typeof getRevisionsInfos>, "hasBeenRevised">
  >(
    // Pour chaque demande de révision en cours ou passés sur le bordereau
    (
      {
        isInRevisionFor,
        isRevisedFor,
        latestRevisionCreatedAt,
        activeRevisionInfos
      },
      revisionRequest
    ) => {
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
            isRevisedFor,
            latestRevisionCreatedAt: revisionRequest.createdAt,
            activeRevisionInfos: {
              author: revisionRequest.authoringCompany.orgId,
              approvedBy: revisionRequest.approvals
                .filter(
                  approval =>
                    approval.status === RevisionRequestApprovalStatus.ACCEPTED
                )
                .map(a => a.approverSiret)
            }
          }
        : {
            isInRevisionFor,
            isRevisedFor: [
              ...new Set([...isRevisedFor, ...revisionRequestOrgIds])
            ],
            latestRevisionCreatedAt:
              !latestRevisionCreatedAt ||
              revisionRequest.createdAt < latestRevisionCreatedAt
                ? revisionRequest.createdAt
                : latestRevisionCreatedAt,
            activeRevisionInfos
          };
    },
    {
      isInRevisionFor: [],
      isRevisedFor: [],
      activeRevisionInfos: undefined,
      latestRevisionCreatedAt: undefined
    }
  );

  // Si on a à la fois une demande de révision en cours et des demandes de révision passées
  // on veut que le bordereau apparaisse uniquement dans l'onglet `En révision`. On ajoute donc
  // un filtre sur `isRevisedFor` pour s'assurer qu'un identifiant d'établissement apparaisse
  // soit dans `isInRevisionFor`, soit dans `isRevisedFor` mais pas dans les deux.
  return {
    isInRevisionFor: isInRevisionFor,
    isRevisedFor: isRevisedFor.filter(
      orgId => !isInRevisionFor.includes(orgId)
    ),
    hasBeenRevised: isRevisedFor.length > 0,
    activeRevisionInfos,
    latestRevisionCreatedAt
  };
}
