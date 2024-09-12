import * as React from "react";
import { Bspaoh } from "@td/codegen-ui";
import { BspaohWasteSummary } from "./BspaohWasteSummary";
import { BspaohJourneySummary } from "./BspaohJourneySummary";

interface BspaohSummaryProps {
  bspaoh: Bspaoh;
}

export function BspaohSummary({ bspaoh }: Readonly<BspaohSummaryProps>) {
  return (
    <>
      <BspaohWasteSummary bspaoh={bspaoh} />
      <BspaohJourneySummary bspaoh={bspaoh} />
    </>
  );
}
