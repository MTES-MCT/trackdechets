import React from "react";
import { Bsda, BsdaStatus } from "@td/codegen-ui";
import PublishBsda from "./PublishBsda";
import { SignEmission } from "./SignEmission";
import { SignWork } from "./SignWork";
import { SignTransport } from "./SignTransport";
import { SignOperation } from "./SignOperation";

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
      if (form["bsdaType"] === "COLLECTION_2710") {
        return siret === form.destination?.company?.siret ? (
          <SignOperation {...props} bsdaId={form.id} />
        ) : null;
      }
      if (
        form.emitter?.isPrivateIndividual &&
        form.worker?.isDisabled &&
        siret === form.transporter?.company?.orgId
      ) {
        return <SignTransport {...props} bsdaId={form.id} />;
      }
      if (
        form.emitter?.isPrivateIndividual &&
        siret === form.worker?.company?.siret
      ) {
        return <SignWork {...props} bsdaId={form.id} />;
      }
      if (siret !== form.emitter?.company?.siret) return null;
      return <SignEmission {...props} bsdaId={form.id} />;

    case BsdaStatus.SignedByProducer:
      if (
        form["bsdaType"] === "GATHERING" ||
        form["bsdaType"] === "RESHIPMENT" ||
        form.worker?.isDisabled
      ) {
        return siret === form.transporter?.company?.orgId ? (
          <SignTransport {...props} bsdaId={form.id} />
        ) : null;
      }
      if (siret !== form.worker?.company?.siret) return null;
      return <SignWork {...props} bsdaId={form.id} />;

    case BsdaStatus.SignedByWorker:
      if (siret !== form.transporter?.company?.orgId) return null;
      return <SignTransport {...props} bsdaId={form.id} />;

    case BsdaStatus.Sent:
      if (siret !== form.destination?.company?.siret) return null;
      return <SignOperation {...props} bsdaId={form.id} />;

    default:
      return null;
  }
}
