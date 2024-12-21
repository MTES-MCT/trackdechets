import * as React from "react";
import type { BsdaPickupSite } from "@td/codegen-back";

type Props = {
  pickupSite?: BsdaPickupSite | null;
};

export function PickupSite({ pickupSite }: Props) {
  return (
    <>
      <p>
        <strong>Informations chantier (si différente)</strong>
      </p>
      <p>
        Nom du chantier / collecte : {pickupSite?.name}
        <br />
        Adresse chantier / collecte : {pickupSite?.address}{" "}
        {pickupSite?.postalCode} {pickupSite?.city}
      </p>
    </>
  );
}
