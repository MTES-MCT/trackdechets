import React from "react";

import { ActionLink } from "common/components";
import { generatePath, useLocation, useRouteMatch } from "react-router-dom";

import {
  IconCheckCircle1,
  IconShipmentSignSmartphone,
  IconPaperWrite,
} from "common/components/Icons";

import routes from "Apps/routes";

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
  const isAssociatedToSynthesis = !!form?.synthesizedIn?.id;

  const isSimple = form.type === BsdasriType.Simple;
  const isEmitter = siret === form.emitter?.company?.siret;
  const isEcoOrganisme = siret === form.ecoOrganisme?.siret;
  const isTransporter = siret === form.transporter?.company?.orgId;
  const isDestination = siret === form.destination?.company?.siret;

  if (isAssociatedToSynthesis) {
    return null;
  }
  if (isPublishable(form)) {
    return (
      <ActionLink
        icon={<IconPaperWrite size="24px" />}
        to={{
          pathname: generatePath(routes.dashboard.bsdasris.sign.publish, {
            siret,
            id: form.id,
          }),
          state: { background: location },
        }}
      >
        Publier le bordereau
      </ActionLink>
    );
  }
  switch (form["bsdasriStatus"]) {
    case BsdasriStatus.Initial: {
      if (form.isDraft) {
        return null;
      }
      const isHolder = isEmitter || isEcoOrganisme;
      if (isHolder && isActTab && !isSynthesis) {
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
              {isEcoOrganisme
                ? "Signature Éco-organisme"
                : "Signature producteur"}
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
                icon={<IconShipmentSignSmartphone size="24px" />}
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
                Signature émetteur
              </ActionLink>
            )}
            {/* marked as deprecated for api user, this field is used to dynamically insert user settings data */}
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
                    routes.dashboard.bsdasris.sign.synthesisTakeover,
                    {
                      siret,
                      id: form.id,
                    }
                  ),
                  state: { background: location },
                }}
              >
                Validation emport (Synthèse)
              </ActionLink>
            )}
          </>
        );
      }
      return null;
    }
    case BsdasriStatus.SignedByProducer: {
      if (!isTransporter) {
        if (!isToCollectTab) {
          return null;
        }
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
            Signature réception
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
