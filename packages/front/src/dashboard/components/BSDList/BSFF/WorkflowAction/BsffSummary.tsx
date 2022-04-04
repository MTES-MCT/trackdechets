import * as React from "react";
import { Bsff } from "@trackdechets/codegen/src/front.gen";
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
