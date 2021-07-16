import React from "react";
import {
  Bsdasri,
  BsdasriStatus,
  BsdasriSignatureType,
} from "generated/graphql/types";
import PublishBsdasri from "./PublishBsdasri";
import SignBsdasri from "./SignBsdasri";

export interface WorkflowActionProps {
  form: Bsdasri;
  siret: string;
}

const isPublishable = (form: Bsdasri) => {
  if (!form.isDraft) {
    return false;
  }
  if (form.bsdasriType === "GROUPING" && !form.regroupedBsdasris?.length) {
    return false;
  }
  return true;
};
export function WorkflowAction(props: WorkflowActionProps) {
  const { form, siret } = props;

  if (isPublishable(form)) {
    return <PublishBsdasri {...props} />;
  }
  switch (form["bsdasriStatus"]) {
    case BsdasriStatus.Initial: {
      if (form.isDraft) {
        return null;
      }
      if (siret === form.emitter?.company?.siret) {
        return (
          <SignBsdasri
            {...props}
            signatureType={BsdasriSignatureType.Emission}
          />
        );
      }
      return null;
    }
    case BsdasriStatus.SignedByProducer: {
      if (siret === form.transporter?.company?.siret) {
        return (
          <SignBsdasri
            {...props}
            signatureType={BsdasriSignatureType.Transport}
          />
        );
      }
      return null;
    }
    case BsdasriStatus.Sent: {
      if (siret === form.recipient?.company?.siret) {
        return (
          <SignBsdasri
            {...props}
            signatureType={BsdasriSignatureType.Reception}
          />
        );
      }
      return null;
    }
    case BsdasriStatus.Received: {
      if (siret === form.recipient?.company?.siret) {
        return (
          <SignBsdasri
            {...props}
            signatureType={BsdasriSignatureType.Operation}
          />
        );
      }
      return null;
    }
    default:
      return null;
  }
}
