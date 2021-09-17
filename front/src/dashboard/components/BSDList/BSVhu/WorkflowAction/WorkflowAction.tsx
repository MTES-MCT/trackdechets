import React from "react";
import { Bsvhu, BsvhuStatus } from "generated/graphql/types";
import PublishBsvhu from "./PublishBsvhu";
import { SignEmission } from "./SignEmission";
import { SignTransport } from "./SignTransport";
import { SignOperation } from "./SignOperation";

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
      return <SignEmission {...props} bsvhuId={form.id} />;

    case BsvhuStatus.SignedByProducer:
      if (siret !== form.transporter?.company?.siret) return null;
      return <SignTransport {...props} bsvhuId={form.id} />;

    case BsvhuStatus.Sent:
      if (siret !== form.destination?.company?.siret) return null;
      return <SignOperation {...props} bsvhuId={form.id} />;

    default:
      return null;
  }
}
