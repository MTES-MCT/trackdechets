import React from "react";

import PublishBsdasri from "./PublishBsdasri";

import { ActionLink } from "common/components";
import { generatePath, useLocation, useRouteMatch } from "react-router-dom";

import "@reach/menu-button/styles.css";
import { IconCheckCircle1 } from "common/components/Icons";

import routes from "common/routes";

import { Bsdasri, BsdasriStatus, BsdasriType } from "generated/graphql/types";

export interface WorkflowActionProps {
  form: Bsdasri;
  siret: string;
}

const isPublishable = (form: Bsdasri) => {
  if (!form.isDraft) {
    return false;
  }
  if (form.type === BsdasriType.Grouping && !form.grouping?.length) {
    return false;
  }
  if (form.type === BsdasriType.Synthesis && !form.synthesizing?.length) {
    return false;
  }
  return true;
};

export function WorkflowAction(props: WorkflowActionProps) {
  const { form, siret } = props;
  const location = useLocation();
  const isActTab = !!useRouteMatch(routes.dashboard.bsds.act);
  const isToCollectTab = !!useRouteMatch(routes.dashboard.transport.toCollect);
  const isSynthesis = form.type === BsdasriType.Synthesis;
  const isSimple = form.type === BsdasriType.Simple;
  const isEmitter = siret === form.emitter?.company?.siret;
  const isTransporter = siret === form.transporter?.company?.siret;
  const isDestination = siret === form.destination?.company?.siret;
  if (isPublishable(form)) {
    return <PublishBsdasri {...props} />;
  }
  switch (form["bsdasriStatus"]) {
    case BsdasriStatus.Initial: {
      if (form.isDraft) {
        return null;
      }

      if (isEmitter && isActTab && !isSynthesis) {
        // no emitter signature for synthesis bsds
        return (
          <>
            <ActionLink
              icon={<IconCheckCircle1 size="24px" />}
              to={{
                pathname: generatePath(
                  routes.dashboard.bsdasris.sign.emission,
                  {
                    siret,
                    id: form.id,
                  }
                ),
                state: { background: location },
              }}
            >
              Signature producteur
            </ActionLink>
          </>
        );
      }

      if (isTransporter && isToCollectTab) {
        return (
          <>
            {!isSynthesis && (
              <ActionLink
                className="tw-mb-1"
                icon={<IconCheckCircle1 size="24px" />}
                to={{
                  pathname: generatePath(
                    routes.dashboard.bsdasris.sign.emissionSecretCode,
                    {
                      siret,
                      id: form.id,
                    }
                  ),
                  state: { background: location },
                }}
              >
                Signature producteur (code secret)
              </ActionLink>
            )}

            {form?.allowDirectTakeOver &&
            isSimple && ( // grouping dasri can't be directly taken over
                <ActionLink
                  icon={<IconCheckCircle1 size="24px" />}
                  to={{
                    pathname: generatePath(
                      routes.dashboard.bsdasris.sign.directTakeover,
                      {
                        siret,
                        id: form.id,
                      }
                    ),
                    state: { background: location },
                  }}
                >
                  Emport direct transporteur
                </ActionLink>
              )}

            {isSynthesis && (
              <ActionLink
                icon={<IconCheckCircle1 size="24px" />}
                to={{
                  pathname: generatePath(
                    routes.dashboard.bsdasris.sign.synthesisEmission,
                    {
                      siret,
                      id: form.id,
                    }
                  ),
                  state: { background: location },
                }}
              >
                Signature 1/2 (Synthèse)
              </ActionLink>
            )}
          </>
        );
      }
      return null;
    }
    case BsdasriStatus.SignedByProducer: {
      if (!isTransporter || !isToCollectTab) {
        return null;
      }
      if (!isSynthesis) {
        return (
          <ActionLink
            icon={<IconCheckCircle1 size="24px" />}
            to={{
              pathname: generatePath(
                routes.dashboard.bsdasris.sign.transporter,
                {
                  siret,
                  id: form.id,
                }
              ),
              state: { background: location },
            }}
          >
            Signature transporteur
          </ActionLink>
        );
      }
      if (isSynthesis) {
        return (
          <ActionLink
            icon={<IconCheckCircle1 size="24px" />}
            to={{
              pathname: generatePath(
                routes.dashboard.bsdasris.sign.transporter,
                {
                  siret,
                  id: form.id,
                }
              ),
              state: { background: location },
            }}
          >
            Signature 2/2 (Synthèse)
          </ActionLink>
        );
      }
      return null;
    }
    case BsdasriStatus.Sent: {
      if (isDestination && isActTab) {
        return (
          <ActionLink
            icon={<IconCheckCircle1 size="24px" />}
            to={{
              pathname: generatePath(routes.dashboard.bsdasris.sign.reception, {
                siret,
                id: form.id,
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
    case BsdasriStatus.Received: {
      if (isDestination && isActTab) {
        return (
          <>
            <ActionLink
              icon={<IconCheckCircle1 size="24px" />}
              to={{
                pathname: generatePath(
                  routes.dashboard.bsdasris.sign.operation,
                  {
                    siret,
                    id: form.id,
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
