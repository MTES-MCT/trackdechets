import React from "react";
import { BsffStatus } from "generated/graphql/types";
import { BsffFragment } from "../types";
import { SignEmission } from "./SignEmission";
import { SignTransport } from "./SignTransport";
import { SignReception } from "./SignReception";
import { SignOperation } from "./SignOperation";

export interface WorkflowActionProps {
  form: BsffFragment;
  siret: string;
}

export function WorkflowAction(props: WorkflowActionProps) {
  const { form, siret } = props;

  switch (form.bsffStatus) {
    case BsffStatus.Initial:
      if (siret !== form.bsffEmitter?.company?.siret) return null;
      return <SignEmission bsffId={form.id} />;

    case BsffStatus.SignedByEmitter:
      if (siret !== form.bsffTransporter?.company?.siret) return null;
      return <SignTransport bsffId={form.id} />;

    case BsffStatus.Sent:
      if (siret !== form.bsffDestination?.company?.siret) return null;
      return <SignReception bsffId={form.id} />;

    case BsffStatus.Received:
      if (siret !== form.bsffDestination?.company?.siret) return null;
      return <SignOperation bsffId={form.id} />;

    default:
      return null;
  }
}
