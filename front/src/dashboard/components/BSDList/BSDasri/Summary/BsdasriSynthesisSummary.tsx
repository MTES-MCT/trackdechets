import * as React from "react";
import { Bsdasri, BsdasriType } from "generated/graphql/types";

import { InitialDasris } from "dashboard/detail/bsdasri/InitialDasris";

export function BsdasriSynthesisSummary({ bsdasri }: { bsdasri: Bsdasri }) {
  if (bsdasri.type !== BsdasriType.Synthesis) {
    return null;
  }
  if (!bsdasri?.synthesizing?.length) {
    return <p>Aucun Bsd associé</p>;
  }
  return (
    <>
      <strong>Bsds associés</strong>
      <InitialDasris initialBsdasris={bsdasri?.synthesizing} />
    </>
  );
}
