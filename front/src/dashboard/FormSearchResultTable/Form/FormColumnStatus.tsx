import * as React from "react";
import { FormSearchResult, FormStatus } from "generated/graphql/types";

interface FormColumnStatusProps {
  searchResult: FormSearchResult;
}

const LABELS = {
  [FormStatus.Draft]: "Brouillon",
  [FormStatus.Sealed]: "En attente de collecte par le transporteur",
  [FormStatus.Sent]: "En attente de réception",
  [FormStatus.Received]: "Reçu, en attente d'acceptation ou de refus",
  [FormStatus.Accepted]: "Accepté, en attente de traitement",
  [FormStatus.Processed]: "Traité",
  [FormStatus.AwaitingGroup]: "Traité, en attente de regroupement",
  [FormStatus.Grouped]: "Annexé à un bordereau de regroupement",
  [FormStatus.NoTraceability]:
    "Regroupé, avec autorisation de perte de traçabilité",
  [FormStatus.Refused]: "Refusé",
  [FormStatus.TempStored]:
    "Arrivé à l'entreposage provisoire, en attente d'acceptation",
  [FormStatus.TempStorerAccepted]:
    "Entreposé temporairement ou en reconditionnement",
  [FormStatus.Resent]: "En attente de réception pour traitement",
  [FormStatus.Resealed]:
    "En attente de collecte par le transporteur après entreposage provisoire",
};

export function FormColumnStatus({ searchResult }: FormColumnStatusProps) {
  return <>{LABELS[searchResult.status]}</>;
}
