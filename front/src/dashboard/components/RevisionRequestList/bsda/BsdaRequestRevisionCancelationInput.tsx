import { Bsda, BsdaStatus } from "codegen-ui";
import React from "react";
import { Switch } from "../bsdd/request/Switch";

// If you modify this, also modify it in the backend
const CANCELLABLE_BSDA_STATUSES = [
  // BsdaStatus.Initial,
  // BsdaStatus.SignedByProducer,
  BsdaStatus.SignedByWorker,
  BsdaStatus.Sent
  // BsdaStatus.Processed,
  // BsdaStatus.Refused,
  // BsdaStatus.AwaitingChild,
  // BsdaStatus.Canceled,
];

interface Props {
  defaultValue?: boolean;
  bsda: Bsda;
  onChange: (value) => void;
}

const CANCELATION_MSG = `Si votre demande d'annulation est approuvée, ce bordereau passera au 
statut Annulé pour tous les acteurs du bordereau.`;

const CANCELATION_NOT_POSSIBLE_MSG = `Impossible d'annuler ce bordereau. Il est à un statut trop avancé.`;

export function BsdaRequestRevisionCancelationInput({
  defaultValue = false,
  bsda,
  onChange
}: Props) {
  const canBeCancelled = CANCELLABLE_BSDA_STATUSES.includes(bsda.status);

  return (
    <Switch
      title="Annuler le bordereau"
      defaultValue={defaultValue}
      disabled={!canBeCancelled}
      onChange={onChange}
    >
      {canBeCancelled ? CANCELATION_MSG : CANCELATION_NOT_POSSIBLE_MSG}
    </Switch>
  );
}
