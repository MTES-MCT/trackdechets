import * as React from "react";
import { Bsff } from "@td/codegen-ui";
import { BsffWasteSummary } from "./BsffWasteSummary";
import { BsffJourneySummary } from "./BsffJourneySummary";

interface BsffSummaryProps {
  bsff: Bsff;
}

export function BsffSummary({ bsff }: BsffSummaryProps) {
  return (
    <>
      <BsffWasteSummary bsff={bsff} />
      <BsffJourneySummary bsff={bsff} />
    </>
  );
}
