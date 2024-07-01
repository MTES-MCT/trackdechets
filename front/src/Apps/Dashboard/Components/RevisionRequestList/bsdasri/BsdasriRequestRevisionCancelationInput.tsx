import { Bsdasri, BsdasriStatus } from "@td/codegen-ui";
import React from "react";

import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";
import {
  CANCELATION_MSG,
  CANCELATION_NOT_POSSIBLE_MSG,
  CAN_BE_CANCELLED_LABEL
} from "../../Revision/wordingsRevision";

// If you modify this, also modify it in the backend
export const CANCELLABLE_BSDASRI_STATUSES: BsdasriStatus[] = [
  // BsdasriStatus.INITIAL,
  // BsdasriStatus.SIGNED_BY_PRODUCER,
  BsdasriStatus.Sent
  // BsdasriStatus.RECEIVED,
  // BsdasriStatus.PROCESSED,
  // BsdasriStatus.AWAITING_GROUP,
  // BsdasriStatus.CANCELED
  // BsdasriStatus.REFUSED,
  // BsdasriStatus.REFUSED_BY_RECIPIENT
];

interface Props {
  bsdasri: Bsdasri;
  onChange: (value) => void;
}

export function BsdasriRequestRevisionCancelationInput({
  bsdasri,
  onChange
}: Props) {
  const canBeCancelled = CANCELLABLE_BSDASRI_STATUSES.includes(
    bsdasri["bsdasriStatus"]
  );

  return (
    <div>
      <ToggleSwitch
        label={CAN_BE_CANCELLED_LABEL}
        disabled={!canBeCancelled}
        inputTitle="cancellation"
        onChange={onChange}
        showCheckedHint={false}
        helperText="Un bordereau annulé n'est pas supprimé mais il n'apparait plus dans
          les différents dossiers."
      />
      {canBeCancelled ? CANCELATION_MSG : CANCELATION_NOT_POSSIBLE_MSG}
    </div>
  );
}
