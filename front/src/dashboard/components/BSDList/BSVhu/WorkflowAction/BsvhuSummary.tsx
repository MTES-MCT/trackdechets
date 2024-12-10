import * as React from "react";
import { Bsvhu } from "@td/codegen-ui";
import { BsvhuWasteSummary } from "./BsvhuWasteSummary";
import { BsvhuJourneySummary } from "../../../../../Apps/Dashboard/Validation/Bsvhu/BsvhuJourneySummary";

interface Props {
  bsvhu: Bsvhu;
}

export function BsvhuSummary({ bsvhu }: Props) {
  return (
    <>
      <BsvhuWasteSummary bsvhu={bsvhu} />
      <BsvhuJourneySummary bsvhu={bsvhu} />
    </>
  );
}
