import * as React from "react";
import { BsdaPickupSite } from "../../../generated/graphql/types";

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
