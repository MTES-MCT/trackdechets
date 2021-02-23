import React from "react";
import { Form, FormStatus } from "generated/graphql/types";
import MarkAsSealed from "./MarkAsSealed";
import MarkAsReceived from "./MarkAsReceived";
import MarkAsAccepted from "./MarkAsAccepted";
import MarkAsProcessed from "./MarkAsProcessed";
import MarkAsTempStored from "./MarkAsTempStored";
import MarkAsResealed from "./MarkAsResealed";
import MarkAsTempStorerAccepted from "./MarkAsTempStorerAccepted";
import SignedByTransporter from "./SignedByTransporter";
import PrepareSegment from "./PrepareSegment";
import MarkSegmentAsReadyToTakeOver from "./MarkSegmentAsReadyToTakeOver";
import TakeOverSegment from "./TakeOverSegment";

export interface WorkflowActionProps {
  form: Form;
  siret: string;
}

export function WorkflowAction(props: WorkflowActionProps) {
  switch (props.form.status) {
    case FormStatus.Draft:
      return <MarkAsSealed {...props} />;
    case FormStatus.Sealed: {
      if (props.siret === props.form.transporter?.company?.siret) {
        return <SignedByTransporter {...props} />;
      }
      return null;
    }
    case FormStatus.Sent: {
      if (props.siret === props.form.recipient?.company?.siret) {
        if (props.form.recipient.isTempStorage) {
          return <MarkAsTempStored {...props} />;
        }
        return <MarkAsReceived {...props} />;
      }

      const transportSegments = props.form.transportSegments ?? [];
      const lastSegment = transportSegments[transportSegments.length - 1];

      if (props.form.currentTransporterSiret === props.siret) {
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
          lastSegment.previousTransporterCompanySiret === props.siret
        ) {
          return <MarkSegmentAsReadyToTakeOver {...props} />;
        }
      }

      if (
        props.form.nextTransporterSiret === props.siret &&
        lastSegment.readyToTakeOver
      ) {
        return <TakeOverSegment {...props} />;
      }

      return null;
    }
    case FormStatus.TempStored: {
      if (props.siret === props.form.recipient?.company?.siret) {
        return <MarkAsTempStorerAccepted {...props} />;
      }
      return null;
    }
    case FormStatus.TempStorerAccepted: {
      if (props.siret === props.form.recipient?.company?.siret) {
        return <MarkAsResealed {...props} />;
      }
      return null;
    }
    case FormStatus.Resealed: {
      if (
        props.siret ===
        props.form.temporaryStorageDetail?.transporter?.company?.siret
      ) {
        return <SignedByTransporter {...props} />;
      }
      return null;
    }
    case FormStatus.Resent: {
      if (
        props.siret ===
        props.form.temporaryStorageDetail?.destination?.company?.siret
      ) {
        return <MarkAsReceived {...props} />;
      }
      return null;
    }
    case FormStatus.Received: {
      if (props.siret === props.form.recipient?.company?.siret) {
        return <MarkAsAccepted {...props} />;
      }
      return null;
    }
    case FormStatus.Accepted: {
      if (props.siret === props.form.recipient?.company?.siret) {
        return <MarkAsProcessed {...props} />;
      }
      return null;
    }
    default:
      return null;
  }
}
