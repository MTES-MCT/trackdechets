import * as React from "react";
import type { BsdaPackaging, BsdaWaste, BsdaWeight } from "@td/codegen-back";
import { isDefined } from "../../../common/helpers";

type Props = {
  waste?: BsdaWaste | null;
  packagings?: BsdaPackaging[] | null;
  weight?: BsdaWeight | null;
};

const CONSISTANCE = {
  OTHER: "Autre",
  PULVERULENT: "Pulvérulents",
  SOLIDE: "Solide"
};
export function WasteDetails({ waste, weight }: Props) {
  const displayADRArticle =
    Boolean(weight?.isEstimate) &&
    (!isDefined(waste?.isSubjectToADR) || waste?.isSubjectToADR === true);

  return (
    <>
      <p>
        Consistance : {waste?.consistence ? CONSISTANCE[waste.consistence] : ""}{" "}
        {waste?.consistenceDescription
          ? ` (${waste.consistenceDescription})`
          : ""}
        <br />
        Quantité en tonnes : {weight?.value} <br />
        {/* intentional strict equality for empy templates */}
        <input
          type="checkbox"
          checked={weight?.isEstimate === false}
          readOnly
        />{" "}
        Réelle
        <br />
        <input
          type="checkbox"
          checked={Boolean(weight?.isEstimate)}
          readOnly
        />{" "}
        Estimée
        <br />
        {displayADRArticle && (
          <>"QUANTITÉ ESTIMÉE CONFORMÉMENT AU 5.4.1.1.3.2 de l'ADR"</>
        )}
      </p>
    </>
  );
}
