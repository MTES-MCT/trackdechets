import * as React from "react";
import {
  BsdaPackaging,
  BsdaWaste,
  BsdaWeight
} from "../../../generated/graphql/types";

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
  return (
    <>
      <p>
        Consistance : {waste?.consistence ? CONSISTANCE[waste.consistence] : ""}
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
        "QUANTITÉE ESTIMÉE CONFORMÉMENT AU 5.4.1.1.3.2" de l'ADR 2023
      </p>
    </>
  );
}
