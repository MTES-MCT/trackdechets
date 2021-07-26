import React from "react";
import { Bsda, BsdaStatus, BsdaSignatureType } from "generated/graphql/types";
import PublishBsda from "./PublishBsda";
import SignBsda from "./SignBsda";

export interface WorkflowActionProps {
  form: Bsda;
  siret: string;
}

export function WorkflowAction(props: WorkflowActionProps) {
  const { form, siret } = props;

  if (form.isDraft) {
    return <PublishBsda {...props} />;
  }
  switch (form["bsdaStatus"]) {
    case BsdaStatus.Initial:
      if (siret !== form.emitter?.company?.siret) return null;
      return <SignBsda {...props} signatureType={BsdaSignatureType.Emission} />;

    case BsdaStatus.SignedByProducer:
      if (siret !== form.worker?.company?.siret) return null;
      return <SignBsda {...props} signatureType={BsdaSignatureType.Work} />;

    case BsdaStatus.SignedByWorker:
      if (siret !== form.transporter?.company?.siret) return null;
      return (
        <SignBsda {...props} signatureType={BsdaSignatureType.Transport} />
      );

    case BsdaStatus.Sent:
      if (siret !== form.destination?.company?.siret) return null;
      return (
        <SignBsda {...props} signatureType={BsdaSignatureType.Operation} />
      );

    default:
      return null;
  }
}
