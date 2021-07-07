import React from "react";
import {
  Bsvhu,
  BsvhuStatus,
  SignatureTypeInput,
} from "generated/graphql/types";
import PublishBsvhu from "./PublishBsvhu";
import SignBsvhu from "./SignBsvhu";

export interface WorkflowActionProps {
  form: Bsvhu;
  siret: string;
}

export function WorkflowAction(props: WorkflowActionProps) {
  const { form, siret } = props;

  if (form.isDraft) {
    return <PublishBsvhu {...props} />;
  }
  switch (form["bsvhuStatus"]) {
    case BsvhuStatus.Initial:
      if (siret !== form.emitter?.company?.siret) return null;
      return (
        <SignBsvhu {...props} signatureType={SignatureTypeInput.Emission} />
      );

    case BsvhuStatus.SignedByProducer:
      if (siret !== form.transporter?.company?.siret) return null;
      return (
        <SignBsvhu {...props} signatureType={SignatureTypeInput.Transport} />
      );

    case BsvhuStatus.Sent:
      if (siret !== form.destination?.company?.siret) return null;
      return (
        <SignBsvhu {...props} signatureType={SignatureTypeInput.Operation} />
      );

    default:
      return null;
  }
}
