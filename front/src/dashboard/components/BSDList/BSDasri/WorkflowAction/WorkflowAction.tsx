import React from "react";

import PublishBsdasri from "./PublishBsdasri";

import { ActionLink } from "common/components";
import { generatePath, useLocation, useRouteMatch } from "react-router-dom";

import "@reach/menu-button/styles.css";
import { IconCheckCircle1 } from "common/components/Icons";

import routes from "common/routes";

import { Bsdasri, BsdasriStatus } from "generated/graphql/types";

export interface WorkflowActionProps {
  form: Bsdasri;
  siret: string;
}

const isPublishable = (form: Bsdasri) => {
  if (!form.isDraft) {
    return false;
  }
  if (form.type === "GROUPING" && !form.grouping?.length) {
    return false;
  }
  return true;
};
export function WorkflowAction(props: WorkflowActionProps) {
  const { form, siret } = props;
  const location = useLocation();
  const matchAct = !!useRouteMatch(routes.dashboard.bsds.act);
  const matchToCollect = !!useRouteMatch(routes.dashboard.transport.toCollect);

  if (isPublishable(form)) {
    return <PublishBsdasri {...props} />;
  }
  switch (form["bsdasriStatus"]) {
    case BsdasriStatus.Initial: {
      if (form.isDraft) {
        return null;
      }

      if (siret === form.emitter?.company?.siret && matchAct) {
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

      if (siret === form.transporter?.company?.siret && matchToCollect) {
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
                    id: form.id,
                  }
                ),
                state: { background: location },
              }}
            >
              Signature producteur (code secret)
            </ActionLink>

            {form?.allowDirectTakeOver &&
            form.type === "SIMPLE" && ( // grouping dasri can't be directly taken over
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
          </>
        );
      }
      return null;
    }
    case BsdasriStatus.SignedByProducer: {
      if (siret === form.transporter?.company?.siret && matchToCollect) {
        return (
          <>
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
          </>
        );
      }
      return null;
    }
    case BsdasriStatus.Sent: {
      if (siret === form.destination?.company?.siret && matchAct) {
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
      if (siret === form.destination?.company?.siret && matchAct) {
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
