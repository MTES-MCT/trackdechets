import { Form as Bsdd, FormStatus } from "codegen-ui";
import React from "react";
import { Switch } from "./request/Switch";

// If you modify this, also modify it in the backend
const CANCELLABLE_BSDD_STATUSES = [
  // FormStatus.Draft,
  // FormStatus.Sealed,
  FormStatus.SignedByProducer,
  FormStatus.Sent,
  // FormStatus.Received,
  // FormStatus.Accepted,
  // FormStatus.Processed,
  // FormStatus.FollowedWithPnttd,
  // FormStatus.AwaitingGroup,
  // FormStatus.Grouped,
  // FormStatus.NoTraceability,
  // FormStatus.Refused,
  FormStatus.TempStored,
  FormStatus.TempStorerAccepted,
  FormStatus.Resealed,
  FormStatus.SignedByTempStorer,
  FormStatus.Resent
  // FormStatus.Canceled,
];

interface Props {
  defaultValue?: boolean;
  bsdd: Bsdd;
  onChange: (value) => void;
}

const CANCELATION_MSG = `Si votre demande d'annulation est approuvée, ce bordereau passera au 
statut Annulé pour tous les acteurs du bordereau.`;

const CANCELATION_NOT_POSSIBLE_MSG = `Impossible d'annuler ce bordereau. Il est à un statut trop avancé.`;

export function BsddRequestRevisionCancelationInput({
  defaultValue = false,
  bsdd,
  onChange
}: Props) {
  const canBeCancelled = CANCELLABLE_BSDD_STATUSES.includes(bsdd.status);

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
