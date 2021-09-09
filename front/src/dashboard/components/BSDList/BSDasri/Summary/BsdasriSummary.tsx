import * as React from "react";
import { Bsdasri } from "generated/graphql/types";
import { BsdasriWasteSummary } from "./BsdasriWasteSummary";
import { BsdasriJourneySummary } from "./BsdasriJourneySummary";

interface BdasriSummary {
  bsdasri: Bsdasri;
}

export function BdasriSummary({ bsdasri }: BdasriSummary) {
  return (
    <>
      <BsdasriWasteSummary bsdasri={bsdasri} />
      <BsdasriJourneySummary bsdasri={bsdasri} />
    </>
  );
}
