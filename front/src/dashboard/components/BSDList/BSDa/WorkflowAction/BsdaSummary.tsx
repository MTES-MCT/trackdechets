import * as React from "react";
import { Bsda } from "generated/graphql/types";
import { BsdaWasteSummary } from "./BsdaWasteSummary";
import { BsdaJourneySummary } from "./BsdaJourneySummary";

interface BsdaSummaryProps {
  bsda: Bsda;
}

export function BsdaSummary({ bsda }: BsdaSummaryProps) {
  return (
    <>
      <BsdaWasteSummary bsda={bsda} />
      <BsdaJourneySummary bsda={bsda} />
    </>
  );
}
