import React from "react";
import { EmitterType, Form, FormStatus } from "generated/graphql/types";
import MarkAsSealed from "./MarkAsSealed";
import MarkAsReceived from "./MarkAsReceived";
import MarkAsAccepted from "./MarkAsAccepted";
import MarkAsProcessed from "./MarkAsProcessed";
import MarkAsTempStored from "./MarkAsTempStored";
import MarkAsResealed from "./MarkAsResealed";
import MarkAsTempStorerAccepted from "./MarkAsTempStorerAccepted";
import SignEmissionForm from "./SignEmissionForm";
import SignTransportForm from "./SignTransportForm";
import routes from "common/routes";
import { useRouteMatch } from "react-router-dom";

import {
  PrepareSegment,
  MarkSegmentAsReadyToTakeOver,
  TakeOverSegment,
} from "./segments";

export interface WorkflowActionProps {
  form: Form;
  siret: string;
  options?: { canSkipEmission: boolean };
}

export function WorkflowAction(props: WorkflowActionProps) {
  // siret prop contains either SIRET or a VAT number
  const { form, siret } = props;
  const isActTab = !!useRouteMatch(routes.dashboard.bsds.act);

  const isTempStorage = form.recipient?.isTempStorage;
  const isAppendix1 = form.emitter?.type === EmitterType.Appendix1;
  const isAppendix1Producer =
    form.emitter?.type === EmitterType.Appendix1Producer;

  switch (form.status) {
    case FormStatus.Draft:
      return <MarkAsSealed {...props} />;
    case FormStatus.Sealed: {
      if (isAppendix1) {
        return null;
      }

      if (isAppendix1Producer) {
        return (
          <>
            {[
              form.emitter?.company?.siret,
              form.ecoOrganisme?.siret,
              form.transporter?.company?.orgId,
            ].includes(siret) &&
              !form.emitter?.isPrivateIndividual && (
                <SignEmissionForm {...props} />
              )}

            {props.options?.canSkipEmission &&
              form.transporter?.company?.orgId === siret && (
                <SignTransportForm {...props} />
              )}
          </>
        );
      }

      if (
        [
          form.emitter?.company?.siret,
          form.ecoOrganisme?.siret,
          form.transporter?.company?.orgId,
        ].includes(siret)
      ) {
        return <SignEmissionForm {...props} />;
      }
      return null;
    }
    case FormStatus.SignedByProducer: {
      if (form.transporter?.company?.orgId === siret) {
        return <SignTransportForm {...props} />;
      }
      return null;
    }
    case FormStatus.Sent: {
      if (isAppendix1Producer) {
        return null;
      }

      if (siret === form.recipient?.company?.siret && isActTab) {
        if (isTempStorage) {
          return <MarkAsTempStored {...props} />;
        }
        return <MarkAsReceived {...props} />;
      }

      const transportSegments = form.transportSegments ?? [];
      const lastSegment = transportSegments[transportSegments.length - 1];

      if (form.currentTransporterOrgId === siret) {
        if (
          // there are no segments yet, current transporter can create one
          lastSegment == null ||
          // the last segment was taken over and current user is the current transporter
          // which means there are no pending transfers so they can create a new segment
          lastSegment.takenOverAt
        ) {
          return <PrepareSegment {...props} />;
        }
        if (
          // the last segment is still a draft
          !lastSegment.readyToTakeOver &&
          // that was created by the current user
          lastSegment.previousTransporterCompanySiret === siret
        ) {
          return <MarkSegmentAsReadyToTakeOver {...props} />;
        }
      }

      if (form.nextTransporterOrgId === siret && lastSegment.readyToTakeOver) {
        return <TakeOverSegment {...props} />;
      }

      return null;
    }
    case FormStatus.TempStored: {
      if (siret === form.recipient?.company?.siret) {
        return <MarkAsTempStorerAccepted {...props} />;
      }
      return null;
    }
    case FormStatus.TempStorerAccepted: {
      if (siret === form.recipient?.company?.siret) {
        return (
          <div className="tw-flex tw-space-x-2">
            <MarkAsProcessed {...props} />
            <MarkAsResealed {...props} />
          </div>
        );
      }
      return null;
    }
    case FormStatus.Resealed: {
      if (
        [
          form.recipient?.company?.siret,
          form.temporaryStorageDetail?.transporter?.company?.orgId,
        ].includes(siret)
      ) {
        return <SignEmissionForm {...props} />;
      }
      return null;
    }
    case FormStatus.SignedByTempStorer: {
      if (siret === form.temporaryStorageDetail?.transporter?.company?.orgId) {
        return <SignTransportForm {...props} />;
      }
      return null;
    }
    case FormStatus.Resent: {
      if (siret === form.temporaryStorageDetail?.destination?.company?.siret) {
        return <MarkAsReceived {...props} />;
      }
      return null;
    }
    case FormStatus.Received: {
      if (isAppendix1Producer) {
        return null;
      }

      if (
        (isTempStorage &&
          siret === form.temporaryStorageDetail?.destination?.company?.siret) ||
        (!isTempStorage && siret === form.recipient?.company?.siret)
      ) {
        return <MarkAsAccepted {...props} />;
      }
      return null;
    }
    case FormStatus.Accepted: {
      if (isAppendix1Producer) {
        return null;
      }

      if (!isTempStorage && siret === form.recipient?.company?.siret) {
        return (
          <div className="tw-flex tw-space-x-2">
            {!isAppendix1 && <MarkAsResealed {...props} />}
            <MarkAsProcessed {...props} />
          </div>
        );
      } else if (
        isTempStorage &&
        siret === form.temporaryStorageDetail?.destination?.company?.siret
      ) {
        return <MarkAsProcessed {...props} />;
      }
      return null;
    }
    default:
      return null;
  }
}
