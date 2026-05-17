import { Bsff, BsffStatus } from "@td/codegen-ui";
import React from "react";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import {
  CANCELATION_MSG,
  CAN_BE_CANCELLED_LABEL
} from "../../Revision/wordingsRevision";

// If you modify this, also modify it in the backend
const CANCELLABLE_BSFF_STATUSES = [
  // BsffStatus.Initial,
  BsffStatus.Sent
  // BsffStatus.Processed,
  // BsffStatus.Refused,
  // BsffStatus.AwaitingChild,
  // BsffStatus.Canceled,
];

interface Props {
  bsff: Bsff;
  onChange: (value) => void;
}

const CANCELATION_NOT_POSSIBLE_MSG = `Impossible d'annuler ce bordereau. Il est à un statut trop avancé.`;

export function BsffRequestRevisionCancelationInput({ bsff, onChange }: Props) {
  const canBeCancelled = CANCELLABLE_BSFF_STATUSES.includes(bsff.status);

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
