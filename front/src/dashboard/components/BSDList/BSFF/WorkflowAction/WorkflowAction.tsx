import React from "react";
import { CommonBsdStatus, CommonBsd } from "generated/graphql/types";

import { PublishBsff } from "./PublishBsff";
import { SignEmission } from "./SignEmission";
import { SignTransport } from "./SignTransport";
import { SignReception } from "./SignReception";
import { SignOperation } from "./SignOperation";
import { useRouteMatch } from "react-router-dom";
import routes from "common/routes";

export interface WorkflowAction {
  bsd: CommonBsd;
  siret: string;
  usedInTab?: boolean;
}

export function WorkflowAction(props: WorkflowAction) {
  const { bsd, siret, usedInTab = true } = props;
  // prevent action button to appear in wrong tabs when siret plays several roles on the bsd
  // disabled (set to true) when component used in detail view
  const isActTabRoute = !!useRouteMatch(routes.dashboard.bsds.act);
  const isToCollectTabRoute = useRouteMatch(
    routes.dashboard.transport.toCollect
  );
  const isActTab = usedInTab ? isActTabRoute : true;
  const isToCollectTab = usedInTab ? isToCollectTabRoute : true;
  if (bsd.isDraft) {
    return <PublishBsff bsffId={bsd.id} />;
  }

  switch (bsd.status) {
    case CommonBsdStatus.Initial:
      if (siret !== bsd.emitter?.company?.siret || !isActTab) return null;
      return <SignEmission bsffId={bsd.id} />;

    case CommonBsdStatus.SignedByEmitter:
      if (siret !== bsd.transporter?.company?.siret || !isToCollectTab)
        return null;
      return <SignTransport bsffId={bsd.id} />;

    case CommonBsdStatus.Sent:
      if (siret !== bsd.destination?.company?.siret || isActTab) return null;
      return <SignReception bsffId={bsd.id} />;

    case CommonBsdStatus.Received:
      if (siret !== bsd.destination?.company?.siret || isActTab) return null;
      return <SignOperation bsffId={bsd.id} />;

    default:
      return null;
  }
}
