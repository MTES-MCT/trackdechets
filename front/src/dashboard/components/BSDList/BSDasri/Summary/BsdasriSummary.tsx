import * as React from "react";
import { Bsdasri } from "codegen-ui";
import { BsdasriWasteSummary } from "./BsdasriWasteSummary";
import { BsdasriJourneySummary } from "./BsdasriJourneySummary";
import { BsdasriSynthesisSummary } from "./BsdasriSynthesisSummary";

interface BdasriSummaryProps {
  bsdasri: Bsdasri;
}

export function BdasriSummary({ bsdasri }: BdasriSummaryProps) {
  return (
    <>
      <BsdasriWasteSummary bsdasri={bsdasri} />
      <BsdasriJourneySummary bsdasri={bsdasri} />
      <BsdasriSynthesisSummary bsdasri={bsdasri} />
    </>
  );
}
