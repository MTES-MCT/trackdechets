import React from "react";
import { CommonBsd, CommonBsdStatus } from "generated/graphql/types";
import { useRouteMatch } from "react-router-dom";
import routes from "common/routes";

import PublishBsda from "./PublishBsda";
import { SignEmission } from "./SignEmission";
import { SignWork } from "./SignWork";
import { SignTransport } from "./SignTransport";
import { SignOperation } from "./SignOperation";

export interface WorkflowActionProps {
  bsd: CommonBsd;
  siret: string;
}

export function WorkflowAction(props: WorkflowActionProps) {
  const { bsd, siret } = props;
  // prevent action button to appear in wrong tabs when siret plays several roles on the bsd

  const isActTab = !!useRouteMatch(routes.dashboard.bsds.act);
  const isToCollectTab = !!useRouteMatch(routes.dashboard.transport.toCollect);
  if (bsd.isDraft) {
    return <PublishBsda {...props} />;
  }

  switch (bsd.status) {
    case CommonBsdStatus.Initial:
      if (
        (bsd.bsda?.emitterIsPrivateIndividual &&
          siret === bsd.bsda?.worker?.company?.siret) ||
        isActTab
      ) {
        return <SignWork {...{ siret }} bsdId={bsd.id} />;
      }

      if (siret !== bsd.emitter?.company?.siret || isActTab) return null;
      return <SignEmission {...{ siret }} bsdId={bsd.id} />;

    case CommonBsdStatus.SignedByProducer:
      if (siret !== bsd.bsda?.worker?.company?.siret || isActTab) return null;
      return <SignWork {...{ siret }} bsdId={bsd.id} />;

    case CommonBsdStatus.SignedByWorker:
      if (siret !== bsd.transporter?.company?.siret || !isToCollectTab)
        return null;
      return <SignTransport {...{ siret }} bsdId={bsd.id} />;

    case CommonBsdStatus.Sent:
      if (siret !== bsd.destination?.company?.siret || isActTab) return null;
      return <SignOperation {...props} bsdId={bsd.id} />;

    default:
      return null;
  }
}
