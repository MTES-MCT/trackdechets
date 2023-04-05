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
export function WasteDetails({ waste, packagings, weight }: Props) {
  return (
    <>
      <p>
        Consistance : {waste?.consistence ? CONSISTANCE[waste.consistence] : ""}
        <br />
        Quantité en tonnes : {weight?.value}{" "}
        <input type="checkbox" checked={!weight?.isEstimate} readOnly /> Réelle
        <br />
        <input
          type="checkbox"
          checked={Boolean(weight?.isEstimate)}
          readOnly
        />{" "}
        Estimée
      </p>
    </>
  );
}
