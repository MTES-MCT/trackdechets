import React from "react";
import { CommonBsd, CommonBsdStatus } from "generated/graphql/types";
import PublishBsvhu from "./PublishBsvhu";
import { SignEmission } from "./SignEmission";
import { SignTransport } from "./SignTransport";
import { SignOperation } from "./SignOperation";
import { useRouteMatch } from "react-router-dom";
import routes from "common/routes";

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
    return <PublishBsvhu {...props} />;
  }
  switch (bsd.status) {
    case CommonBsdStatus.Initial:
      if (siret !== bsd.emitter?.company?.siret || !isActTab) return null;
      return <SignEmission {...props} bsvhuId={bsd.id} />;

    case CommonBsdStatus.SignedByProducer:
      if (siret !== bsd.transporter?.company?.siret || !isToCollectTab)
        return null;
      return <SignTransport {...props} bsvhuId={bsd.id} />;

    case CommonBsdStatus.Sent:
      if (siret !== bsd.destination?.company?.siret || !isActTab) return null;
      return <SignOperation {...props} bsvhuId={bsd.id} />;

    default:
      return null;
  }
}
