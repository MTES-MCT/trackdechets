import React from "react";
import { BsffStatus, BsffSignatureType } from "generated/graphql/types";
import SignBsff from "./SignBsff";
import { SignReception } from "./SignReception";
import { BsffFragment } from "../types";

export interface WorkflowActionProps {
  form: BsffFragment;
  siret: string;
}

export function WorkflowAction(props: WorkflowActionProps) {
  const { form, siret } = props;

  switch (form.bsffStatus) {
    case BsffStatus.Initial:
      if (siret !== form.bsffEmitter?.company?.siret) return null;
      return (
        <SignBsff
          {...props}
          signatureType={BsffSignatureType.Emission}
          label="Signature émetteur"
          helptext="En signant, je confirme la remise du déchet au transporteur. La signature est horodatée."
        />
      );

    case BsffStatus.SignedByEmitter:
      if (siret !== form.bsffTransporter?.company?.siret) return null;
      return (
        <SignBsff
          {...props}
          signatureType={BsffSignatureType.Transport}
          label="Signature transporteur"
          helptext="En signant, je confirme l'emport du déchet. La signature est horodatée."
        />
      );

    case BsffStatus.Sent:
      if (siret !== form.bsffDestination?.company?.siret) return null;
      return <SignReception bsffId={form.id} />;

    default:
      return null;
  }
}
