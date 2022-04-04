import * as React from "react";
import { BsdaPickupSite } from "@trackdechets/codegen/src/back.gen";

type Props = {
  pickupSite?: BsdaPickupSite;
};

export function PickupSite({ pickupSite }: Props) {
  return (
    <>
      <p>
        <strong>Informations chantier (si différente)</strong>
      </p>
      <p>
        Code chantier : {pickupSite?.name}
        <br />
        Adresse chantier : {pickupSite?.address} {pickupSite?.postalCode}{" "}
        {pickupSite?.city}
      </p>
    </>
  );
}
