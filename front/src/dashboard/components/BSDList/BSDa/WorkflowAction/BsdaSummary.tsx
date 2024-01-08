import * as React from "react";
import { Bsda } from "@td/codegen-ui";
import { BsdaWasteSummary } from "./BsdaWasteSummary";
import { BsdaJourneySummary } from "./BsdaJourneySummary";
import { InitialBsdas } from "../../../../detail/bsda/InitialBsdas";
import { DataListTerm } from "../../../../../common/components";

interface BsdaSummaryProps {
  bsda: Bsda;
}

export function BsdaSummary({ bsda }: BsdaSummaryProps) {
  const initialBsdas = bsda.forwarding ? [bsda.forwarding] : bsda.grouping;

  return (
    <>
      <BsdaWasteSummary bsda={bsda} />
      {!!initialBsdas?.length && (
        <div className="tw-pb-4">
          <DataListTerm>Bsdas associés</DataListTerm>
          <InitialBsdas bsdas={initialBsdas} />
        </div>
      )}
      <BsdaJourneySummary bsda={bsda} />
    </>
  );
}
