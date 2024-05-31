import { Bsdasri, BsdasriStatus } from "@td/codegen-ui";
import React from "react";

import { ToggleSwitch } from "@codegouvfr/react-dsfr/ToggleSwitch";

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

const CANCELATION_MSG = `Si votre demande d'annulation est approuvée, ce bordereau passera au 
statut Annulé pour tous les acteurs du bordereau.`;

const CANCELATION_NOT_POSSIBLE_MSG = `Impossible d'annuler ce bordereau. Il est à un statut trop avancé.`;

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
        label="Annuler le bordereau"
        disabled={!canBeCancelled}
        inputTitle="cancellation"
        onChange={onChange}
        showCheckedHint={false}
        helperText="Un bordereau annulé n’est pas supprimé mais il n’apparait plus dans
          les différents dossiers."
      />
      {canBeCancelled ? CANCELATION_MSG : CANCELATION_NOT_POSSIBLE_MSG}
    </div>
  );
}
