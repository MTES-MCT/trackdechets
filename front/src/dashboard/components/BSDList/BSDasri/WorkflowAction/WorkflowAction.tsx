import React from "react";

import { ActionLink } from "common/components";
import { generatePath, useLocation, useRouteMatch } from "react-router-dom";

import "@reach/menu-button/styles.css";
import { IconCheckCircle1, IconPaperWrite } from "common/components/Icons";

import routes from "common/routes";

import {
  CommonBsd,
  CommonBsdStatus,
  BsdasriType,
} from "generated/graphql/types";

export interface WorkflowActionProps {
  bsd: CommonBsd;
  siret: string;
}

const isPublishable = (bsd: CommonBsd) => {
  if (!bsd.isDraft) {
    return false;
  }

  if (bsd?.bsdasri?.type === "GROUPING" && !bsd.bsdasri?.groupingCount) {
    return false;
  }
  return true;
};
export function WorkflowAction(props: WorkflowActionProps) {
  const { bsd, siret } = props;
  const location = useLocation();
  const isActTab = !!useRouteMatch(routes.dashboard.bsds.act);
  const isToCollectTab = !!useRouteMatch(routes.dashboard.transport.toCollect);

  if (isPublishable(bsd)) {
    return (
      <ActionLink
        icon={<IconPaperWrite size="24px" />}
        to={{
          pathname: generatePath(routes.dashboard.bsdasris.sign.publish, {
            siret,
            id: bsd.id,
          }),
          state: { background: location },
        }}
      >
        Publier le bordereau
      </ActionLink>
    );
  }
  switch (bsd.status) {
    case CommonBsdStatus.Initial: {
      if (bsd.isDraft) {
        return null;
      }

      if (siret === bsd.emitter?.company?.siret && isActTab) {
        return (
          <ActionLink
            icon={<IconCheckCircle1 size="24px" />}
            to={{
              pathname: generatePath(routes.dashboard.bsdasris.sign.emission, {
                siret,
                id: bsd.id,
              }),
              state: { background: location },
            }}
          >
            Signature producteur
          </ActionLink>
        );
      }

      if (siret === bsd.transporter?.company?.siret && isToCollectTab) {
        return (
          <>
            <ActionLink
              className="tw-mb-1"
              icon={<IconCheckCircle1 size="24px" />}
              to={{
                pathname: generatePath(
                  routes.dashboard.bsdasris.sign.emissionSecretCode,
                  {
                    siret,
                    id: bsd.id,
                  }
                ),
                state: { background: location },
              }}
            >
              Signature producteur (code secret)
            </ActionLink>

            {bsd?.bsdasri?.emitterAllowDirectTakeOver &&
            bsd?.bsdasri?.type === BsdasriType.Simple && ( // grouping dasri can't be directly taken over
                <ActionLink
                  extraClassName="tw-mt-2"
                  icon={<IconCheckCircle1 size="24px" />}
                  to={{
                    pathname: generatePath(
                      routes.dashboard.bsdasris.sign.directTakeover,
                      {
                        siret,
                        id: bsd.id,
                      }
                    ),
                    state: { background: location },
                  }}
                >
                  Emport direct transporteur
                </ActionLink>
              )}
          </>
        );
      }
      return null;
    }
    case CommonBsdStatus.SignedByProducer: {
      if (siret === bsd.transporter?.company?.siret && isToCollectTab) {
        return (
          <>
            <ActionLink
              icon={<IconCheckCircle1 size="24px" />}
              to={{
                pathname: generatePath(
                  routes.dashboard.bsdasris.sign.transporter,
                  {
                    siret,
                    id: bsd.id,
                  }
                ),
                state: { background: location },
              }}
            >
              Signature transporteur
            </ActionLink>
          </>
        );
      }

      // AJOUTER LES SIRETS SUR LES BSDsss
      return null;
    }
    case CommonBsdStatus.Sent: {
      if (siret === bsd.destination?.company?.siret && isActTab) {
        return (
          <ActionLink
            icon={<IconCheckCircle1 size="24px" />}
            to={{
              pathname: generatePath(routes.dashboard.bsdasris.sign.reception, {
                siret,
                id: bsd.id,
              }),
              state: { background: location },
            }}
          >
            Signature reception
          </ActionLink>
        );
      }
      return null;
    }
    case CommonBsdStatus.Received: {
      if (siret === bsd.destination?.company?.siret && isActTab) {
        return (
          <>
            <ActionLink
              icon={<IconCheckCircle1 size="24px" />}
              to={{
                pathname: generatePath(
                  routes.dashboard.bsdasris.sign.operation,
                  {
                    siret,
                    id: bsd.id,
                  }
                ),
                state: { background: location },
              }}
            >
              Signature traitement
            </ActionLink>
          </>
        );
      }
      return null;
    }
    default:
      return null;
  }
}
