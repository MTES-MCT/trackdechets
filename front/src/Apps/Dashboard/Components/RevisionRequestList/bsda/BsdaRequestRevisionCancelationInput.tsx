import { Bsda, BsdaStatus } from "@td/codegen-ui";
import React from "react";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import {
  CANCELATION_MSG,
  CAN_BE_CANCELLED_LABEL
} from "../../Revision/wordingsRevision";

// If you modify this, also modify it in the backend
const CANCELLABLE_BSDA_STATUSES = [
  // BsdaStatus.Initial,
  BsdaStatus.SignedByProducer,
  BsdaStatus.SignedByWorker,
  BsdaStatus.Sent
  // BsdaStatus.Processed,
  // BsdaStatus.Refused,
  // BsdaStatus.AwaitingChild,
  // BsdaStatus.Canceled,
];

interface Props {
  bsda: Bsda;
  onChange: (value) => void;
}

const CANCELATION_NOT_POSSIBLE_MSG = `Impossible d'annuler ce bordereau. Il est à un statut trop avancé.`;

export function BsdaRequestRevisionCancelationInput({ bsda, onChange }: Props) {
  const canBeCancelled = CANCELLABLE_BSDA_STATUSES.includes(bsda.status);

  return (
    <>
      <ToggleSwitch
        label={CAN_BE_CANCELLED_LABEL}
        inputTitle="cancellation"
        disabled={!canBeCancelled}
        onChange={onChange}
        helperText={
          canBeCancelled ? CANCELATION_MSG : CANCELATION_NOT_POSSIBLE_MSG
        }
      />
      <hr className="fr-mt-2w" />
    </>
  );
}
