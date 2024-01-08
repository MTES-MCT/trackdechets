import * as React from "react";
import { Bsdasri, BsdasriType } from "@td/codegen-ui";

import { InitialDasris } from "../../../../detail/bsdasri/InitialDasris";

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
