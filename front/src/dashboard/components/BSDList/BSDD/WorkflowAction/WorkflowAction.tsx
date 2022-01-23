import React from "react";
import { CommonBsd, CommonBsdStatus } from "generated/graphql/types";
import MarkAsSealed from "./MarkAsSealed";

import MarkAsAccepted from "./MarkAsAccepted";
import MarkAsProcessed from "./MarkAsProcessed";
import MarkAsTempStored from "./MarkAsTempStored";
import MarkAsResealed from "./MarkAsResealed";
import MarkAsTempStorerAccepted from "./MarkAsTempStorerAccepted";
import { SignedByTransporter } from "./SignedByTransporter/SignedByTransporter";
import PrepareSegment from "./PrepareSegment";
import MarkSegmentAsReadyToTakeOver from "./MarkSegmentAsReadyToTakeOver";
import TakeOverSegment from "./TakeOverSegment";
import { useRouteMatch } from "react-router-dom";
import routes from "common/routes";
import MarkAsReceived from "dashboard/components/BSDList/BSDD/WorkflowAction/MarkAsReceived";
export interface WorkflowActionProps {
  bsd: CommonBsd;
  siret: string;
  usedInTab?: boolean;
}

export function WorkflowAction(props: WorkflowActionProps) {
  const { bsd, siret, usedInTab = false } = props;

  // prevent action button to appear in wrong tabs when siret plays several roles on the bsd
  const isActTabRoute = !!useRouteMatch(routes.dashboard.bsds.act);
  const isToCollectTabRoute = !!useRouteMatch(
    routes.dashboard.transport.toCollect
  );
  const isActTab = usedInTab ? isActTabRoute : true;
  const isToCollectTab = usedInTab ? isToCollectTabRoute : true;

  const isTempStorage = bsd?.bsdd?.temporaryStorage?.recipientIsTempStorage;
  switch (bsd.status) {
    case CommonBsdStatus.Draft:
      return <MarkAsSealed {...props} />;
    case CommonBsdStatus.Sealed: {
      if (siret === bsd.transporter?.company?.siret && isToCollectTab) {
        return <SignedByTransporter {...props} />;
      }
      return null;
    }
    case CommonBsdStatus.Sent: {
      if (siret === bsd.destination?.company?.siret && isActTab) {
        if (isTempStorage) {
          return <MarkAsTempStored {...props} />;
        }
        return <MarkAsReceived {...props} />;
      }

      if (bsd.bsdd?.currentTransporterSiret === siret) {
        if (
          // there are no segments yet, current transporter can create one
          !bsd.bsdd?.lastSegment ||
          // the last segment was taken over and current user is the current transporter
          // which means there are no pending transfers so they can create a new segment
          bsd.bsdd?.lastSegment.takenOver
        ) {
          return <PrepareSegment {...props} />;
        }

        if (
          // the last segment is still a draft
          !bsd.bsdd?.lastSegment.readyToTakeOver &&
          // that was created by the current user
          bsd.bsdd?.lastSegment?.previousTransporterCompanySiret === siret
        ) {
          return <MarkSegmentAsReadyToTakeOver {...props} />;
        }
      }

      if (
        bsd.bsdd?.nextTransporterSiret === siret &&
        bsd.bsdd?.lastSegment?.readyToTakeOver
      ) {
        return <TakeOverSegment {...props} />;
      }

      return null;
    }
    case CommonBsdStatus.TempStored: {
      if (siret === bsd.destination?.company?.siret) {
        return <MarkAsTempStorerAccepted {...props} />;
      }
      return null;
    }
    case CommonBsdStatus.TempStorerAccepted: {
      if (siret === bsd.destination?.company?.siret) {
        return <MarkAsResealed {...props} />;
      }
      return null;
    }
    case CommonBsdStatus.Resealed: {
      if (siret === bsd?.bsdd?.temporaryStorage?.transporterCompanySiret) {
        return <SignedByTransporter {...props} />;
      }
      return null;
    }
    case CommonBsdStatus.Resent: {
      if (siret === bsd?.bsdd?.temporaryStorage?.destinationCompanySiret) {
        return <MarkAsReceived {...props} />;
      }
      return null;
    }
    case CommonBsdStatus.Received: {
      if (
        (isTempStorage &&
          siret === bsd?.bsdd?.temporaryStorage?.destinationCompanySiret) ||
        (!isTempStorage && siret === bsd.destination?.company?.siret)
      ) {
        return <MarkAsAccepted {...props} />;
      }
      return null;
    }
    case CommonBsdStatus.Accepted: {
      if (
        (isTempStorage &&
          siret === bsd?.bsdd?.temporaryStorage?.destinationCompanySiret) ||
        (!isTempStorage && siret === bsd.destination?.company?.siret)
      ) {
        return <MarkAsProcessed {...props} />;
      }

      return null;
    }
    default:
      return null;
  }
}
